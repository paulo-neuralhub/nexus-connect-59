import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  Filter
} from 'lucide-react';
import { useMarketListings, useToggleFavorite, useMarketFavorites } from '@/hooks/use-market';
import { 
  ASSET_TYPE_CONFIG, 
  TRANSACTION_TYPE_CONFIG,
  type AssetType,
  type TransactionType,
  type ListingStatus
} from '@/types/market.types';
import { ListingCard } from '@/components/market/listings/ListingCard';
import { ListingGrid } from '@/components/market/listings/ListingGrid';

export default function ListingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: listings, isLoading } = useMarketListings({
    status: statusFilter,
    asset_type: assetTypeFilter !== 'all' ? assetTypeFilter as AssetType : undefined,
    transaction_type: transactionTypeFilter !== 'all' ? transactionTypeFilter as TransactionType : undefined,
    search: searchQuery || undefined,
  });

  const { data: favorites } = useMarketFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const favoriteIds = favorites?.map(f => f.listing_id) || [];

  const handleFavoriteToggle = (listingId: string) => {
    const isFav = favoriteIds.includes(listingId);
    toggleFavorite.mutate({ listingId, isFavorite: isFav });
  };

  // Transform listings to the format expected by ListingCard
  const transformedListings = listings?.map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.asking_price || 0,
    currency: listing.currency || 'EUR',
    is_featured: listing.is_featured,
    is_negotiable: listing.price_type === 'negotiable',
    views_count: listing.views_count,
    created_at: listing.created_at,
    published_at: listing.published_at,
    transaction_types: listing.transaction_types || [listing.transaction_type],
    asset: {
      type: listing.asset?.asset_type,
      jurisdiction: listing.asset?.jurisdictions?.[0],
      images: listing.asset?.images,
      is_verified: listing.asset?.is_verified,
      verification_status: listing.asset?.verification_status,
    },
    seller: listing.seller,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Transacción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(TRANSACTION_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.labelEs}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild>
            <Link to="/app/market/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListingStatus)}>
        <TabsList>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="pending_verification">Pendientes</TabsTrigger>
          <TabsTrigger value="sold">Vendidos</TabsTrigger>
          <TabsTrigger value="expired">Expirados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      <ListingGrid
        listings={transformedListings}
        isLoading={isLoading}
        favoriteIds={favoriteIds}
        onFavoriteToggle={handleFavoriteToggle}
        columns={viewMode === 'grid' ? 3 : 2}
        variant={viewMode === 'list' ? 'compact' : 'default'}
      />

      {!isLoading && (!listings || listings.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron listings</h3>
            <p className="text-muted-foreground mb-4">
              Intenta ajustar los filtros o crea un nuevo listing
            </p>
            <Button asChild>
              <Link to="/app/market/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Crear Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
