/**
 * SP01-C + SP02-A — Spider Watch Sheet (create/edit)
 * Lateral sheet with form validation (weights must sum 100%).
 * SP02-A: logo upload + brand_authorized_handles tag input.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/lib/supabase';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watch: any | null; // null = new
  config: any | null;
}

const JURISDICTION_GROUPS = [
  { label: 'Europa', codes: ['EU', 'ES', 'DE', 'FR', 'IT', 'GB', 'PT', 'NL', 'BE'] },
  { label: 'Norteamérica', codes: ['US', 'CA', 'MX'] },
  { label: 'Asia-Pacífico', codes: ['JP', 'CN', 'KR', 'AU', 'IN'] },
  { label: 'Internacional', codes: ['WO'] },
];

const QUICK_PRESETS: { label: string; codes: string[] }[] = [
  { label: 'Solo UE', codes: ['EU'] },
  { label: 'UE + US', codes: ['EU', 'US'] },
  { label: 'Iberia', codes: ['ES', 'PT'] },
];

const NICE_CLASSES = Array.from({ length: 45 }, (_, i) => i + 1);

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function SpiderWatchSheet({ open, onOpenChange, watch, config }: Props) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const qc = useQueryClient();
  const isEdit = !!watch;

  // Form state
  const [name, setName] = useState('');
  const [watchType, setWatchType] = useState('trademark');
  const [niceClasses, setNiceClasses] = useState<number[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(70);
  const [checkPhonetic, setCheckPhonetic] = useState(true);
  const [checkSemantic, setCheckSemantic] = useState(true);
  const [checkVisual, setCheckVisual] = useState(true);
  const [weightPhonetic, setWeightPhonetic] = useState(35);
  const [weightSemantic, setWeightSemantic] = useState(30);
  const [weightVisual, setWeightVisual] = useState(35);
  const [scanFrequency, setScanFrequency] = useState('daily');
  const [niceSearch, setNiceSearch] = useState('');

  // SP02-A: Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SP02-A: Brand authorized handles
  const [handles, setHandles] = useState<string[]>([]);
  const [handleInput, setHandleInput] = useState('');

  // Reset form on open
  useEffect(() => {
    if (open) {
      if (watch) {
        setName(watch.watch_name || '');
        setWatchType(watch.watch_type || 'trademark');
        setNiceClasses(Array.isArray(watch.nice_classes) ? watch.nice_classes : []);
        setJurisdictions(Array.isArray(watch.jurisdictions) ? watch.jurisdictions : []);
        setThreshold(watch.similarity_threshold ?? 70);
        setCheckPhonetic((watch.weight_phonetic ?? 0) > 0);
        setCheckSemantic((watch.weight_semantic ?? 0) > 0);
        setCheckVisual((watch.weight_visual ?? 0) > 0);
        setWeightPhonetic(watch.weight_phonetic ?? 35);
        setWeightSemantic(watch.weight_semantic ?? 30);
        setWeightVisual(watch.weight_visual ?? 35);
        setScanFrequency(watch.scan_frequency || 'daily');
        setExistingLogoUrl(watch.mark_image_url || null);
        setHandles(Array.isArray(watch.brand_authorized_handles) ? watch.brand_authorized_handles : []);
      } else {
        setName('');
        setWatchType('trademark');
        setNiceClasses([]);
        setJurisdictions([]);
        setThreshold(70);
        setCheckPhonetic(true);
        setCheckSemantic(true);
        setCheckVisual(true);
        setWeightPhonetic(35);
        setWeightSemantic(30);
        setWeightVisual(35);
        setScanFrequency('daily');
        setExistingLogoUrl(null);
        setHandles([]);
      }
      setNiceSearch('');
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);
      setHandleInput('');
    }
  }, [open, watch]);

  const totalWeight = (checkPhonetic ? weightPhonetic : 0) + (checkSemantic ? weightSemantic : 0) + (checkVisual ? weightVisual : 0);
  const weightsValid = totalWeight === 100;
  const canSave = name.trim().length > 0 && weightsValid && niceClasses.length > 0;

  const domainDisabled = !config?.domain_watch_enabled;
  const realtimeDisabled = !config?.realtime_scan_enabled;
  const showLogoField = watchType === 'device' || watchType === 'combined';

  const filteredNice = useMemo(() => {
    if (!niceSearch) return NICE_CLASSES;
    return NICE_CLASSES.filter(c => String(c).includes(niceSearch));
  }, [niceSearch]);

  const toggleNiceClass = (c: number) => {
    setNiceClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c].sort((a, b) => a - b));
  };

  const toggleJurisdiction = (code: string) => {
    setJurisdictions(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code]);
  };

  const applyPreset = (codes: string[]) => {
    setJurisdictions(codes);
  };

  // ── Logo handling ──
  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Formato no soportado. Usa PNG, JPG o SVG.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo supera 2MB. Reduce el tamaño e inténtalo de nuevo.');
      return;
    }
    setLogoFile(file);
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (e.target) e.target.value = '';
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (existingLogoUrl) setRemoveLogo(true);
  };

  // ── Handles ──
  const addHandle = () => {
    const h = handleInput.trim();
    if (h && !handles.includes(h)) {
      setHandles(prev => [...prev, h]);
      setHandleInput('');
    }
  };

  const removeHandle = (h: string) => {
    setHandles(prev => prev.filter(x => x !== h));
  };

  // ── Upload helper ──
  const uploadLogo = async (watchId: string): Promise<string | null> => {
    if (!logoFile || !orgId) return null;
    const ext = logoFile.name.split('.').pop() || 'png';
    const path = `${orgId}/${watchId}.${ext}`;
    const { error } = await supabase.storage
      .from('spider-logos')
      .upload(path, logoFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('spider-logos')
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        watch_name: name.trim(),
        watch_type: watchType,
        nice_classes: niceClasses,
        jurisdictions,
        similarity_threshold: threshold,
        weight_phonetic: checkPhonetic ? weightPhonetic : 0,
        weight_semantic: checkSemantic ? weightSemantic : 0,
        weight_visual: checkVisual ? weightVisual : 0,
        check_phonetic: checkPhonetic,
        check_semantic: checkSemantic,
        check_visual: checkVisual,
        scan_frequency: scanFrequency,
        organization_id: orgId,
        brand_authorized_handles: handles.length > 0 ? handles : null,
      };

      if (isEdit) {
        const { organization_id: _, ...updatePayload } = payload;

        // Handle logo upload/removal
        if (logoFile) {
          const url = await uploadLogo(watch.id);
          if (url) updatePayload.mark_image_url = url;
        } else if (removeLogo) {
          updatePayload.mark_image_url = null;
        }

        const { error } = await supabase
          .from('spider_watches' as any)
          .update(updatePayload as any)
          .eq('id', watch.id)
          .eq('organization_id', orgId!);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('spider_watches' as any)
          .insert(payload as any)
          .select('id')
          .single();
        if (error) throw error;

        // Upload logo for new watch
        if (logoFile && inserted?.id) {
          const url = await uploadLogo(inserted.id);
          if (url) {
            await supabase
              .from('spider_watches' as any)
              .update({ mark_image_url: url } as any)
              .eq('id', inserted.id)
              .eq('organization_id', orgId!);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spider-watches-panel'] });
      qc.invalidateQueries({ queryKey: ['spider-kpis'] });
      qc.invalidateQueries({ queryKey: ['spider-shell-config'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al guardar la vigilancia');
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Editar: ${watch.watch_name}` : 'Nueva Vigilancia'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* 1: Name */}
          <div className="space-y-1.5">
            <Label htmlFor="watch-name">Nombre *</Label>
            <Input
              id="watch-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. TECHFLOW"
            />
          </div>

          {/* 2: Type */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={watchType} onValueChange={setWatchType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trademark">Trademark</SelectItem>
                <SelectItem value="device">Device</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
                <SelectItem value="domain" disabled={domainDisabled}>
                  Domain {domainDisabled && <Badge variant="outline" className="ml-1 text-[9px]">PROFESSIONAL+</Badge>}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3: Logo upload — only for device/combined */}
          {showLogoField && (
            <div className="space-y-1.5">
              <Label>Logo de la marca</Label>
              {/* Preview state */}
              {(logoPreview || (existingLogoUrl && !removeLogo)) ? (
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                  <img
                    src={logoPreview || existingLogoUrl!}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded border border-border bg-background"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Cambiar logo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-destructive hover:text-destructive"
                      onClick={clearLogo}
                    >
                      <X className="w-3 h-3 mr-1" /> Eliminar logo
                    </Button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  className="flex flex-col items-center justify-center gap-2 h-[120px] border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground text-center">
                    Arrastra tu logo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    PNG, SVG o JPG · Máx 2MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* 4: Nice Classes */}
          <div className="space-y-1.5">
            <Label>Clases Nice *</Label>
            <Input
              placeholder="Buscar clase..."
              value={niceSearch}
              onChange={e => setNiceSearch(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded-md">
              {filteredNice.map(c => {
                const selected = niceClasses.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleNiceClass(c)}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {niceClasses.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Seleccionadas: {niceClasses.join(', ')}
              </p>
            )}
          </div>

          {/* 5: Jurisdictions */}
          <div className="space-y-1.5">
            <Label>Jurisdicciones</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {QUICK_PRESETS.map(p => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => applyPreset(p.codes)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {JURISDICTION_GROUPS.map(g => (
              <div key={g.label} className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground">{g.label}</p>
                <div className="flex flex-wrap gap-1">
                  {g.codes.map(code => {
                    const selected = jurisdictions.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => toggleJurisdiction(code)}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 6: Threshold & Weights */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Umbral mínimo: {threshold}%</Label>
              <Slider
                value={[threshold]}
                onValueChange={v => setThreshold(v[0])}
                min={50}
                max={95}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <WeightRow
                label="Fonética"
                checked={checkPhonetic}
                onCheckedChange={setCheckPhonetic}
                weight={weightPhonetic}
                onWeightChange={setWeightPhonetic}
              />
              <WeightRow
                label="Semántica"
                checked={checkSemantic}
                onCheckedChange={setCheckSemantic}
                weight={weightSemantic}
                onWeightChange={setWeightSemantic}
              />
              <WeightRow
                label="Visual"
                checked={checkVisual}
                onCheckedChange={setCheckVisual}
                weight={weightVisual}
                onWeightChange={setWeightVisual}
                disabled={config?.feature_visual === false}
              />
            </div>

            <p className={cn(
              'text-xs flex items-center gap-1',
              weightsValid ? 'text-green-600' : 'text-red-500'
            )}>
              {weightsValid
                ? <><Check className="w-3 h-3" /> Los pesos suman 100%</>
                : <><AlertTriangle className="w-3 h-3" /> Los pesos deben sumar 100% (actual: {totalWeight}%)</>
              }
            </p>
          </div>

          {/* 7: Frequency */}
          <div className="space-y-1.5">
            <Label>Frecuencia</Label>
            <Select value={scanFrequency} onValueChange={setScanFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diaria</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="realtime" disabled={realtimeDisabled}>
                  Tiempo real {realtimeDisabled && <Badge variant="outline" className="ml-1 text-[9px]">ENTERPRISE</Badge>}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 8: Brand authorized handles */}
          <div className="space-y-1.5">
            <Label>Handles oficiales autorizados (opcional)</Label>
            <p className="text-[10px] text-muted-foreground">
              Cuentas propias que NO deben generar alertas
            </p>
            {handles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {handles.map(h => (
                  <Badge key={h} variant="secondary" className="pl-2 pr-1 gap-1 text-xs">
                    {h}
                    <button
                      type="button"
                      onClick={() => removeHandle(h)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={handleInput}
                onChange={e => setHandleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addHandle(); }
                }}
                placeholder="@cuenta_oficial_marca"
                className="flex-1 h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={addHandle}
                disabled={!handleInput.trim()}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function WeightRow({
  label,
  checked,
  onCheckedChange,
  weight,
  onWeightChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  weight: number;
  onWeightChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={v => onCheckedChange(!!v)}
        disabled={disabled}
      />
      <span className="text-xs w-20">{label}</span>
      <Input
        type="number"
        min={0}
        max={100}
        value={checked ? weight : 0}
        onChange={e => onWeightChange(Number(e.target.value))}
        disabled={!checked || disabled}
        className="h-7 w-16 text-xs text-center tabular-nums"
      />
      <span className="text-xs text-muted-foreground">%</span>
    </div>
  );
}
