/**
 * Billing Rates Page
 * Manage hourly rates for time billing
 * P57: Time Tracking Module
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  DollarSign,
  User,
  Users,
  Briefcase,
  Building,
  Loader2,
} from 'lucide-react';
import { 
  useBillingRates, 
  useCreateBillingRate, 
  useUpdateBillingRate, 
  useDeleteBillingRate,
  BillingRate,
  RateType,
} from '@/hooks/timetracking';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RATE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  user: { label: 'Usuario', icon: User, color: 'bg-blue-100 text-blue-700' },
  matter_type: { label: 'Tipo Expediente', icon: Briefcase, color: 'bg-green-100 text-green-700' },
  client: { label: 'Cliente', icon: Building, color: 'bg-amber-100 text-amber-700' },
  default: { label: 'Por Defecto', icon: DollarSign, color: 'bg-gray-100 text-gray-700' },
};

export default function BillingRatesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<BillingRate | null>(null);

  const { data: rates = [], isLoading } = useBillingRates();
  const createMutation = useCreateBillingRate();
  const updateMutation = useUpdateBillingRate();
  const deleteMutation = useDeleteBillingRate();

  const handleCreate = () => {
    setEditingRate(null);
    setDialogOpen(true);
  };

  const handleEdit = (rate: BillingRate) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  const handleDelete = async (rate: BillingRate) => {
    if (!confirm('¿Eliminar esta tarifa?')) return;
    try {
      await deleteMutation.mutateAsync(rate.id);
      toast.success('Tarifa eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Group rates by type
  const ratesByType = rates.reduce((acc, rate) => {
    if (!acc[rate.rate_type]) acc[rate.rate_type] = [];
    acc[rate.rate_type].push(rate);
    return acc;
  }, {} as Record<RateType, BillingRate[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarifas por Hora</h1>
          <p className="text-muted-foreground">
            Configura las tarifas aplicables al registro de tiempo
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva tarifa
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Prioridad de tarifas
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                El sistema aplica la tarifa más específica: Usuario → Cliente → Tipo de expediente → Rol → Por defecto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rates by Type */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(RATE_TYPE_CONFIG).map(([type, config]) => {
            const typeRates = ratesByType[type as RateType] || [];
            const Icon = config.icon;
            
            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <CardDescription>
                        {typeRates.length} tarifa{typeRates.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {typeRates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay tarifas de este tipo
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Aplicable a</TableHead>
                          <TableHead className="text-right">Tarifa/hora</TableHead>
                          <TableHead>Vigencia</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeRates.map(rate => (
                          <TableRow key={rate.id}>
                            <TableCell>
                              <div>
                                <span className="font-medium">{rate.rate_name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {rate.rate_type === 'user' && rate.user ? `${rate.user.first_name} ${rate.user.last_name}` : ''}
                              {rate.rate_type === 'client' && rate.account?.name}
                              {rate.rate_type === 'matter_type' && rate.matter_type}
                              {rate.rate_type === 'default' && 'Todos'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {rate.hourly_rate.toFixed(2)}€
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {rate.valid_from && (
                                  <span className="text-sm">
                                    {format(new Date(rate.valid_from), 'dd/MM/yyyy')}
                                  </span>
                                )}
                                {rate.valid_until && (
                                  <>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-sm">
                                      {format(new Date(rate.valid_until), 'dd/MM/yyyy')}
                                    </span>
                                  </>
                                )}
                              </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(rate)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(rate)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <RateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rate={editingRate}
        onSave={async (data) => {
          try {
            if (editingRate) {
              await updateMutation.mutateAsync({ id: editingRate.id, ...data });
              toast.success('Tarifa actualizada');
            } else {
              await createMutation.mutateAsync(data);
              toast.success('Tarifa creada');
            }
            setDialogOpen(false);
          } catch (error) {
            toast.error('Error al guardar');
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

interface RateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: BillingRate | null;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}

function RateFormDialog({ open, onOpenChange, rate, onSave, isLoading }: RateFormDialogProps) {
  const [formData, setFormData] = useState({
    rate_type: 'default' as RateType,
    hourly_rate: '',
    name: '',
    description: '',
    role_name: '',
    matter_type: '',
  });

  // Reset form when dialog opens
  useState(() => {
    if (open) {
      if (rate) {
        setFormData({
          rate_type: rate.rate_type,
          hourly_rate: rate.hourly_rate.toString(),
          name: rate.name || '',
          description: rate.description || '',
          role_name: rate.role_name || '',
          matter_type: rate.matter_type || '',
        });
      } else {
        setFormData({
          rate_type: 'default',
          hourly_rate: '',
          name: '',
          description: '',
          role_name: '',
          matter_type: '',
        });
      }
    }
  });

  const handleSubmit = () => {
    if (!formData.hourly_rate) {
      toast.error('Ingresa una tarifa');
      return;
    }
    onSave({
      rate_type: formData.rate_type,
      hourly_rate: parseFloat(formData.hourly_rate),
      name: formData.name || undefined,
      description: formData.description || undefined,
      role_name: formData.rate_type === 'role' ? formData.role_name : undefined,
      matter_type: formData.rate_type === 'matter_type' ? formData.matter_type : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rate ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de tarifa</Label>
            <Select
              value={formData.rate_type}
              onValueChange={(v) => setFormData({ ...formData, rate_type: v as RateType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RATE_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.rate_type === 'role' && (
            <div className="space-y-2">
              <Label>Nombre del rol</Label>
              <Input
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                placeholder="Ej: Socio, Asociado Senior..."
              />
            </div>
          )}

          {formData.rate_type === 'matter_type' && (
            <div className="space-y-2">
              <Label>Tipo de expediente</Label>
              <Select
                value={formData.matter_type}
                onValueChange={(v) => setFormData({ ...formData, matter_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trademark">Marca</SelectItem>
                  <SelectItem value="patent">Patente</SelectItem>
                  <SelectItem value="design">Diseño</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="domain">Dominio</SelectItem>
                  <SelectItem value="litigation">Litigio</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tarifa por hora (€) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              placeholder="150.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Nombre (opcional)</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Tarifa estándar"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notas sobre esta tarifa..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {rate ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
