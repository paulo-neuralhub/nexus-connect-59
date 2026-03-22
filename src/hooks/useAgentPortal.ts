/**
 * useAgentPortal — Hook for the Agent Portal
 * Calls portal-agent-context Edge Function
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { useParams, useNavigate } from 'react-router-dom';

export interface AgentClient {
  id: string;
  client_account_id: string;
  relationship_type: string;
  billing_party: string;
  agent_client_reference: string | null;
  name: string;
  email: string | null;
  account_type: string;
  total_matters: number;
  active_matters: number;
  deadlines_next_30d: number;
  overdue_deadlines: number;
  pending_invoices_eur: number;
  last_matter_update: string | null;
}

export interface AgentInfo {
  crm_account_id: string;
  agent_name: string;
  org_name: string;
  branding: Record<string, unknown>;
}

export interface GlobalKpis {
  total_active_matters: number;
  total_deadlines_30d: number;
  total_overdue: number;
  total_pending_invoices: number;
  pending_instructions: number;
  total_clients: number;
}

export interface AgentMatter {
  id: string;
  title: string;
  status: string;
  type: string;
  jurisdiction: string;
  reference: string;
  family_name: string | null;
  family_id: string | null;
  updated_at: string;
  owner_account_id: string | null;
  intermediate_agent_id: string | null;
}

interface AgentPortalState {
  agent: AgentInfo | null;
  clients: AgentClient[];
  activeClient: AgentClient | null;
  activeClientMatters: AgentMatter[];
  globalKpis: GlobalKpis;
  isLoading: boolean;
  error: string | null;
  setActiveClient: (client: AgentClient | null) => void;
  refreshContext: () => Promise<void>;
}

// Mock data for development
const MOCK_CLIENTS: AgentClient[] = [
  {
    id: 'rel-1', client_account_id: 'client-1', relationship_type: 'manages',
    billing_party: 'agent', agent_client_reference: 'SXY-001',
    name: 'Startup XYZ', email: 'info@startupxyz.com', account_type: 'company',
    total_matters: 12, active_matters: 3, deadlines_next_30d: 3,
    overdue_deadlines: 2, pending_invoices_eur: 1200, last_matter_update: new Date().toISOString(),
  },
  {
    id: 'rel-2', client_account_id: 'client-2', relationship_type: 'manages',
    billing_party: 'agent', agent_client_reference: 'TC-002',
    name: 'TechCorp', email: 'legal@techcorp.io', account_type: 'company',
    total_matters: 8, active_matters: 2, deadlines_next_30d: 1,
    overdue_deadlines: 0, pending_invoices_eur: 450, last_matter_update: new Date().toISOString(),
  },
  {
    id: 'rel-3', client_account_id: 'client-3', relationship_type: 'manages',
    billing_party: 'client', agent_client_reference: 'NC-003',
    name: 'NewCo', email: 'ip@newco.com', account_type: 'company',
    total_matters: 5, active_matters: 1, deadlines_next_30d: 0,
    overdue_deadlines: 0, pending_invoices_eur: 0, last_matter_update: new Date().toISOString(),
  },
];

const MOCK_MATTERS: AgentMatter[] = [
  { id: 'm1', title: 'NEXUS', status: 'registered', type: 'trademark', jurisdiction: 'EUIPO', reference: 'NX-2024-001', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: new Date().toISOString(), owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm2', title: 'NEXUS', status: 'examination', type: 'trademark', jurisdiction: 'USPTO', reference: 'NX-2024-002', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: new Date().toISOString(), owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm3', title: 'NEXUS', status: 'registered', type: 'trademark', jurisdiction: 'OEPM', reference: 'NX-2024-003', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: new Date().toISOString(), owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm4', title: 'ALPHA', status: 'filed', type: 'trademark', jurisdiction: 'EUIPO', reference: 'AL-2025-001', family_name: null, family_id: null, updated_at: new Date().toISOString(), owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm5', title: 'BETA', status: 'registered', type: 'trademark', jurisdiction: 'EUIPO', reference: 'BT-2024-001', family_name: null, family_id: null, updated_at: new Date().toISOString(), owner_account_id: 'client-2', intermediate_agent_id: 'agent-1' },
];

export function useAgentPortal(): AgentPortalState {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [clients, setClients] = useState<AgentClient[]>([]);
  const [activeClient, setActiveClientState] = useState<AgentClient | null>(null);
  const [activeClientMatters, setActiveClientMatters] = useState<AgentMatter[]>([]);
  const [globalKpis, setGlobalKpis] = useState<GlobalKpis>({
    total_active_matters: 0, total_deadlines_30d: 0, total_overdue: 0,
    total_pending_invoices: 0, pending_instructions: 0, total_clients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMockData = useCallback(() => {
    setAgent({
      crm_account_id: 'agent-1',
      agent_name: 'Tech IP Consulting',
      org_name: 'IP-NEXUS Law Firm',
      branding: { primary_color: '#10B981', portal_name: 'IP-NEXUS Portal' },
    });
    setClients(MOCK_CLIENTS);
    setGlobalKpis({
      total_active_matters: MOCK_CLIENTS.reduce((s, c) => s + c.active_matters, 0),
      total_deadlines_30d: MOCK_CLIENTS.reduce((s, c) => s + c.deadlines_next_30d, 0),
      total_overdue: MOCK_CLIENTS.reduce((s, c) => s + c.overdue_deadlines, 0),
      total_pending_invoices: MOCK_CLIENTS.reduce((s, c) => s + c.pending_invoices_eur, 0),
      pending_instructions: 3,
      total_clients: MOCK_CLIENTS.length,
    });
    setIsLoading(false);
  }, []);

  const refreshContext = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Use mock data when no auth
        loadMockData();
        return;
      }

      const body: Record<string, unknown> = {};
      if (activeClient) body.active_client_account_id = activeClient.client_account_id;

      const { data, error: fnError } = await supabase.functions.invoke('portal-agent-context', { body });

      if (fnError) {
        if (fnError.message?.includes('403') || fnError.message?.includes('not_agent_portal')) {
          navigate(`/portal/${slug}/dashboard`);
          return;
        }
        throw fnError;
      }

      if (data) {
        setAgent(data.agent);
        setClients(data.clients || []);
        setGlobalKpis(data.global_kpis || globalKpis);
        if (data.active_client) {
          setActiveClientMatters(data.active_client.matters || []);
        }
      }
    } catch (err: any) {
      console.warn('Agent portal context error, using mock data:', err);
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  }, [activeClient, slug, navigate, loadMockData]);

  useEffect(() => {
    refreshContext();
  }, []);

  const setActiveClient = useCallback((client: AgentClient | null) => {
    setActiveClientState(client);
    if (client) {
      const matters = MOCK_MATTERS.filter(m => m.owner_account_id === client.client_account_id);
      setActiveClientMatters(matters);
    } else {
      setActiveClientMatters([]);
    }
  }, []);

  return {
    agent, clients, activeClient, activeClientMatters,
    globalKpis, isLoading, error, setActiveClient, refreshContext,
  };
}
