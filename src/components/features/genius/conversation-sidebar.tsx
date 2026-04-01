import { useState } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Calendar,
  MoreHorizontal,
  Star,
  Trash2,
  Pencil,
  FileText,
  Check,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  isAfter,
  isBefore,
  startOfDay,
  startOfWeek,
  startOfMonth,
  formatDistanceToNow,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useConversations,
  useDeleteConversation,
  useStarConversation,
  useRenameConversation,
} from '@/hooks/use-genius';
import { AGENTS } from '@/lib/constants/genius';
import type { AgentType, AIConversation } from '@/types/genius';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ===== Props =====
interface Props {
  agentType?: AgentType;
  selectedId?: string;
  onSelect: (conversation: AIConversation) => void;
  onNewChat: () => void;
}

// ===== Agrupación temporal =====
function groupConversations(conversations: AIConversation[]) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { locale: es });
  const monthStart = startOfMonth(now);

  const active = conversations.filter(c => c.status !== 'archived');
  const pinned = active.filter(c => c.is_starred || c.is_pinned);
  const unpinned = active.filter(c => !c.is_starred && !c.is_pinned);

  return {
    pinned,
    today: unpinned.filter(c =>
      isAfter(new Date(c.last_message_at), todayStart)
    ),
    thisWeek: unpinned.filter(c =>
      isAfter(new Date(c.last_message_at), weekStart) &&
      isBefore(new Date(c.last_message_at), todayStart)
    ),
    thisMonth: unpinned.filter(c =>
      isAfter(new Date(c.last_message_at), monthStart) &&
      isBefore(new Date(c.last_message_at), weekStart)
    ),
    older: unpinned.filter(c =>
      isBefore(new Date(c.last_message_at), monthStart)
    ),
  };
}

// ===== ConversationItem =====
function ConversationItem({
  conv,
  isActive,
  onSelect,
  onRenameStart,
  onDeleteRequest,
  onStar,
  navigate,
  editingId,
  editingTitle,
  setEditingTitle,
  onRenameConfirm,
}: {
  conv: AIConversation;
  isActive: boolean;
  onSelect: (c: AIConversation) => void;
  onRenameStart: (c: AIConversation) => void;
  onDeleteRequest: (c: AIConversation) => void;
  onStar: (id: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (t: string) => void;
  onRenameConfirm: (id: string | null) => void;
}) {
  const isEditing = editingId === conv.id;
  const agent = AGENTS[conv.agent_type];

  return (
    <div
      onClick={() => !isEditing && onSelect(conv)}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-all duration-150',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/80'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
      )}

      {/* Agent icon */}
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${agent.color}15` }}
      >
        <MessageSquare className="w-3.5 h-3.5" style={{ color: agent.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameConfirm(conv.id);
                if (e.key === 'Escape') onRenameConfirm(null);
              }}
              className="flex-1 bg-muted text-foreground text-xs px-2 py-1 rounded border border-primary/40 outline-none focus:border-primary"
            />
            <button
              onClick={() => onRenameConfirm(conv.id)}
              className="text-primary hover:text-primary/80 p-0.5"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {conv.title ?? 'Nueva conversación'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(conv.last_message_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              {conv.matter_id && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">
                  <FileText className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[80px]">
                    {(conv as any).matter_reference ?? 'Expediente'}
                  </span>
                </span>
              )}
              {conv.is_starred && (
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              )}
            </div>
          </>
        )}
      </div>

      {/* Context menu ··· */}
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRenameStart(conv);
              }}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStar(conv.id);
              }}
            >
              <Star className="w-3.5 h-3.5 mr-2" />
              {conv.is_starred ? 'Quitar favorito' : 'Marcar favorito'}
            </DropdownMenuItem>
            {conv.matter_id && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/expedientes/${conv.matter_id}`);
                }}
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Ver expediente
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(conv);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ===== Main Component =====
export function ConversationSidebar({ agentType, selectedId, onSelect, onNewChat }: Props) {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading } = useConversations(agentType);
  const deleteMutation = useDeleteConversation();
  const starMutation = useStarConversation();
  const { mutate: renameConversation } = useRenameConversation();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AIConversation | null>(null);

  // Filter by search
  const filtered = conversations.filter(
    (c) => !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Group temporally
  const grouped = groupConversations(filtered);

  // Handlers
  const handleRenameStart = (conv: AIConversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title ?? 'Nueva conversación');
  };

  const handleRenameConfirm = (conversationId: string | null) => {
    if (conversationId && editingTitle.trim()) {
      renameConversation({ conversationId, title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDeleteRequest = (conv: AIConversation) => {
    setDeleteTarget(conv);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleStar = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      starMutation.mutate({ id, starred: !conv.is_starred });
    }
  };

  // Render a group section
  const renderGroup = (label: string, items: AIConversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
          {label}
        </p>
        <div className="px-1.5">
          {items.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === selectedId}
              onSelect={onSelect}
              onRenameStart={handleRenameStart}
              onDeleteRequest={handleDeleteRequest}
              onStar={handleStar}
              navigate={navigate}
              editingId={editingId}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onRenameConfirm={handleRenameConfirm}
            />
          ))}
        </div>
      </div>
    );
  };

  const hasAny =
    grouped.pinned.length +
    grouped.today.length +
    grouped.thisWeek.length +
    grouped.thisMonth.length +
    grouped.older.length;

  return (
    <div className="h-full flex flex-col bg-muted/30 border-r">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-1">
        {renderGroup('⭐ Fijadas', grouped.pinned)}
        {renderGroup('Hoy', grouped.today)}
        {renderGroup('Esta semana', grouped.thisWeek)}
        {renderGroup('Este mes', grouped.thisMonth)}
        {renderGroup('Anteriores', grouped.older)}

        {hasAny === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay conversaciones
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.matter_id
                ? 'Conversación vinculada a expediente'
                : '¿Eliminar conversación?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.matter_id
                ? 'Esta consulta forma parte del expediente vinculado y quedará registrada en su historial como evidencia de actividad jurídica. Solo se eliminará de este panel de conversaciones.'
                : 'Esta acción eliminará la conversación permanentemente. No se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={cn(
                deleteTarget?.matter_id
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {deleteTarget?.matter_id
                ? 'Eliminar del sidebar'
                : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
