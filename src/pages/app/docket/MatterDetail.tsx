import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMatter } from '@/hooks/use-matters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MatterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: matter, isLoading } = useMatter(id!);
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (!matter) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Expediente no encontrado</p>
            <Button variant="link" onClick={() => navigate('/app/docket')}>
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/docket')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">{matter.reference}</p>
          <h1 className="text-2xl font-bold">{matter.title}</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalle del expediente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            🚧 Vista de detalle en construcción. Próximamente en <strong>Prompt 2C</strong>.
          </p>
          <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
            {JSON.stringify(matter, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
