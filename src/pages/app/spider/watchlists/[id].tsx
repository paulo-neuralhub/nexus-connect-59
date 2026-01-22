import { Link, useParams } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Pause, Eye } from "lucide-react";
import { useUpdateWatchlist, useWatchlist, useWatchResults } from "@/hooks/use-spider";
import { WatchResultCard } from "@/components/features/spider/watch-result-card";

export default function WatchlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageTitle("Vigilancia");

  const watchlist = useWatchlist(id ?? "");
  const results = useWatchResults(id ? { watchlist_id: id } : undefined);
  const update = useUpdateWatchlist();

  const isActive = !!watchlist.data?.is_active;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app/spider">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {watchlist.isLoading ? "Cargando…" : watchlist.data?.name ?? "Vigilancia"}
            </h1>
            <p className="text-muted-foreground">Detalle y resultados asociados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {watchlist.data?.is_active != null && (
            <Button
              variant="secondary"
              disabled={update.isPending}
              onClick={() => {
                if (!id) return;
                update.mutate({ id, data: { is_active: !isActive } });
              }}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" /> Activar
                </>
              )}
            </Button>
          )}
          <Button asChild>
            <Link to="/app/spider/results">
              <Eye className="w-4 h-4 mr-2" /> Ver resultados
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {watchlist.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-80" />
            </div>
          ) : !watchlist.data ? (
            <div className="text-sm text-muted-foreground">No se encontró la vigilancia.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={watchlist.data.is_active ? "default" : "secondary"}>
                  {watchlist.data.is_active ? "Activa" : "Pausada"}
                </Badge>
                {watchlist.data.type ? <Badge variant="outline">{watchlist.data.type}</Badge> : null}
              </div>

              {Array.isArray(watchlist.data.watch_terms) && watchlist.data.watch_terms.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {watchlist.data.watch_terms.map((t: string, idx: number) => (
                    <Badge key={`${t}-${idx}`} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin términos configurados.</div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Resultados</h2>
          <p className="text-sm text-muted-foreground">Últimos resultados detectados para esta vigilancia</p>
        </div>

        {results.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : (results.data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Aún no hay resultados para esta vigilancia.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.data?.slice(0, 10).map((r) => (
              <WatchResultCard key={r.id} result={r} onViewDetail={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
