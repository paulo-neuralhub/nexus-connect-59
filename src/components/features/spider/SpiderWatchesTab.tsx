/**
 * Spider Watches Tab — list + 3-step creation modal
 */
import { useState, useRef } from 'react';
import { Plus, Radar, Upload, X, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSpiderWatches, useCreateSpiderWatch, useSpiderTenantConfig } from '@/hooks/use-spider-data';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { NICE_CLASSES_LABELS } from '@/lib/constants/spider';
import { JURISDICTIONS } from '@/lib/constants/matters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SpiderWatchesTab() {
  const { data: watches, isLoading } = useSpiderWatches();
  const { data: config } = useSpiderTenantConfig();
  const [showModal, setShowModal] = useState(false);

  const atLimit = config && config.max_watches > 0 && (watches?.length ?? 0) >= config.max_watches;

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{watches?.length || 0} vigilancias activas</p>
        <Button
          size="sm"
          onClick={() => atLimit ? toast.error('Has alcanzado el límite de vigilancias de tu plan') : setShowModal(true)}
          disabled={!!atLimit}
        >
          <Plus className="w-4 h-4 mr-1" /> Nueva vigilancia
        </Button>
      </div>

      {!watches?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Radar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin vigilancias configuradas</p>
          <p className="text-sm mt-1">Crea tu primera vigilancia para empezar a monitorizar</p>
          <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Crear vigilancia
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {watches.map((w: any) => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                <Radar className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{w.watch_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[10px]">{w.watch_type}</Badge>
                  {w.jurisdictions?.slice(0, 3).map((j: string) => (
                    <Badge key={j} variant="outline" className="text-[10px]">{j}</Badge>
                  ))}
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${w.is_active ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-muted text-muted-foreground'}`}>
                {w.is_active ? 'Activo' : 'Pausado'}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewWatchModal open={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function NewWatchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const { currentOrganization } = useOrganization();
  const createWatch = useCreateSpiderWatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    watch_name: '',
    watch_type: 'text' as 'text' | 'image' | 'combined',
    description: '',
    terms: [] as string[],
    classes: [] as number[],
    jurisdictions: [] as string[],
    similarity_threshold: 70,
    image_url: '',
  });
  const [newTerm, setNewTerm] = useState('');

  const addTerm = () => {
    const t = newTerm.trim();
    if (t && !form.terms.includes(t)) {
      setForm(p => ({ ...p, terms: [...p.terms, t] }));
      setNewTerm('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }

    setUploading(true);
    try {
      const path = `${currentOrganization.id}/logos/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('spider-assets').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('spider-assets').getPublicUrl(path);
      setForm(p => ({ ...p, image_url: urlData.publicUrl }));
      toast.success('Logo subido');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.watch_name.trim()) { toast.error('Nombre requerido'); return; }
    if (form.watch_type !== 'image' && form.terms.length === 0) { toast.error('Añade al menos un término'); return; }

    try {
      await createWatch.mutateAsync({
        watch_name: form.watch_name,
        watch_type: form.watch_type,
        description: form.description,
        terms: form.terms,
        nice_classes: form.classes,
        jurisdictions: form.jurisdictions,
        similarity_threshold: form.similarity_threshold,
        image_url: form.image_url || null,
        is_active: true,
      });
      toast.success('Vigilancia creada. Se ejecutará el primer escaneo automáticamente.');
      onClose();
    } catch {
      toast.error('Error al crear vigilancia');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva vigilancia — Paso {step} de 3</DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[#8B5CF6]' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={form.watch_name} onChange={e => setForm(p => ({ ...p, watch_name: e.target.value }))} placeholder="Ej: Vigilancia NEXUS" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de vigilancia</label>
              <div className="grid grid-cols-3 gap-2">
                {(['text', 'image', 'combined'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(p => ({ ...p, watch_type: t }))}
                    className={cn('p-3 rounded-lg border-2 text-center text-xs font-medium transition-all', form.watch_type === t ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' : 'border-border')}
                  >
                    {t === 'text' ? '📝 Texto' : t === 'image' ? '🖼️ Imagen' : '🔄 Combinada'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Descripción opcional..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {form.watch_type !== 'image' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Términos a vigilar *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.terms.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full text-xs">
                      {t} <button onClick={() => setForm(p => ({ ...p, terms: p.terms.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} placeholder="Añadir término..." className="flex-1" />
                  <Button variant="secondary" size="sm" onClick={addTerm}>Añadir</Button>
                </div>
              </div>
            )}
            {(form.watch_type === 'image' || form.watch_type === 'combined') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {form.image_url ? (
                  <div className="relative inline-block">
                    <img src={form.image_url} alt="Logo" className="max-h-32 rounded-lg border" />
                    <button onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full p-6 border-2 border-dashed rounded-xl hover:border-[#8B5CF6]/50 flex flex-col items-center gap-2">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">Subir logo (máx. 5MB)</span>
                  </button>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Clases Niza</label>
              <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                {Object.entries(NICE_CLASSES_LABELS).map(([num, label]) => {
                  const n = parseInt(num);
                  const selected = form.classes.includes(n);
                  return (
                    <button key={n} onClick={() => setForm(p => ({ ...p, classes: selected ? p.classes.filter(c => c !== n) : [...p.classes, n].sort((a,b) => a-b) }))}
                      className={cn('p-1.5 rounded text-[10px] border transition-colors', selected ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6]' : 'border-border text-muted-foreground hover:border-muted-foreground/30')}
                      title={label}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdicciones</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                {(JURISDICTIONS || []).slice(0, 30).map((j: any) => {
                  const code = typeof j === 'string' ? j : j.code;
                  const label = typeof j === 'string' ? j : j.name || j.code;
                  const selected = form.jurisdictions.includes(code);
                  return (
                    <button key={code} onClick={() => setForm(p => ({ ...p, jurisdictions: selected ? p.jurisdictions.filter(x => x !== code) : [...p.jurisdictions, code] }))}
                      className={cn('p-2 rounded text-xs border text-left transition-colors', selected ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6]' : 'border-border text-muted-foreground hover:border-muted-foreground/30')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Umbral de similitud: {form.similarity_threshold}%</label>
              <input type="range" min={30} max={95} value={form.similarity_threshold} onChange={e => setForm(p => ({ ...p, similarity_threshold: parseInt(e.target.value) }))} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Más resultados</span><span>Más precisión</span>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Resumen</p>
              <p className="text-xs text-muted-foreground">Nombre: {form.watch_name || '—'}</p>
              <p className="text-xs text-muted-foreground">Tipo: {form.watch_type}</p>
              <p className="text-xs text-muted-foreground">Términos: {form.terms.join(', ') || '—'}</p>
              <p className="text-xs text-muted-foreground">Clases: {form.classes.join(', ') || 'Todas'}</p>
              <p className="text-xs text-muted-foreground">Jurisdicciones: {form.jurisdictions.join(', ') || 'Todas'}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
            )}
          </div>
          <div>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createWatch.isPending}>
                {createWatch.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Crear vigilancia
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
