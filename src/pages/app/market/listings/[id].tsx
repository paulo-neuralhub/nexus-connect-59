import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MessageSquare, 
  Shield, 
  Clock, 
  Eye, 
  Star,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useMarketListing, useToggleFavorite, useMarketFavorites } from '@/hooks/use-market';
import { AssetTypeBadge } from '@/components/market/shared/AssetTypeBadge';
import { TransactionTypeBadge } from '@/components/market/shared/TransactionTypeBadge';
import { VerificationBadge } from '@/components/market/shared/VerificationBadge';
import { PriceDisplay } from '@/components/market/shared/PriceDisplay';
import { JurisdictionFlag } from '@/components/market/shared/JurisdictionFlag';
import { LISTING_STATUS_CONFIG, type AssetType, type TransactionType, type ListingStatus } from '@/types/market.types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: listing, isLoading, error } = useMarketListing(id);
  const { data: favorites } = useMarketFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const favoriteIds = favorites?.map(f => f.listing_id) || [];
  const isFavorite = id ? favoriteIds.includes(id) : false;

  const handleFavoriteToggle = () => {
    if (!id) return;
    toggleFavorite.mutate({ listingId: id, isFavorite });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: (listing as any)?.title,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Listing no encontrado</h2>
        <p className="text-muted-foreground mb-4">El listing que buscas no existe o ha sido eliminado.</p>
        <Button onClick={() => navigate('/app/market/listings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Listings
        </Button>
      </div>
    );
  }

  // Cast to any for flexible property access
  const listingData = listing as any;
  const assetData = listingData.asset || {};
  const sellerData = listingData.seller || {};

  const statusConfig = LISTING_STATUS_CONFIG[listingData.status as ListingStatus];
  const mainImage = assetData.images?.[0] || '/placeholder.svg';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{listingData.title}</h1>
              {listingData.is_featured && (
                <Badge className="bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Destacado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Clock className="h-4 w-4" />
              Publicado {formatDistanceToNow(new Date(listingData.created_at), { addSuffix: true, locale: es })}
              <span className="mx-1">•</span>
              <Eye className="h-4 w-4" />
              {listingData.view_count || listingData.views_count || 0} visitas
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleFavoriteToggle}
            className={cn(isFavorite && 'text-red-500')}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img 
                  src={mainImage} 
                  alt={listingData.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {assetData.asset_type && (
                    <AssetTypeBadge type={assetData.asset_type as AssetType} />
                  )}
                  <VerificationBadge 
                    status={assetData.verification_status === 'verified' ? 'verified' : 'unverified'}
                  />
                </div>
                <Badge 
                  className="absolute top-4 right-4"
                  style={{ 
                    backgroundColor: statusConfig?.color + '20',
                    borderColor: statusConfig?.color,
                    color: statusConfig?.color 
                  }}
                >
                  {statusConfig?.labelEs || listingData.status}
                </Badge>
              </div>
              {assetData.images && assetData.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {assetData.images.map((img: string, i: number) => (
                    <div 
                      key={i} 
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 ring-primary"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {listingData.description || 'Sin descripción disponible.'}
              </p>
            </CardContent>
          </Card>

          {/* Asset Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Activo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Activo</p>
                  {assetData.asset_type && (
                    <AssetTypeBadge type={assetData.asset_type as AssetType} className="mt-1" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdicción</p>
                  {(assetData.jurisdiction || assetData.jurisdictions?.[0]) && (
                    <JurisdictionFlag 
                      jurisdiction={assetData.jurisdiction || assetData.jurisdictions?.[0]} 
                      className="mt-1" 
                    />
                  )}
                </div>
                {assetData.registration_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nº de Registro</p>
                    <p className="font-medium mt-1">{assetData.registration_number}</p>
                  </div>
                )}
                {assetData.filing_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Solicitud</p>
                    <p className="font-medium mt-1">
                      {format(new Date(assetData.filing_date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              {assetData.nice_classes && assetData.nice_classes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Clases Nice</p>
                    <div className="flex flex-wrap gap-2">
                      {assetData.nice_classes.map((nc: number) => (
                        <Badge key={nc} variant="outline">Clase {nc}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transaction Types */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Transacción Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(listingData.transaction_types || []).map((type: TransactionType) => (
                  <TransactionTypeBadge key={type} type={type} size="md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <PriceDisplay 
                amount={listingData.asking_price || listingData.price || 0} 
                currency={listingData.currency || 'EUR'} 
                size="xl"
                showNegotiable
                isNegotiable={listingData.is_negotiable || listingData.price_type === 'negotiable'}
              />

              <Separator className="my-6" />

              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar Vendedor
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Hacer Oferta
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Transacción protegida por IP-NEXUS</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Card */}
          {sellerData.id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={sellerData.avatar_url} />
                    <AvatarFallback>
                      {sellerData.display_name?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{sellerData.display_name}</p>
                      {(sellerData.is_verified_agent || sellerData.kyc_level >= 4) && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Agente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {(sellerData.rating_average || sellerData.rating || 0).toFixed(1)}
                      <span className="mx-1">•</span>
                      {sellerData.total_sales || sellerData.completed_transactions || 0} ventas
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to={`/app/market/seller/${sellerData.id}`}>
                    Ver Perfil
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Similar Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Listings Similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                Próximamente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
