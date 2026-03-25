// ============================================================
// IP-NEXUS — Matter Group List (grouped inbox view)
// ============================================================

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, MessageCircle, Phone, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MatterGroup } from '@/hooks/use-inbox-grouped';
import type { InboxMessage } from '@/hooks/use-inbox';

// ── Urgency border color ──
function getUrgencyBorderColor(maxUrgency: number): string {
  if (maxUrgency >= 9) return '#EF4444';
  if (maxUrgency >= 7) return '#F97316';
  if (maxUrgency >= 5) return '#F59E0B';
  if (maxUrgency > 0) return '#94A3B8';
  return '#E2E8F0';
}

// ── Matter type badge ──
function MatterTypeBadge({ type }: { type?: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    trademark: { label: 'TM', bg: '#EDE9FE', color: '#6D28D9' },
    patent: { label: 'PAT', bg: '#DBEAFE', color: '#1D4ED8' },
    design: { label: 'DIS', bg: '#DCFCE7', color: '#15803D' },
  };
  const c = config[type || ''] || { label: type?.toUpperCase()?.slice(0, 3) || '?', bg: '#F1F5F9', color: '#64748B' };
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

// ── Channel icon ──
function MiniChannelIcon({ channel }: { channel: string }) {
  const cls = 'h-3 w-3 flex-shrink-0';
  switch (channel) {
    case 'email': return <Mail className={cn(cls, 'text-primary')} />;
    case 'whatsapp': return <MessageCircle className={cn(cls, 'text-green-500')} />;
    case 'phone': return <Phone className={cn(cls, 'text-muted-foreground')} />;
    default: return <Mail className={cn(cls, 'text-muted-foreground')} />;
  }
}

// ── Category mini badge ──
function MiniCategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const map: Record<string, string> = {
    instruction: '📋', query: '❓', urgent: '🚨', admin: '📄',
  };
  return <span className="text-[10px]">{map[category] || '📨'}</span>;
}

interface MatterGroupListProps {
  groups: MatterGroup[];
  selectedMessageId: string | null;
  expandedGroupId: string | null;
  onExpandGroup: (groupKey: string | null) => void;
  onSelectMessage: (msgId: string, group: MatterGroup) => void;
}

export function MatterGroupList({
  groups, selectedMessageId, expandedGroupId, onExpandGroup, onSelectMessage,
}: MatterGroupListProps) {
  return (
    <div className="py-1 space-y-1">
      {groups.map(group => {
        const groupKey = group.matterId || '__unlinked__';
        const isExpanded = expandedGroupId === groupKey;
        const isSingleMessage = group.messages.length === 1;
        const isUnlinked = !group.matterId;

        return (
          <MatterGroupCard
            key={groupKey}
            group={group}
            groupKey={groupKey}
            isExpanded={isExpanded}
            isSingleMessage={isSingleMessage}
            isUnlinked={isUnlinked}
            selectedMessageId={selectedMessageId}
            onToggle={() => {
              if (isSingleMessage) {
                onSelectMessage(group.messages[0].id, group);
              } else {
                onExpandGroup(isExpanded ? null : groupKey);
                // Auto-select latest message
                if (!isExpanded) {
                  onSelectMessage(group.lastMessage.id, group);
                }
              }
            }}
            onSelectMessage={(msgId) => onSelectMessage(msgId, group)}
          />
        );
      })}
    </div>
  );
}

function MatterGroupCard({
  group, groupKey, isExpanded, isSingleMessage, isUnlinked,
  selectedMessageId, onToggle, onSelectMessage,
}: {
  group: MatterGroup; groupKey: string; isExpanded: boolean;
  isSingleMessage: boolean; isUnlinked: boolean;
  selectedMessageId: string | null;
  onToggle: () => void; onSelectMessage: (id: string) => void;
}) {
  const borderColor = getUrgencyBorderColor(group.maxUrgency);
  const timeAgo = group.lastMessage.created_at
    ? formatDistanceToNow(new Date(group.lastMessage.created_at), { addSuffix: false, locale: es })
    : '';
  const isGroupSelected = group.messages.some(m => m.id === selectedMessageId);

  if (isUnlinked) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'w-[calc(100%-16px)] text-left rounded-[10px] border p-3 mx-2 transition-all duration-150 cursor-pointer',
          'hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
          isGroupSelected ? 'shadow-[0_2px_8px_rgba(245,158,11,0.15)]' : '',
        )}
        style={{
          borderLeft: '4px solid #F59E0B',
          backgroundColor: '#FFF7ED',
          borderColor: '#FDE68A',
        }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">Sin expediente asignado</span>
          <span className="ml-auto text-xs text-amber-700">{group.messages.length} mensajes</span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[10px] border mx-2 transition-all duration-150',
        'hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
        isGroupSelected ? 'shadow-[0_2px_8px_rgba(59,130,246,0.15)]' : '',
      )}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        borderColor: isGroupSelected ? '#BFDBFE' : '#E2E8F0',
        backgroundColor: isGroupSelected ? '#FAFCFF' : 'white',
      }}
    >
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full text-left p-3 cursor-pointer">
        <div className="flex items-center gap-2 mb-1">
          <MatterTypeBadge type={group.matter?.type} />
          <span className="text-sm font-bold text-[#0a2540] truncate">{group.matter?.reference || 'Sin ref.'}</span>
          <span className="ml-auto text-[11px] text-muted-foreground whitespace-nowrap">hace {timeAgo}</span>
        </div>
        <p className="text-[13px] text-[#0F172A] truncate mb-1">
          {group.matter?.title || 'Expediente'}
          {group.matter?.jurisdiction_code && (
            <span className="text-muted-foreground"> — {group.matter.jurisdiction_code}</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" /> {group.messages.length} mensajes
          </span>
          <span>·</span>
          <span className="truncate">{group.senders.slice(0, 3).join(', ')}</span>
          {!isSingleMessage && (
            <span className="ml-auto">
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>
        {group.maxUrgency >= 7 && (
          <div className="mt-1.5">
            <Badge className={cn(
              'text-[10px] border-0',
              group.maxUrgency >= 9 ? 'bg-destructive/10 text-destructive' : 'bg-orange-100 text-orange-700'
            )}>
              {group.maxUrgency >= 9 ? '🚨 Crítico' : '⚠️ Urgente'}
            </Badge>
          </div>
        )}
      </button>

      {/* Expanded messages */}
      {isExpanded && !isSingleMessage && (
        <div className="px-2 pb-2 border-t border-[#F1F5F9]">
          {group.messages.map(msg => {
            const msgTime = msg.created_at
              ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: es })
              : '';
            const isSelected = msg.id === selectedMessageId;
            return (
              <button
                key={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className={cn(
                  'w-full text-left rounded-md px-2.5 py-2 my-0.5 transition-colors cursor-pointer',
                  isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]',
                )}
              >
                <div className="flex items-center gap-2">
                  <MiniChannelIcon channel={msg.channel} />
                  <span className="text-xs font-medium truncate">{msg.sender_name || 'Desconocido'}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground truncate flex-1">{msg.subject || '(Sin asunto)'}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{msgTime}</span>
                  <MiniCategoryBadge category={msg.ai_category} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
