import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Handshake, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useOppositions } from '@/hooks/useOppositions';
import { usePageTitle } from '@/contexts/page-context';
import { STATUS_CONFIG } from '@/components/oposiciones/oposiciones-utils';
import { OppositionDetailSheet } from '@/components/oposiciones/OppositionDetailSheet';
import type { Opposition } from '@/hooks/useOppositions';

export default function CoexistenciasPage() {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  const { data: oppositions = [], isLoading } = useOppositions('coexistence');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Opposition | null>(null);

  useEffect(() => { setTitle('Coexistencias'); }, [setTitle]);

  const filtered = oppositions.filter((o) =>
    !search || [o.title, o.opposed_mark_name, o.mark_name, o.opponent_name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/expedientes/oposiciones')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Handshake className="h-5 w-5 text-green-600" />
          <h1 className="text-xl font-bold">Coexistencias</h1>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca A</TableHead>
              <TableHead>Marca B</TableHead>
              <TableHead>Jurisdicción</TableHead>
              <TableHead>Fecha Acuerdo</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin acuerdos de coexistencia</TableCell></TableRow>
            ) : (
              filtered.map((o) => {
                const sCfg = STATUS_CONFIG[o.status] || { label: o.status, variant: 'outline' as const };
                return (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(o)}>
                    <TableCell className="font-medium">{o.mark_name || o.title}</TableCell>
                    <TableCell>{o.opposed_mark_name || '—'}</TableCell>
                    <TableCell>{o.opposed_mark_jurisdiction || '—'}</TableCell>
                    <TableCell>{o.resolution_date ? format(new Date(o.resolution_date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>{o.coexistence_expiry_date ? format(new Date(o.coexistence_expiry_date), 'dd/MM/yyyy') : 'Indefinida'}</TableCell>
                    <TableCell><Badge variant={sCfg.variant}>{sCfg.label}</Badge></TableCell>
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
