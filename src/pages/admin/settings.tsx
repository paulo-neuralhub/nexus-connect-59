import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SETTING_CATEGORIES } from '@/lib/constants/backoffice';

export default function AdminSettingsPage() {
  const { data: settings = [], isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSetting();
  const { toast } = useToast();
  
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  
  const categories = Object.keys(SETTING_CATEGORIES);
  
  const handleSave = async (key: string) => {
    try {
      await updateMutation.mutateAsync({
        key,
        value: editedValues[key]
      });
      toast({ title: 'Configuración guardada' });
      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };
  
  const getValue = (setting: any) => {
    if (editedValues.hasOwnProperty(setting.key)) {
      return editedValues[setting.key];
    }
    try {
      return typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    } catch {
      return setting.value;
    }
  };
  
  const handleChange = (key: string, value: any) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };
  
  const hasChanges = (key: string) => editedValues.hasOwnProperty(key);
  
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Ajustes globales de la plataforma</p>
      </div>
      
      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="mb-4">
          {categories.map((cat) => {
            const config = SETTING_CATEGORIES[cat as keyof typeof SETTING_CATEGORIES];
            return (
              <TabsTrigger key={cat} value={cat}>
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {categories.map((category) => {
          const categorySettings = settings.filter(s => s.category === category);
          
          return (
            <TabsContent key={category} value={category} className="space-y-4">
              {categorySettings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay configuraciones en esta categoría
                </div>
              ) : (
                categorySettings.map((setting) => {
                  const value = getValue(setting);
                  
                  return (
                    <div key={setting.key} className="bg-card rounded-xl border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{setting.key}</p>
                            {setting.is_required && (
                              <span className="text-xs text-destructive">*</span>
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                          )}
                          
                          <div className="mt-3 max-w-md">
                            {setting.value_type === 'boolean' ? (
                              <Switch
                                checked={!!value}
                                onCheckedChange={(checked) => handleChange(setting.key, checked)}
                              />
                            ) : setting.value_type === 'number' ? (
                              <Input
                                type="number"
                                value={value || ''}
                                onChange={(e) => handleChange(setting.key, parseFloat(e.target.value))}
                              />
                            ) : setting.value_type === 'json' ? (
                              <Textarea
                                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                onChange={(e) => {
                                  try {
                                    handleChange(setting.key, JSON.parse(e.target.value));
                                  } catch {
                                    handleChange(setting.key, e.target.value);
                                  }
                                }}
                                rows={4}
                                className="font-mono text-sm"
                              />
                            ) : setting.value_type === 'secret' ? (
                              <Input
                                type="password"
                                value={value || ''}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                                placeholder="••••••••"
                              />
                            ) : (
                              <Input
                                value={value || ''}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                        
                        {hasChanges(setting.key) && (
                          <Button
                            size="sm"
                            onClick={() => handleSave(setting.key)}
                            disabled={updateMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Guardar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
