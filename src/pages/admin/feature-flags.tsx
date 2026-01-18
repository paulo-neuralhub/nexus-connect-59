import { useState } from 'react';
import { Flag, Edit, Save, X } from 'lucide-react';
import { useAdminFeatureFlags, useUpdateFeatureFlag } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function FeatureFlagsPage() {
  const { data: flags = [], isLoading } = useAdminFeatureFlags();
  const updateMutation = useUpdateFeatureFlag();
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  
  const handleToggle = async (flag: any) => {
    try {
      await updateMutation.mutateAsync({
        id: flag.id,
        data: { is_enabled: !flag.is_enabled },
      });
      toast({ 
        title: `${flag.name} ${flag.is_enabled ? 'desactivado' : 'activado'}` 
      });
    } catch (error) {
      toast({ 
        title: 'Error al actualizar',
        variant: 'destructive'
      });
    }
  };
  
  const handleSave = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: editData });
      toast({ title: 'Flag actualizado' });
      setEditingId(null);
    } catch (error) {
      toast({ 
        title: 'Error al guardar',
        variant: 'destructive'
      });
    }
  };
  
  const startEdit = (flag: any) => {
    setEditingId(flag.id);
    setEditData({
      rollout_percentage: flag.rollout_percentage,
      enabled_for_plans: flag.enabled_for_plans || [],
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
          <p className="text-muted-foreground">Controla el acceso a funcionalidades</p>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Flag</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rollout</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Planes</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {flags.map(flag => (
              <tr key={flag.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{flag.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{flag.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => handleToggle(flag)}
                  />
                </td>
                <td className="px-4 py-3">
                  {editingId === flag.id ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.rollout_percentage}
                      onChange={(e) => setEditData({ ...editData, rollout_percentage: parseInt(e.target.value) })}
                      className="w-20 h-8"
                    />
                  ) : (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      flag.rollout_percentage === 100 ? "bg-green-100 text-green-700" :
                      flag.rollout_percentage > 0 ? "bg-yellow-100 text-yellow-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {flag.rollout_percentage}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === flag.id ? (
                    <Input
                      type="text"
                      value={editData.enabled_for_plans?.join(', ') || ''}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        enabled_for_plans: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                      })}
                      placeholder="plan1, plan2"
                      className="w-full h-8"
                    />
                  ) : (
                    <div className="flex gap-1 flex-wrap">
                      {flag.enabled_for_plans?.length > 0 ? (
                        flag.enabled_for_plans.map((plan: string) => (
                          <span key={plan} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            {plan}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Todos</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === flag.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSave(flag.id)}
                        className="h-8 w-8 text-green-600"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(flag)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
