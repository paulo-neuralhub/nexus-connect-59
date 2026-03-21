// ============================================================
// CallActivityCard - Rich call card for CRM timeline
// ============================================================

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Play, Link2,
  CheckCircle, XCircle, Voicemail, PhoneOff, Clock,
  User, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RecordingPlayer } from './RecordingPlayer';
import { LinkToMatterDropdown } from './LinkToMatterDropdown';

export interface CallActivityData {
  id: string;
  activity_type: string;
  subject?: string | null;
  description?: string | null;
  outcome?: string | null;
  activity_date: string;
  created_by?: string | null;
  metadata?: Record<string, unknown> | null;
  // Telephony-specific fields from metadata
  direction?: string;
  call_duration_seconds?: number;
  destination_number?: string;
  call_outcome?: string;
  recording_url?: string;
  matter_id?: string | null;
  account_id?: string | null;
  contact_name?: string;
  caller_name?: string;
  next_action?: string;
  next_action_date?: string;
  call_sid?: string;
  cdr_id?: string;
}

interface CallActivityCardProps {
  activity: CallActivityData;
  onMatterLinked?: () => void;
}

const outcomeConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  answered: { icon: CheckCircle, label: 'Contestó', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  completed: { icon: CheckCircle, label: 'Completada', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  no_answer: { icon: XCircle, label: 'Sin respuesta', className: 'text-amber-600 bg-amber-50 border-amber-200' },
  voicemail: { icon: Voicemail, label: 'Buzón de voz', className: 'text-blue-600 bg-blue-50 border-blue-200' },
  busy: { icon: PhoneOff, label: 'Ocupado', className: 'text-red-600 bg-red-50 border-red-200' },
  failed: { icon: XCircle, label: 'Fallida', className: 'text-red-600 bg-red-50 border-red-200' },
};

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0 seg';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seg`;
  return `${mins} min ${secs} seg`;
}

export function CallActivityCard({ activity, onMatterLinked }: CallActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMatterLink, setShowMatterLink] = useState(false);

  // Extract metadata
  const meta = activity.metadata || {};
  const direction = activity.direction || (meta.direction as string) || 'outbound';
  const duration = activity.call_duration_seconds ?? (meta.call_duration_seconds as number) ?? (meta.duration_seconds as number) ?? 0;
  const destination = activity.destination_number || (meta.destination_number as string) || (meta.to_number as string) || '';
  const outcome = activity.call_outcome || activity.outcome || (meta.call_outcome as string) || (meta.outcome as string) || 'completed';
  const recordingUrl = activity.recording_url || (meta.recording_stored_path as string) || (meta.recording_url as string) || '';
  const matterId = activity.matter_id || (meta.matter_id as string) || null;
  const contactName = activity.contact_name || (meta.contact_name as string) || '';
  const callerName = activity.caller_name || (meta.caller_name as string) || '';
  const nextAction = activity.next_action || (meta.next_action as string) || '';
  const nextActionDate = activity.next_action_date || (meta.next_action_date as string) || '';
  const notes = activity.description || (meta.notes as string) || '';
  const accountId = activity.account_id || (meta.account_id as string) || null;
  const cdrId = activity.cdr_id || (meta.cdr_id as string) || null;

  const isInbound = direction === 'inbound';
  const DirectionIcon = isInbound ? PhoneIncoming : PhoneOutgoing;
  const outcomeInfo = outcomeConfig[outcome] || outcomeConfig.completed;
  const OutcomeIcon = outcomeInfo.icon;

  const timeString = formatDistanceToNow(new Date(activity.activity_date), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            isInbound ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
          )}>
            <DirectionIcon className="h-5 w-5" />
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">
                {isInbound ? '📲 Llamada entrante' : '📞 Llamada saliente'}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs gap-1', outcomeInfo.className)}
              >
                <OutcomeIcon className="h-3 w-3" />
                {outcomeInfo.label}
              </Badge>
            </div>

            {/* Destination + duration */}
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {destination && (
                <span className="font-mono">{destination}</span>
              )}
              {contactName && (
                <span className="truncate">• {contactName}</span>
              )}
              {duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Time + expand */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">{timeString}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Notes preview (always visible if short) */}
      {notes && !expanded && (
        <p className="text-sm text-muted-foreground line-clamp-2 ml-[52px]">{notes}</p>
      )}

      {/* Expanded section */}
      {expanded && (
        <div className="ml-[52px] space-y-3">
          {/* Full notes */}
          {notes && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</div>
          )}

          {/* Next action */}
          {nextAction && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                Próxima: {nextAction}
              </Badge>
              {nextActionDate && (
                <span className="text-xs text-muted-foreground">{nextActionDate}</span>
              )}
            </div>
          )}

          {/* Recording player */}
          {recordingUrl && (
            <RecordingPlayer
              url={recordingUrl}
              duration={duration}
              className="mt-2"
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!matterId && accountId && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowMatterLink(!showMatterLink)}
              >
                <Link2 className="h-3.5 w-3.5" />
                Vincular a expediente
              </Button>
            )}
            {matterId && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Link2 className="h-3 w-3" />
                Expediente vinculado
              </Badge>
            )}
          </div>

          {/* Matter linking dropdown */}
          {showMatterLink && accountId && cdrId && (
            <LinkToMatterDropdown
              accountId={accountId}
              cdrId={cdrId}
              activityId={activity.id}
              contactName={contactName}
              duration={duration}
              outcome={outcomeInfo.label}
              onLinked={() => {
                setShowMatterLink(false);
                onMatterLinked?.();
              }}
              onCancel={() => setShowMatterLink(false)}
            />
          )}

          {/* Caller info */}
          {callerName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <User className="h-3.5 w-3.5" />
              <span>{callerName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
