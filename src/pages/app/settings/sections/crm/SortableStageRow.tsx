import * as React from 'react';
import { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, AlertTriangle, Lock, UserCheck, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColorPicker, STAGE_COLORS } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DEFAULT_PIPELINE_IDS = [
  "b0100001-0000-0000-0000-000000000001",
  "b0100002-0000-0000-0000-000000000002",
  "b0100003-0000-0000-0000-000000000003",
  "b0100004-0000-0000-0000-000000000004",
  "b0100005-0000-0000-0000-000000000005",
];

type SortableStageRowProps = {
  id: string;
  stage: any;
  onUpdate: (updates: Record<string, any>) => void;
  onDelete: () => void;
  pipelineId?: string;
};

const LOCK_OPTIONS = [
  { value: 'free', label: '🔓 Libre', icon: Unlock },
  { value: 'confirm', label: '⚠️ Confirmar', icon: AlertTriangle },
  { value: 'matter_driven', label: '🔒 Expediente', icon: Lock },
  { value: 'admin_only', label: '👤 Admin', icon: UserCheck },
];

const MATTER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'examining', label: 'Examinación' },
  { value: 'office_action', label: 'Acción oficial' },
  { value: 'published', label: 'Publicado' },
  { value: 'registered', label: 'Registrado' },
  { value: 'refused', label: 'Rechazado' },
  { value: 'granted', label: 'Concedido' },
  { value: 'renewed', label: 'Renovado' },
  { value: 'lapsed', label: 'Caducado' },
  { value: 'opposed', label: 'En oposición' },
];

export const SortableStageRow = React.forwardRef<HTMLDivElement, SortableStageRowProps>(function SortableStageRow(
  { id, stage, onUpdate, onDelete, pipelineId },
  ref
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [setNodeRef, ref]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const [name, setName] = useState(stage.name || '');
  const [prob, setProb] = useState<number>(Number(stage.probability ?? 50));
  const [showMessage, setShowMessage] = useState(false);
  const [lockMsg, setLockMsg] = useState(stage.lock_message || '');

  const isDefaultPipeline = pipelineId ? DEFAULT_PIPELINE_IDS.includes(pipelineId) : false;
  const lockType = stage.lock_type || 'free';
  const isMatterDrivenProtected = isDefaultPipeline && lockType === 'matter_driven';

  const statusBadge = useMemo(() => {
    if (stage.is_won_stage) return <Badge variant="secondary" className="text-xs">Ganado</Badge>;
    if (stage.is_lost_stage) return <Badge variant="destructive" className="text-xs">Perdido</Badge>;
    return <Badge variant="outline" className="text-xs">Abierto</Badge>;
  }, [stage.is_won_stage, stage.is_lost_stage]);

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        'rounded-lg border bg-background px-3 py-2 space-y-2',
        isDragging && 'opacity-70',
      )}
    >
      <div className="flex items-start md:items-center gap-3">
        <button
          className="p-1 rounded-md hover:bg-muted text-muted-foreground mt-1 md:mt-0"
          aria-label="Reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 grid grid-cols-12 gap-3 items-start md:items-center">
          <div className="col-span-12 md:col-span-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim() && name.trim() !== stage.name) onUpdate({ name: name.trim() });
              }}
            />
          </div>

          <div className="col-span-4 md:col-span-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={prob}
              onChange={(e) => setProb(Number(e.target.value))}
              onBlur={() => {
                const next = Math.max(0, Math.min(100, prob));
                if (next !== stage.probability) onUpdate({ probability: next });
              }}
            />
          </div>

          <div className="col-span-4 md:col-span-2 min-w-0">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
                >
                  <div 
                    className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: stage.color }} 
                  />
                  <span className="min-w-0 text-xs text-muted-foreground truncate">
                    {STAGE_COLORS.find(c => c.value === stage.color)?.name || 'Color'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <ColorPicker 
                  value={stage.color} 
                  onChange={(color) => onUpdate({ color })} 
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Lock type selector */}
          <div className="col-span-4 md:col-span-2 min-w-0">
            {isMatterDrivenProtected ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/50 opacity-60 cursor-not-allowed text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Expediente
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-xs">
                    Protegido en pipelines IP por defecto para garantizar integridad legal
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Select
                value={lockType}
                onValueChange={(val) => onUpdate({ lock_type: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Message edit button */}
          <div className="col-span-12 md:col-span-1">
            {lockType !== 'free' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowMessage(!showMessage)}
              >
                ✎
              </Button>
            )}
          </div>

          <div className="col-span-12 md:col-span-3 flex items-start md:items-center justify-between gap-3">
            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-2">
              {statusBadge}
              <div className="flex items-center gap-1">
                <Switch
                  checked={!!stage.is_won_stage}
                  onCheckedChange={(checked) => {
                    onUpdate({ is_won_stage: checked, is_lost_stage: checked ? false : stage.is_lost_stage });
                  }}
                />
                <span className="text-xs text-muted-foreground">Won</span>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={!!stage.is_lost_stage}
                  onCheckedChange={(checked) => {
                    onUpdate({ is_lost_stage: checked, is_won_stage: checked ? false : stage.is_won_stage });
                  }}
                />
                <span className="text-xs text-muted-foreground">Lost</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lock message editor */}
      {showMessage && lockType !== 'free' && (
        <div className="pl-10">
          <Textarea
            value={lockMsg}
            onChange={(e) => setLockMsg(e.target.value.slice(0, 300))}
            onBlur={() => {
              if (lockMsg !== (stage.lock_message || '')) onUpdate({ lock_message: lockMsg });
            }}
            placeholder="Mensaje para el usuario cuando intente mover un deal a esta etapa..."
            rows={2}
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground mt-1">{lockMsg.length}/300</p>
        </div>
      )}
    </div>
  );
});

SortableStageRow.displayName = 'SortableStageRow';
