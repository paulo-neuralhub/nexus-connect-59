/**
 * MatterDetailTabs - Reorganized tabs per DOCKET-01 spec
 * Tabs: Resumen, Plazos, Documentos, Actividad, Costes, Detalles
 */

import * as React from 'react';
import { 
  FileText, Calendar, FolderOpen, MessageCircle,
  Euro, Settings
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface TabCounters {
  filings?: number;
  parties?: number;
  documents?: number;
  deadlines?: number;
  communications?: number;
  tasks?: number;
  tasksUrgent?: number;
  invoices?: number;
  invoicesUnpaid?: number;
  timeline?: number;
  costs?: number;
}

interface MatterDetailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counters: TabCounters;
}

const TABS = [
  { id: 'general', label: 'Resumen', icon: FileText, counterKey: null, emoji: '📋' },
  { id: 'deadlines', label: 'Plazos', icon: Calendar, counterKey: 'deadlines', emoji: '⏰' },
  { id: 'documents', label: 'Documentos', icon: FolderOpen, counterKey: 'documents', emoji: '📄' },
  { id: 'activity', label: 'Actividad', icon: MessageCircle, counterKey: 'timeline', emoji: '💬' },
  { id: 'costs', label: 'Costes', icon: Euro, counterKey: 'costs', emoji: '💰' },
  { id: 'details', label: 'Detalles', icon: Settings, counterKey: null, emoji: '⚙️' },
] as const;

export const MatterDetailTabs: React.FC<MatterDetailTabsProps> = ({
  activeTab,
  onTabChange,
  counters,
}) => {
  return (
    <div className="mb-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.counterKey ? (counters[tab.counterKey as keyof TabCounters] || 0) : 0;
            
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <span className="text-sm">{tab.emoji}</span>
                {tab.label}
                {tab.counterKey && count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default MatterDetailTabs;
