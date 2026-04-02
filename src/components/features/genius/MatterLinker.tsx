import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search, Check, Plus, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

interface MatterOption {
  id: string;
  reference: string;
  title: string;
  mark_name: string | null;
  ip_type: string | null;
  status: string | null;
  jurisdiction: string | null;
}

interface MatterLinkerProps {
  conversationId: string | null;
  onLink: (matterId: string, matterRef: string) => void;
  onMatterLinked: (matter: { id: string; reference: string }) => void;
}

// Regex check: message suggests linking to a matter
export function shouldShowMatterLinker(content: string): boolean {
  const lower = content.toLowerCase();
  if (lower.includes('expediente existente')) return true;
  if (lower.includes('expediente') && lower.includes('asocie')) return true;
  return false;
}

export function MatterLinker({ conversationId, onLink, onMatterLinked }: MatterLinkerProps) {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState<MatterOption | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [linked, setLinked] = useState<{ id: string; reference: string } | null>(null);

  const { data: matters = [] } = useQuery({
    queryKey: ['matters-linker', currentOrganization?.id],
    queryFn: async (): Promise<MatterOption[]> => {
      const { data, error } = await supabase
        .from('matters')
        .select('id, reference, title, mark_name, ip_type, status, jurisdiction')
        .eq('organization_id', currentOrganization!.id)
        .or('is_archived.eq.false,is_archived.is.null')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as MatterOption[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });

  if (dismissed) return null;

  // Already linked — show badge
  if (linked) {
    return (
      <button
        onClick={() => navigate(`/app/matters/${linked.id}`)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        {linked.reference}
        <ExternalLink className="w-3 h-3" />
      </button>
    );
  }

  const handleAssociate = async () => {
    if (!selectedMatter || !conversationId) return;
    try {
      await onLink(selectedMatter.id, selectedMatter.reference);
      setLinked({ id: selectedMatter.id, reference: selectedMatter.reference });
      onMatterLinked({ id: selectedMatter.id, reference: selectedMatter.reference });
    } catch {
      toast.error('No se pudo vincular el expediente');
    }
  };

  const formatLabel = (m: MatterOption) => {
    let label = `${m.reference} — ${m.title}`;
    if (m.mark_name) label += ` (${m.mark_name}™)`;
    return label;
  };

  const formatSub = (m: MatterOption) =>
    [m.ip_type, m.jurisdiction, m.status].filter(Boolean).join(' · ');

  return (
    <div className="mt-3 bg-muted/50 border border-border rounded-lg p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FolderOpen className="w-4 h-4 text-primary" />
        Vincular a expediente
      </div>

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm font-normal h-9"
          >
            {selectedMatter ? (
              <span className="truncate">{formatLabel(selectedMatter)}</span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Search className="w-4 h-4" />
                Buscar expediente por referencia o título…
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar expediente…" />
            <CommandList>
              <CommandEmpty>No se encontraron expedientes.</CommandEmpty>
              <CommandGroup>
                {matters.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.reference} ${m.title} ${m.mark_name ?? ''}`}
                    onSelect={() => {
                      setSelectedMatter(m);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 flex-shrink-0',
                        selectedMatter?.id === m.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm">{formatLabel(m)}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatSub(m)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!selectedMatter}
          onClick={handleAssociate}
        >
          Asociar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/matters/new')}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Crear nuevo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
        >
          Omitir
        </Button>
      </div>
    </div>
  );
}
