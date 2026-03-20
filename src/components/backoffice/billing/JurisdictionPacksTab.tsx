import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Search, Save } from 'lucide-react';
import { useBillingAddons, useUpdateBillingAddon, type BillingAddon } from '@/hooks/useBillingData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function JurisdictionPacksTab() {
  const { data: packs = [] } = useBillingAddons('jurisdiction_pack');
  const [selectedPack, setSelectedPack] = useState<BillingAddon | null>(null);

  return (
    <div className="flex gap-6">
      {/* Sidebar list */}
      <div className="w-[30%] space-y-2">
        {packs.map(p => (
          <div
            key={p.id}
            onClick={() => setSelectedPack(p)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${
              selectedPack?.id === p.id
                ? 'border-[hsl(217,91%,60%)] bg-blue-50/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <h4 className="font-semibold text-sm text-slate-900">{p.name_es}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{p.description_es}</p>
            <p className="text-sm font-bold text-slate-700 mt-2">€{Number(p.price_monthly_eur)}/mes</p>
            <p className="text-[10px] text-slate-400">{p.jurisdiction_codes?.length || 0} países</p>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div className="flex-1">
        {selectedPack ? (
          <PackDetail pack={selectedPack} onUpdate={() => setSelectedPack(null)} />
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
            Selecciona un pack para ver/editar sus países
          </div>
        )}
      </div>
    </div>
  );
}

function PackDetail({ pack, onUpdate }: { pack: BillingAddon; onUpdate: () => void }) {
  const update = useUpdateBillingAddon();
  const [codes, setCodes] = useState<string[]>(pack.jurisdiction_codes || []);
  const [priceMonthly, setPriceMonthly] = useState(Number(pack.price_monthly_eur));
  const [priceAnnual, setPriceAnnual] = useState(Number(pack.price_annual_eur));
  const [showAdd, setShowAdd] = useState(false);

  // Reset when pack changes
  useMemo(() => {
    setCodes(pack.jurisdiction_codes || []);
    setPriceMonthly(Number(pack.price_monthly_eur));
    setPriceAnnual(Number(pack.price_annual_eur));
  }, [pack.id]);

  const { data: offices = [] } = useQuery({
    queryKey: ['ipo-offices-for-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipo_offices')
        .select('id, code, name, country_name, flag_emoji')
        .order('name');
      if (error) throw error;
      return data as Array<{ id: string; code: string; name: string; country_name: string | null; flag_emoji: string | null }>;
    },
  });

  const removeCountry = (c: string) => setCodes(prev => prev.filter(x => x !== c));

  const save = () => {
    update.mutate(
      { id: pack.id, jurisdiction_codes: codes, price_monthly_eur: priceMonthly, price_annual_eur: priceAnnual },
      { onSuccess: () => { toast.success('Pack actualizado'); onUpdate(); } }
    );
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{pack.name_es}</h3>
        <Button onClick={save} disabled={update.isPending} size="sm">
          <Save className="w-4 h-4 mr-1" /> Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Precio/mes (€)</Label><Input type="number" value={priceMonthly} onChange={e => setPriceMonthly(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>Precio anual/mes (€)</Label><Input type="number" value={priceAnnual} onChange={e => setPriceAnnual(parseFloat(e.target.value) || 0)} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Países incluidos ({codes.length})</Label>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3 mr-1" /> Añadir país
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {codes.map(c => {
            const office = offices.find(o => o.code === c);
            return (
              <span key={c} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs">
                {office?.flag_emoji} {office?.country_name || c}
                <button onClick={() => removeCountry(c)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <AddCountryDialog
          offices={offices.filter(o => !codes.includes(o.code))}
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onAdd={(c) => { setCodes(prev => [...prev, c]); }}
        />
      )}
    </div>
  );
}

function AddCountryDialog({
  offices,
  open,
  onClose,
  onAdd,
}: {
  offices: Array<{ code: string; name: string; country_name: string | null; flag_emoji: string | null }>;
  open: boolean;
  onClose: () => void;
  onAdd: (code: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = offices.filter(o =>
    (o.name + (o.country_name || '') + o.code).toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Añadir país</DialogTitle></DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar oficina o país..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map(o => (
            <button
              key={o.code}
              onClick={() => { onAdd(o.code); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm text-left"
            >
              <span>{o.flag_emoji}</span>
              <span>{o.country_name || o.name}</span>
              <span className="ml-auto text-slate-400 text-xs">{o.code}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
