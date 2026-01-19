import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useMarketListings, useToggleFavorite, useMarketFavorites } from '@/hooks/use-market';
import { 
  ASSET_TYPE_CONFIG, 
  TRANSACTION_TYPE_CONFIG,
  type AssetType,
  type TransactionType 
} from '@/types/market.types';
import { ListingCard } from '@/components/market/listings/ListingCard';

export default function MarketDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  
  const { data: listings, isLoading } = useMarketListings({
    status: 'active',
    asset_type: assetTypeFilter !== 'all' ? assetTypeFilter as AssetType : undefined,
    transaction_type: transactionTypeFilter !== 'all' ? transactionTypeFilter as TransactionType : undefined,
    search: searchQuery || undefined,
  });

  const { data: favorites } = useMarketFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const favoriteIds = favorites?.map(f => f.listing_id) || [];

  // Stats simulados por ahora
  const stats = {
    activeListings: listings?.length || 0,
    totalTransactions: 156,
    totalVolume: 2450000,
    activeUsers: 342
  };

  const handleFavoriteToggle = (listingId: string) => {
    const isFav = favoriteIds.includes(listingId);
    toggleFavorite.mutate({ listingId, isFavorite: isFav });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listings Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeListings}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(stats.totalVolume / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">+23% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">+5% desde el mes pasado</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar activos de PI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de activo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(ASSET_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.labelEs}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de transacción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(TRANSACTION_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.labelEs}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link to="/app/market/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Crear Listing
          </Link>
        </Button>
      </div>

      {/* Featured Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Marcas</h3>
                <p className="text-muted-foreground text-sm">Marcas registradas y solicitudes</p>
                <p className="text-2xl font-bold mt-2">45 activos</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">®️</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Patentes</h3>
                <p className="text-muted-foreground text-sm">Patentes y modelos de utilidad</p>
                <p className="text-2xl font-bold mt-2">28 activos</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">📜</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50 dark:border-green-800/50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Dominios</h3>
                <p className="text-muted-foreground text-sm">Dominios web premium</p>
                <p className="text-2xl font-bold mt-2">67 activos</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Listings Recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/market/listings">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((listing: any) => (
                <ListingCard 
                  key={listing.id} 
                  listing={{
                    id: listing.id,
                    title: listing.title,
                    description: listing.description,
                    price: listing.asking_price || 0,
                    currency: listing.currency || 'EUR',
                    is_featured: listing.is_featured,
                    is_negotiable: listing.price_type === 'negotiable',
                    views_count: listing.views_count,
                    created_at: listing.created_at,
                    transaction_types: listing.transaction_types || [listing.transaction_type],
                    asset: {
                      type: listing.asset?.asset_type,
                      jurisdiction: listing.asset?.jurisdictions?.[0],
                      images: listing.asset?.images,
                      is_verified: listing.asset?.is_verified,
                    }
                  }}
                  isFavorite={favoriteIds.includes(listing.id)}
                  onFavoriteToggle={() => handleFavoriteToggle(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay listings activos</h3>
              <p className="text-muted-foreground mb-4">Sé el primero en publicar un activo de PI</p>
              <Button asChild>
                <Link to="/app/market/listings/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Listing
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
