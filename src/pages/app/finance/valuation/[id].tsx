// src/pages/app/finance/valuation/[id].tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  BarChart3,
  Calculator,
  Trash2,
  Edit,
  Calendar
} from 'lucide-react';
import { 
  usePortfolio, 
  usePortfolioAssets, 
  useAddAssetToPortfolio,
  useRemoveAssetFromPortfolio,
  useUpdatePortfolio 
} from '@/hooks/finance/usePortfolioValuation';
import { useAssetValuations } from '@/hooks/finance/useAssetValuation';
import { ValuationWizard } from '@/components/features/ip-finance/ValuationWizard';
import { PortfolioPerformanceChart } from '@/components/features/ip-finance/PortfolioPerformanceChart';
import { AssetAllocationChart } from '@/components/features/ip-finance/AssetAllocationChart';
import { EmptyState } from '@/components/ui/empty-state';
import type { AssetType } from '@/types/ip-finance.types';

const assetTypeLabels: Record<AssetType, string> = {
  trademark: 'Marca',
  patent: 'Patente',
  design: 'Diseño',
  copyright: 'Copyright',
  trade_secret: 'Secreto comercial',
  domain: 'Dominio',
  software: 'Software',
  other: 'Otro'
};

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(id!);
  const { data: assets, isLoading: assetsLoading } = usePortfolioAssets(id!);
  const addAsset = useAddAssetToPortfolio();
  const removeAsset = useRemoveAssetFromPortfolio();
  const updatePortfolio = useUpdatePortfolio();
  
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showValuationWizard, setShowValuationWizard] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    title: '',
    asset_type: 'trademark' as AssetType,
    registration_number: '',
    jurisdiction: '',
    acquisition_date: '',
    acquisition_cost: 0,
    notes: ''
  });

  const [editPortfolioData, setEditPortfolioData] = useState({
    name: portfolio?.name || '',
    description: portfolio?.description || ''
  });

  // Fetch valuations for each asset
  const assetIds = assets?.map(a => a.id) || [];
  const { data: valuations } = useAssetValuations(assetIds);

  const handleAddAsset = async () => {
    if (!id) return;
    await addAsset.mutateAsync({
      portfolioId: id,
      asset: {
        ...newAsset,
        acquisition_cost: Number(newAsset.acquisition_cost) || 0
      }
    });
    setShowAddAsset(false);
    setNewAsset({
      title: '',
      asset_type: 'trademark',
      registration_number: '',
      jurisdiction: '',
      acquisition_date: '',
      acquisition_cost: 0,
      notes: ''
    });
  };

  const handleRemoveAsset = async (assetId: string) => {
    if (!id) return;
    if (confirm('¿Eliminar este activo del portfolio?')) {
      await removeAsset.mutateAsync({ id: assetId, portfolioId: id });
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!id) return;
    await updatePortfolio.mutateAsync({ id, data: editPortfolioData });
    setShowEditPortfolio(false);
  };

  const openValuationWizard = (assetId: string) => {
    setSelectedAssetId(assetId);
    setShowValuationWizard(true);
  };

  if (portfolioLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Portfolio no encontrado"
          description="El portfolio que buscas no existe o fue eliminado."
          action={<Button onClick={() => navigate('/app/finance/valuation')}>Volver</Button>}
        />
      </div>
    );
  }

  const totalValue = portfolio.total_value || 0;
  const totalCost = assets?.reduce((sum, a) => sum + (a.acquisition_cost || 0), 0) || 0;
  const roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/finance/valuation')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{portfolio.name}</h1>
            <p className="text-muted-foreground">{portfolio.description || 'Sin descripción'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEditPortfolio} onOpenChange={setShowEditPortfolio}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditPortfolioData({ name: portfolio.name, description: portfolio.description || '' })}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input 
                    value={editPortfolioData.name} 
                    onChange={(e) => setEditPortfolioData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea 
                    value={editPortfolioData.description} 
                    onChange={(e) => setEditPortfolioData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <Button onClick={handleUpdatePortfolio} disabled={!editPortfolioData.name} className="w-full">
                  Guardar cambios
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Activo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Añadir Activo al Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input 
                      value={newAsset.title} 
                      onChange={(e) => setNewAsset(a => ({ ...a, title: e.target.value }))}
                      placeholder="Mi Marca Registrada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={newAsset.asset_type} onValueChange={(v) => setNewAsset(a => ({ ...a, asset_type: v as AssetType }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(assetTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Registro</Label>
                    <Input 
                      value={newAsset.registration_number} 
                      onChange={(e) => setNewAsset(a => ({ ...a, registration_number: e.target.value }))}
                      placeholder="123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jurisdicción</Label>
                    <Input 
                      value={newAsset.jurisdiction} 
                      onChange={(e) => setNewAsset(a => ({ ...a, jurisdiction: e.target.value }))}
                      placeholder="ES, EU, US..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha adquisición</Label>
                    <Input 
                      type="date"
                      value={newAsset.acquisition_date} 
                      onChange={(e) => setNewAsset(a => ({ ...a, acquisition_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coste adquisición (€)</Label>
                    <Input 
                      type="number"
                      value={newAsset.acquisition_cost || ''} 
                      onChange={(e) => setNewAsset(a => ({ ...a, acquisition_cost: Number(e.target.value) }))}
                      placeholder="10000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea 
                    value={newAsset.notes} 
                    onChange={(e) => setNewAsset(a => ({ ...a, notes: e.target.value }))}
                    placeholder="Notas del activo..."
                  />
                </div>
                <Button 
                  onClick={handleAddAsset} 
                  disabled={!newAsset.title || addAsset.isPending}
                  className="w-full"
                >
                  Añadir Activo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Coste Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              {roi >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Assets and Charts */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Activos</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="allocation">Distribución</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {assetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : assets?.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Sin activos"
              description="Añade activos IP a este portfolio para valorarlos"
              action={
                <Button onClick={() => setShowAddAsset(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Activo
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets?.map((asset) => {
                const assetValuation = valuations?.find(v => v.asset_id === asset.id);
                return (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {assetTypeLabels[asset.asset_type as AssetType] || asset.asset_type}
                          </Badge>
                          <CardTitle className="text-lg">{asset.title}</CardTitle>
                          <CardDescription>
                            {asset.registration_number && `#${asset.registration_number}`}
                            {asset.jurisdiction && ` • ${asset.jurisdiction}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openValuationWizard(asset.id)}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveAsset(asset.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Coste:</span>
                          <span className="ml-2 font-medium">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(asset.acquisition_cost || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor actual:</span>
                          <span className="ml-2 font-medium text-primary">
                            {assetValuation 
                              ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(assetValuation.final_value || 0)
                              : 'Sin valorar'}
                          </span>
                        </div>
                      </div>
                      {asset.acquisition_date && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Adquirido: {new Date(asset.acquisition_date).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Evolución del Valor</CardTitle>
              <CardDescription>Histórico de valoraciones del portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioPerformanceChart portfolioId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Activos</CardTitle>
              <CardDescription>Valor por tipo de activo</CardDescription>
            </CardHeader>
            <CardContent>
              <AssetAllocationChart assets={assets || []} valuations={valuations || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Valuation Wizard Dialog */}
      <Dialog open={showValuationWizard} onOpenChange={setShowValuationWizard}>
        <DialogContent className="max-w-2xl">
          <ValuationWizard 
            assetId={selectedAssetId || undefined}
            onComplete={() => {
              setShowValuationWizard(false);
              setSelectedAssetId(null);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
