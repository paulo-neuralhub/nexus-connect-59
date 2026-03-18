// ============================================================
// IP-NEXUS - Global Command Palette (Cmd+K / Ctrl+K)
// Spotlight-style search across all entities
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { fromTable } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  FileText,
  User,
  Users,
  Briefcase,
  Building2,
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  CheckSquare,
  Clock,
  Plus,
  Search,
  Settings,
  BarChart3,
  Loader2,
  ArrowRight,
  Sparkles,
  FolderOpen,
  Receipt,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Quick actions configuration
const quickActions = [
  {
    id: 'new-matter',
    label: 'Nuevo Expediente',
    description: 'Crear un nuevo expediente',
    icon: Plus,
    path: '/app/docket/new',
    shortcut: 'E',
  },
  {
    id: 'new-contact',
    label: 'Nuevo Contacto',
    description: 'Añadir un nuevo contacto',
    icon: User,
    path: '/app/crm/contacts?new=true',
    shortcut: 'C',
  },
  {
    id: 'new-deal',
    label: 'Nuevo Deal',
    description: 'Crear una nueva oportunidad',
    icon: Briefcase,
    path: '/app/crm/deals?new=true',
    shortcut: 'D',
  },
  {
    id: 'compose-email',
    label: 'Redactar Email',
    description: 'Enviar un nuevo email',
    icon: Mail,
    path: '/app/communications/email?compose=true',
  },
  {
    id: 'send-whatsapp',
    label: 'Enviar WhatsApp',
    description: 'Nuevo mensaje de WhatsApp',
    icon: MessageCircle,
    path: '/app/communications/whatsapp?compose=true',
  },
];

// Navigation items
const navigationItems = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: BarChart3, path: '/app/dashboard', shortcut: 'D' },
  { id: 'nav-docket', label: 'Expedientes', icon: FolderOpen, path: '/app/docket' },
  { id: 'nav-crm', label: 'CRM', icon: Users, path: '/app/crm' },
  { id: 'nav-calendar', label: 'Calendario', icon: Calendar, path: '/app/calendar' },
  { id: 'nav-communications', label: 'Comunicaciones', icon: Mail, path: '/app/communications' },
  { id: 'nav-finance', label: 'Finanzas', icon: Receipt, path: '/app/finance' },
  { id: 'nav-settings', label: 'Configuración', icon: Settings, path: '/app/settings', shortcut: ',' },
];

// Phase badge colors
const phaseBadgeColors: Record<string, string> = {
  F0: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  F1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  F2: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  F3: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  F4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  F5: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  F6: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  F7: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  F8: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  F9: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const orgId = currentOrganization?.id;

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Reset query when closing
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Search matters (expedientes)
  const { data: matters = [], isLoading: loadingMatters } = useQuery({
    queryKey: ['cmd-search-matters', orgId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !orgId) return [];
      const { data, error } = await fromTable('matters')
        .select('id, title, reference_number, status, phase, client:client_id(name)')
        .eq('organization_id', orgId)
        .or(`title.ilike.%${debouncedQuery}%,reference_number.ilike.%${debouncedQuery}%`)
        .limit(5);
      if (error) {
        console.error('Search matters error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });

  // Search contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['cmd-search-contacts', orgId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !orgId) return [];
      const { data, error } = await fromTable('contacts')
        .select('id, name, email, type, company')
        .eq('organization_id', orgId)
        .or(`name.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%,company.ilike.%${debouncedQuery}%`)
        .limit(5);
      if (error) {
        console.error('Search contacts error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });

  // Search deals
  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['cmd-search-deals', orgId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !orgId) return [];
      const { data, error } = await fromTable('deals')
        .select('id, title, value, currency, contact:contact_id(name)')
        .eq('organization_id', orgId)
        .ilike('title', `%${debouncedQuery}%`)
        .limit(5);
      if (error) {
        console.error('Search deals error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });

  // Search tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['cmd-search-tasks', orgId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !orgId) return [];
      const { data, error } = await fromTable('tasks')
        .select('id, title, status, priority, due_date')
        .eq('organization_id', orgId)
        .ilike('title', `%${debouncedQuery}%`)
        .neq('status', 'completed')
        .limit(5);
      if (error) {
        console.error('Search tasks error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });

  // Search communications
  const { data: communications = [], isLoading: loadingComms } = useQuery({
    queryKey: ['cmd-search-comms', orgId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !orgId) return [];
      const { data, error } = await fromTable('communications')
        .select('id, channel, subject, recipient, received_at')
        .eq('organization_id', orgId)
        .or(`subject.ilike.%${debouncedQuery}%,recipient.ilike.%${debouncedQuery}%`)
        .order('received_at', { ascending: false })
        .limit(5);
      if (error) {
        console.error('Search communications error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });

  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ipnexus-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((term: string) => {
    if (!term || term.length < 2) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('ipnexus-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle selection
  const handleSelect = useCallback(
    (type: string, value: string, searchTerm?: string) => {
      onOpenChange(false);

      if (searchTerm) {
        saveRecentSearch(searchTerm);
      }

      if (type === 'action' || type === 'navigation') {
        navigate(value);
      } else if (type === 'matter') {
        navigate(`/app/docket/${value}`);
      } else if (type === 'contact') {
        navigate(`/app/crm/contacts/${value}`);
      } else if (type === 'deal') {
        navigate(`/app/crm/deals/${value}`);
      } else if (type === 'task') {
        navigate(`/app/tasks/${value}`);
      } else if (type === 'communication') {
        navigate(`/app/communications?id=${value}`);
      } else if (type === 'recent') {
        setQuery(value);
      }
    },
    [navigate, onOpenChange, saveRecentSearch]
  );

  const isLoading = loadingMatters || loadingContacts || loadingDeals || loadingTasks || loadingComms;
  const hasResults =
    debouncedQuery.length >= 2 &&
    (matters.length > 0 ||
      contacts.length > 0 ||
      deals.length > 0 ||
      tasks.length > 0 ||
      communications.length > 0);
  const showQuickActions = !debouncedQuery || debouncedQuery.length < 2;

  // Communication icon helper
  const getCommIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl gap-0">
        <Command className="rounded-lg border-0" shouldFilter={false}>
          {/* Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder="Buscar expedientes, contactos, tareas..."
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <CommandList className="max-h-[400px]">
            {/* Empty state */}
            <CommandEmpty className="py-6 text-center text-sm">
              {query.length < 2 ? (
                <span className="text-muted-foreground">Escribe al menos 2 caracteres para buscar</span>
              ) : isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Buscando...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-muted-foreground">No se encontraron resultados para "{debouncedQuery}"</span>
                  <span className="text-xs text-muted-foreground">Intenta con otros términos de búsqueda</span>
                </div>
              )}
            </CommandEmpty>

            {/* Quick Actions (when no search) */}
            {showQuickActions && (
              <>
                <CommandGroup heading="Acciones rápidas">
                  {quickActions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={() => handleSelect('action', action.path)}
                      className="flex items-center gap-3 py-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{action.label}</span>
                        <span className="text-xs text-muted-foreground">{action.description}</span>
                      </div>
                      {action.shortcut && (
                        <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <>
                    <CommandGroup heading="Búsquedas recientes">
                      {recentSearches.map((term, idx) => (
                        <CommandItem
                          key={`recent-${idx}`}
                          value={`recent-${term}`}
                          onSelect={() => handleSelect('recent', term)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{term}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* Navigation */}
                <CommandGroup heading="Ir a">
                  {navigationItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect('navigation', item.path)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Search Results */}
            {debouncedQuery.length >= 2 && (
              <>
                {/* Matters */}
                {matters.length > 0 && (
                  <CommandGroup heading="Expedientes">
                    {matters.map((matter: any) => (
                      <CommandItem
                        key={`matter-${matter.id}`}
                        value={`matter-${matter.id}`}
                        onSelect={() => handleSelect('matter', matter.id, debouncedQuery)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-module-docket/10 text-module-docket">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{matter.reference_number}</span>
                            {matter.phase && (
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px] px-1.5', phaseBadgeColors[matter.phase] || phaseBadgeColors.F0)}
                              >
                                {matter.phase}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {matter.title} • {matter.client?.name || 'Sin cliente'}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Contacts */}
                {contacts.length > 0 && (
                  <CommandGroup heading="Contactos">
                    {contacts.map((contact: any) => (
                      <CommandItem
                        key={`contact-${contact.id}`}
                        value={`contact-${contact.id}`}
                        onSelect={() => handleSelect('contact', contact.id, debouncedQuery)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-module-crm/10 text-module-crm">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{contact.name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {contact.company || contact.email}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {contact.type || 'Contacto'}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Deals */}
                {deals.length > 0 && (
                  <CommandGroup heading="Deals">
                    {deals.map((deal: any) => (
                      <CommandItem
                        key={`deal-${deal.id}`}
                        value={`deal-${deal.id}`}
                        onSelect={() => handleSelect('deal', deal.id, debouncedQuery)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{deal.title}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {deal.contact?.name || 'Sin contacto'} •{' '}
                            {deal.value ? `${deal.value} ${deal.currency || 'EUR'}` : 'Sin valor'}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Tasks */}
                {tasks.length > 0 && (
                  <CommandGroup heading="Tareas">
                    {tasks.map((task: any) => (
                      <CommandItem
                        key={`task-${task.id}`}
                        value={`task-${task.id}`}
                        onSelect={() => handleSelect('task', task.id, debouncedQuery)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{task.title}</span>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            task.priority === 'high' && 'border-red-500 text-red-500',
                            task.priority === 'medium' && 'border-amber-500 text-amber-500',
                            task.priority === 'low' && 'border-green-500 text-green-500'
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Communications */}
                {communications.length > 0 && (
                  <CommandGroup heading="Comunicaciones">
                    {communications.map((comm: any) => (
                      <CommandItem
                        key={`comm-${comm.id}`}
                        value={`comm-${comm.id}`}
                        onSelect={() => handleSelect('communication', comm.id, debouncedQuery)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {getCommIcon(comm.channel)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{comm.subject || 'Sin asunto'}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {comm.recipient} •{' '}
                            {comm.received_at
                              ? new Date(comm.received_at).toLocaleDateString('es-ES')
                              : ''}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd>
              <span>navegar</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] ml-2">↵</kbd>
              <span>seleccionar</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] ml-2">esc</kbd>
              <span>cerrar</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              IP-NEXUS
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
