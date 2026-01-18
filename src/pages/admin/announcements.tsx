import { useState } from 'react';
import { Plus, Megaphone, Edit, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSystemAnnouncements, useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ANNOUNCEMENT_TYPES } from '@/lib/constants/backoffice';

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useSystemAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    target_audience: 'all' as const,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    is_dismissible: true,
    show_on_dashboard: true,
    show_as_banner: false,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        ends_at: formData.ends_at || undefined,
        target_plans: [],
        target_orgs: [],
        is_active: true,
      });
      toast({ title: 'Anuncio creado' });
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: '',
        is_dismissible: true,
        show_on_dashboard: true,
        show_as_banner: false,
      });
    } catch (error) {
      toast({ title: 'Error al crear anuncio', variant: 'destructive' });
    }
  };
  
  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { is_active: !currentState }
      });
      toast({ title: currentState ? 'Anuncio desactivado' : 'Anuncio activado' });
    } catch (error) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Anuncios del Sistema</h1>
          <p className="text-muted-foreground">Comunica mensajes importantes a los usuarios</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo anuncio
        </Button>
      </div>
      
      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ANNOUNCEMENT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Audiencia</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value) => setFormData({ ...formData, target_audience: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admins">Solo admins</SelectItem>
                  <SelectItem value="specific_plans">Planes específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fin (opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_dashboard"
                checked={formData.show_on_dashboard}
                onCheckedChange={(checked) => setFormData({ ...formData, show_on_dashboard: !!checked })}
              />
              <Label htmlFor="show_dashboard" className="text-sm">Mostrar en dashboard</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_banner"
                checked={formData.show_as_banner}
                onCheckedChange={(checked) => setFormData({ ...formData, show_as_banner: !!checked })}
              />
              <Label htmlFor="show_banner" className="text-sm">Mostrar como banner</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_dismissible"
                checked={formData.is_dismissible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_dismissible: !!checked })}
              />
              <Label htmlFor="is_dismissible" className="text-sm">Descartable</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Crear anuncio
            </Button>
          </div>
        </form>
      )}
      
      {/* Lista */}
      <div className="space-y-4">
        {announcements.map(ann => {
          const typeConfig = ANNOUNCEMENT_TYPES[ann.type as keyof typeof ANNOUNCEMENT_TYPES] || ANNOUNCEMENT_TYPES.info;
          
          return (
            <div 
              key={ann.id}
              className={cn(
                "bg-card rounded-xl border p-4",
                !ann.is_active && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${typeConfig.color}20` }}
                  >
                    <Megaphone className="w-4 h-4" style={{ color: typeConfig.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{ann.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ann.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Desde: {format(new Date(ann.starts_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                      {ann.ends_at && (
                        <span>
                          Hasta: {format(new Date(ann.ends_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      )}
                      <span>Audiencia: {ann.target_audience}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span 
                    className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      ann.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {ann.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => toggleActive(ann.id, ann.is_active)}
                  >
                    {ann.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        {announcements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay anuncios. Crea el primero.
          </div>
        )}
      </div>
    </div>
  );
}
