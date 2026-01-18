import type { EmailSettings } from '@/types/marketing';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  settings: EmailSettings;
  onUpdate: (updates: Partial<EmailSettings>) => void;
}

const fontFamilies = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
];

export function SettingsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="p-4">
      <h3 className="font-medium text-foreground mb-4">Configuración del email</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Color de fondo</Label>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-full h-10 rounded cursor-pointer border border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Ancho del contenido</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={400}
              max={800}
              value={settings.contentWidth}
              onChange={(e) => onUpdate({ contentWidth: parseInt(e.target.value) })}
            />
            <span className="text-sm text-muted-foreground">px</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Fuente</Label>
          <Select 
            value={settings.fontFamily} 
            onValueChange={(v) => onUpdate({ fontFamily: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Color de enlaces</Label>
          <input
            type="color"
            value={settings.linkColor}
            onChange={(e) => onUpdate({ linkColor: e.target.value })}
            className="w-full h-10 rounded cursor-pointer border border-border"
          />
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Usa un ancho de 600px para mejor compatibilidad</li>
          <li>• Mantén los textos cortos y directos</li>
          <li>• Incluye siempre un footer con link de baja</li>
          <li>• Prueba el email antes de enviarlo</li>
        </ul>
      </div>
    </div>
  );
}
