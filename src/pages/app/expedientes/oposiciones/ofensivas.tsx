import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Swords, Search, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOppositions } from '@/hooks/useOppositions';
import { usePageTitle } from '@/contexts/page-context';
import { STATUS_CONFIG, OUTCOME_CONFIG, getDeadlineUrgency } from '@/components/oposiciones/oposiciones-utils';
import { OppositionDetailSheet } from '@/components/oposiciones/OppositionDetailSheet';
import type { Opposition } from '@/hooks/useOppositions';

export default function OfensivasPage() {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  const { data: oppositions = [], isLoading } = useOppositions('offensive');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Opposition | null>(null);

  useEffect(() => { setTitle('Oposiciones Ofensivas'); }, [setTitle]);

  const filtered = oppositions.filter((o) =>
    !search || [o.title, o.opposed_mark_name, o.opponent_name, o.matter_ref].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/expedientes/oposiciones')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Swords className="h-5 w-5 text-purple-600" />
          <h1 className="text-xl font-bold">Ofensivas</h1>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-1" /> Nueva Oposición
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Marca Opuesta</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Jurisdicción</TableHead>
              <TableHead>Fecha Filing</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin oposiciones ofensivas</TableCell></TableRow>
            ) : (
              filtered.map((o) => {
                const sCfg = STATUS_CONFIG[o.status] || { label: o.status, variant: 'outline' as const };
                const oCfg = o.outcome ? OUTCOME_CONFIG[o.outcome] : null;
                return (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(o)}>
                    <TableCell><Badge variant={sCfg.variant}>{sCfg.label}</Badge></TableCell>
                    <TableCell className="font-medium">{o.opposed_mark_name || o.title}</TableCell>
                    <TableCell>{o.opponent_name || '—'}</TableCell>
                    <TableCell>{o.opposed_mark_jurisdiction || '—'}</TableCell>
                    <TableCell>{o.filing_date ? format(new Date(o.filing_date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>
                      {oCfg ? <Badge style={{ backgroundColor: oCfg.color, color: '#fff' }}>{oCfg.label}</Badge> : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <OppositionDetailSheet opposition={selected} open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </div>
  );
}
