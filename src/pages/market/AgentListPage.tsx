import { useState } from 'react';
import { Users, TrendingUp, BadgeCheck } from 'lucide-react';
import { useMarketUsers, useMarketUserStats } from '@/hooks/market/useMarketUsers';
import { AgentCard, AgentFilters } from '@/components/market/agents';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketUserFilters } from '@/types/market-users';

export default function AgentListPage() {
  const [filters, setFilters] = useState<MarketUserFilters>({});
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    isError,
    error 
  } = useMarketUsers(filters);
  
  const { data: stats } = useMarketUserStats();
  
  const agents = data?.pages.flatMap(p => p.users) || [];

  const handleSearch = (search: string) => {
    setFilters(f => ({ ...f, search: search || undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Directorio de Agentes de PI</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra profesionales verificados en propiedad intelectual
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalAgents || 0}</p>
            <p className="text-sm text-muted-foreground">Agentes registrados</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.verifiedAgents || 0}</p>
            <p className="text-sm text-muted-foreground">Profesionales verificados</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">50+</p>
            <p className="text-sm text-muted-foreground">Jurisdicciones cubiertas</p>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <AgentFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />
      
      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Agentes
          <span className="text-muted-foreground font-normal ml-2">
            ({agents.length} resultados)
          </span>
        </h2>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">
            Error al cargar agentes: {(error as Error)?.message}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      )}
      
      {/* Results Grid */}
      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent}
                onContact={() => console.log('Contact', agent.id)}
                onRequestQuote={() => console.log('Quote', agent.id)}
              />
            ))}
          </div>
          
          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Cargando...' : 'Cargar más agentes'}
              </Button>
            </div>
          )}
          
          {/* Empty State */}
          {agents.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
              <p className="text-muted-foreground mb-4">
                Prueba a ajustar los filtros de búsqueda
              </p>
              <Button variant="outline" onClick={() => setFilters({})}>
                Limpiar filtros
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
