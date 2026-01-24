/**
 * Portal Catálogo de Servicios
 * Servicios disponibles para solicitar
 */

import { useState } from 'react';
import { useServiceCatalog } from '@/hooks/use-service-catalog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalCatalog() {
  const catalogQuery = useServiceCatalog();
  const services = catalogQuery.data ?? [];

  const handleRequest = (serviceName: string) => {
    // TODO: Crear deal/tarea para el despacho
    toast.success(`Solicitud de "${serviceName}" registrada. El despacho se pondrá en contacto.`);
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
        <p className="text-muted-foreground">
          Servicios disponibles para tu organización
        </p>
      </div>

      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge key={cat} variant="outline">
              <Tag className="w-3 h-3 mr-1" />
              {cat}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{service.name}</CardTitle>
                {service.category && (
                  <Badge variant="secondary" className="text-xs">
                    {service.category}
                  </Badge>
                )}
              </div>
              {service.description && (
                <CardDescription className="text-sm line-clamp-3">
                  {service.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(service.base_price, service.currency)}
                </p>
                <p className="text-xs text-muted-foreground">Precio base</p>
              </div>
              <Button onClick={() => handleRequest(service.name)} className="w-full gap-2">
                <ShoppingCart className="w-4 h-4" />
                Solicitar servicio
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && !catalogQuery.isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No hay servicios disponibles en este momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
