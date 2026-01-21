import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopPage } from '@/types/analytics';

interface TopPagesCardProps {
  data?: TopPage[];
  isLoading?: boolean;
}

export function TopPagesCard({ data, isLoading }: TopPagesCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Páginas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxViews = data?.[0]?.views || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Páginas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((page, i) => (
            <div key={page.path} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{page.path}</p>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(page.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {page.views.toLocaleString()}
              </span>
            </div>
          ))}
          
          {(!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos disponibles
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
