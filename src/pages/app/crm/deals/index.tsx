import { usePageTitle } from '@/contexts/page-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Plus } from 'lucide-react';
import { useDeals } from '@/hooks/use-crm';
import { cn } from '@/lib/utils';

export default function DealList() {
  usePageTitle('Deals');

  const { data: deals = [], isLoading } = useDeals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground">Gestiona tus oportunidades de venta</p>
        </div>
        <Button disabled>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Deal
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aún no tienes deals</h3>
              <p className="text-muted-foreground max-w-md">
                Cuando crees oportunidades en CRM aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {deals.map((d: any) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{d.title}</p>
                      {d.status && (
                        <Badge variant={d.status === 'open' ? 'secondary' : 'outline'} className="text-xs">
                          {String(d.status).toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {d.contact?.name ? <span>Contacto: {d.contact.name}</span> : null}
                      {d.stage?.name ? <span>Etapa: {d.stage.name}</span> : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={cn('text-sm font-semibold', d.value ? 'text-foreground' : 'text-muted-foreground')}>
                      {d.value ? `${Number(d.value).toLocaleString()} ${d.currency || 'EUR'}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">{d.expected_close_date ? `Cierre: ${d.expected_close_date}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
