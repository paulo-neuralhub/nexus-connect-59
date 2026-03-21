// ============================================================
// Numbers Tab — Virtual number management
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Info } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface VirtualNumber {
  id: string;
  phone_number: string;
  organization_id: string;
  country_code: string;
  number_type: string;
  monthly_cost: number;
  status: string;
  purchased_at: string;
  org_name?: string;
}

export function NumbersTab() {
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  const { data: numbers = [], isLoading } = useQuery({
    queryKey: ['bo-telephony-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_numbers')
        .select('*')
        .order('purchased_at', { ascending: false });
      if (error) throw error;

      const orgIds = [...new Set((data || []).map((n: any) => n.organization_id))];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));

      return (data || []).map((n: any): VirtualNumber => ({
        ...n,
        org_name: orgMap.get(n.organization_id) || n.organization_id.slice(0, 8),
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{numbers.length} números registrados</p>
        <Button onClick={() => setShowBuyDialog(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Comprar número
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Coste/mes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono font-medium">{n.phone_number}</TableCell>
                  <TableCell>{n.org_name}</TableCell>
                  <TableCell>{n.country_code}</TableCell>
                  <TableCell><Badge variant="outline">{n.number_type}</Badge></TableCell>
                  <TableCell className="text-right font-mono">€{Number(n.monthly_cost).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={n.status === 'active' ? 'default' : 'secondary'}>{n.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(n.purchased_at), 'dd/MM/yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {numbers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay números registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar número virtual</DialogTitle>
            <DialogDescription>
              Para buscar y comprar números disponibles, necesitas configurar un proveedor CPaaS.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Conecta Telnyx para buscar números disponibles</p>
              <p className="mt-1">
                Ve a la pestaña <strong>Proveedores</strong> y configura el API Key de Telnyx.
                Una vez activo, podrás buscar y comprar números directamente desde aquí.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowBuyDialog(false)}>Cerrar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
