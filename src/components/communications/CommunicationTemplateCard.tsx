/**
 * Professional template card component for WhatsApp and Email templates
 */

import { 
  Mail, 
  MessageCircle, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Copy, 
  Trash2,
  Crown,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommunicationTemplate, TEMPLATE_CATEGORIES } from '@/hooks/communications/useCommunicationTemplates';
import { cn } from '@/lib/utils';

interface CommunicationTemplateCardProps {
  template: CommunicationTemplate;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUse?: () => void;
}

export function CommunicationTemplateCard({
  template,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
}: CommunicationTemplateCardProps) {
  const category = TEMPLATE_CATEGORIES.find(c => c.value === template.category);
  const isWhatsApp = template.channel === 'whatsapp';
  const isEmail = template.channel === 'email';

  // Get preview text (strip HTML for email)
  const previewText = isEmail
    ? template.content_html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 120)
    : template.content_text.substring(0, 120);

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden",
        template.is_system && "ring-1 ring-primary/20"
      )}
      onClick={onPreview}
    >
      {/* Channel color bar */}
      <div 
        className={cn(
          "h-1",
          isWhatsApp ? "bg-green-500" : isEmail ? "bg-primary" : "bg-muted"
        )}
      />
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isWhatsApp ? "bg-green-50 dark:bg-green-950" : "bg-primary/10"
              )}
            >
              {isWhatsApp ? (
                <MessageCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Mail className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                {template.is_system && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {template.code}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </DropdownMenuItem>
              {onUse && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUse(); }}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Usar plantilla
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {template.is_system ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar y personalizar
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Subject (email only) */}
        {isEmail && template.subject && (
          <p className="text-sm font-medium mb-2 line-clamp-1 text-foreground">
            {template.subject}
          </p>
        )}

        {/* Preview text */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {previewText}...
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {category && (
            <Badge
              variant="outline"
              className="text-xs font-medium"
              style={{ 
                borderColor: category.color, 
                color: category.color,
                backgroundColor: `${category.color}10`
              }}
            >
              {category.icon} {category.label}
            </Badge>
          )}
          {template.is_system && (
            <Badge variant="secondary" className="text-xs">
              Sistema
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
              isWhatsApp ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-primary/10 text-primary"
            )}>
              {isWhatsApp ? <MessageCircle className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
              {isWhatsApp ? 'WhatsApp' : 'Email'}
            </span>
          </div>
          
          {template.usage_count > 0 && (
            <span className="flex items-center gap-1">
              Usado {template.usage_count}x
            </span>
          )}
        </div>

        {/* Variables count */}
        {template.variables.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}: 
              <span className="font-mono ml-1">
                {template.variables.slice(0, 3).map(v => `{{${v.name}}}`).join(', ')}
                {template.variables.length > 3 && '...'}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
