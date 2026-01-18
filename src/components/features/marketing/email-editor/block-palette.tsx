import { EMAIL_BLOCKS, EMAIL_VARIABLES } from '@/lib/constants/marketing';
import type { EmailBlockType } from '@/types/marketing';
import { 
  Type, AlignLeft, Image, Square, Minus, Move, 
  Columns, Share2, FileText, Code, Mail 
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Type,
  AlignLeft,
  Image,
  Square,
  Minus,
  Move,
  Columns,
  Share2,
  FileText,
  Code,
  Mail,
};

interface Props {
  onAddBlock: (type: EmailBlockType) => void;
}

export function BlockPalette({ onAddBlock }: Props) {
  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success('Variable copiada al portapapeles');
  };
  
  return (
    <div className="w-64 border-r bg-muted/30 p-4 overflow-auto">
      <h3 className="font-medium text-foreground mb-4">Bloques</h3>
      
      <div className="space-y-2">
        {Object.entries(EMAIL_BLOCKS).map(([type, config]) => {
          const Icon = iconMap[config.icon] || Square;
          
          return (
            <button
              key={type}
              onClick={() => onAddBlock(type as EmailBlockType)}
              className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all text-left"
            >
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Variables</h4>
        <div className="space-y-1">
          {EMAIL_VARIABLES.slice(0, 5).map((v) => (
            <button
              key={v.key}
              onClick={() => copyVariable(v.key)}
              className="w-full text-left text-xs font-mono px-2 py-1.5 bg-muted rounded hover:bg-muted/80 transition-colors"
              title={v.label}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
