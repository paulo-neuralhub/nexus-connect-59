// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Packs Management
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Edit2, 
  Trash2,
  Star,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTelephonyPacks, useCreateTelephonyPack, useUpdateTelephonyPack, useDeleteTelephonyPack } from '@/hooks/useTelephonyPacks';
import { cn } from '@/lib/utils';

interface PackFormData {
  code: string;
  name: string;
  description: string | null;
  minutes_included: number;
  sms_included: number;
  price: number;
  currency: string;
  validity_days: number;
  is_active: boolean;
  is_featured: boolean;
  min_plan: string | null;
  display_order: number;
  badge_text: string | null;
  savings_percentage: number | null;
}

const defaultFormData: PackFormData = {
  code: '',
  name: '',
  description: '',
  minutes_included: 60,
  sms_included: 0,
  price: 15,
  currency: 'EUR',
  validity_days: 365,
  is_active: true,
  is_featured: false,
  min_plan: null,
  display_order: 0,
  badge_text: '',
  savings_percentage: null,
};

export default function TelephonyPacksPage() {
  const { data: packs, isLoading } = useTelephonyPacks();
  const createPack = useCreateTelephonyPack();
  const updatePack = useUpdateTelephonyPack();
  const deletePack = useDeleteTelephonyPack();

  const [showDialog, setShowDialog] = useState(false);
  const [editingPack, setEditingPack] = useState<string | null>(null);
  const [formData, setFormData] = useState<PackFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingPack(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  const openEditDialog = (pack: any) => {
    setEditingPack(pack.id);
    setFormData({
      code: pack.code,
      name: pack.name,
      description: pack.description || '',
      minutes_included: pack.minutes_included,
      sms_included: pack.sms_included || 0,
      price: Number(pack.price),
      currency: pack.currency || 'EUR',
      validity_days: pack.validity_days,
      is_active: pack.is_active,
      is_featured: pack.is_featured,
      min_plan: pack.min_plan || null,
      display_order: pack.display_order,
      badge_text: pack.badge_text || '',
      savings_percentage: pack.savings_percentage,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (editingPack) {
      await updatePack.mutateAsync({ id: editingPack, ...formData });
    } else {
      await createPack.mutateAsync(formData);
    }
    setShowDialog(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePack.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/backoffice/telephony">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Packs</h1>
            <p className="text-muted-foreground">
              Administra los packs de minutos disponibles para tenants
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pack
        </Button>
      </div>

      {/* Packs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs?.map((pack) => (
            <Card
              key={pack.id}
              className={cn(
                "relative",
                pack.is_featured && "ring-2 ring-primary",
                !pack.is_active && "opacity-60"
              )}
            >
              {pack.badge_text && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  {pack.badge_text}
                </Badge>
              )}
              {pack.is_featured && (
                <Star className="absolute top-3 right-3 h-5 w-5 text-warning fill-warning" />
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {pack.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{pack.description}</p>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatCurrency(Number(pack.price))}</span>
                  {pack.savings_percentage && (
                    <Badge variant="secondary" className="ml-2">
                      Ahorra {pack.savings_percentage}%
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span>{pack.minutes_included.toLocaleString()} minutos</span>
                  </div>
                  {pack.sms_included > 0 && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span>{pack.sms_included} SMS</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Validez: {pack.validity_days} días</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-1">
                    <Badge variant={pack.is_active ? 'default' : 'secondary'}>
                      {pack.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(pack)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteId(pack.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingPack ? 'Editar Pack' : 'Crear Pack'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="PACK_STARTER"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pack Inicial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del pack..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutos incluidos</Label>
                <Input
                  id="minutes"
                  type="number"
                  value={formData.minutes_included}
                  onChange={(e) => setFormData({ ...formData, minutes_included: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms">SMS incluidos</Label>
                <Input
                  id="sms"
                  type="number"
                  value={formData.sms_included}
                  onChange={(e) => setFormData({ ...formData, sms_included: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validez (días)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge">Badge (opcional)</Label>
                <Input
                  id="badge"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="Más popular"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savings">Ahorro % (opcional)</Label>
                <Input
                  id="savings"
                  type="number"
                  value={formData.savings_percentage || ''}
                  onChange={(e) => setFormData({ ...formData, savings_percentage: e.target.value ? Number(e.target.value) : null })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Activo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
                <Label>Destacado</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPack.isPending || updatePack.isPending}
            >
              {(createPack.isPending || updatePack.isPending) && (
                <Spinner className="h-4 w-4 mr-2" />
              )}
              {editingPack ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pack?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pack será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
