import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FileText, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface AIPromptTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  agent_type: string;
  category: string | null;
  system_prompt: string;
  default_model: string | null;
  default_temperature: number | null;
  max_tokens: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PromptsTabProps {
  prompts: AIPromptTemplate[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (prompt: AIPromptTemplate) => void;
  onDelete: (id: string) => void;
}

export function PromptsTab({ 
  prompts, 
  isLoading, 
  onAdd, 
  onEdit, 
  onDelete 
}: PromptsTabProps) {
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copiado al portapapeles');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prompts Manager</CardTitle>
            <CardDescription>Gestión y versionado de prompts del sistema</CardDescription>
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prompts Manager</CardTitle>
          <CardDescription>Gestión y versionado de prompts del sistema</CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </CardHeader>
      <CardContent>
        {prompts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay prompts configurados</p>
            <p className="text-sm">Añade un prompt para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{prompt.name}</p>
                      <Badge variant="outline">{prompt.code}</Badge>
                      <Badge className="bg-purple-500/10 text-purple-600">{prompt.agent_type}</Badge>
                      {prompt.category && (
                        <Badge variant="secondary">{prompt.category}</Badge>
                      )}
                      {prompt.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyPrompt(prompt.system_prompt)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(prompt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive" 
                      onClick={() => onDelete(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded p-3 mt-2">
                  <p className="text-xs font-mono text-muted-foreground line-clamp-3">
                    {prompt.system_prompt}
                  </p>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {prompt.default_model && <span>Model: {prompt.default_model}</span>}
                  {prompt.default_temperature && <span>Temp: {prompt.default_temperature}</span>}
                  {prompt.max_tokens && <span>Max: {prompt.max_tokens} tokens</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
