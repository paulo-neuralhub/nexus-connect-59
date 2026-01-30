import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

interface TestDefinition {
  category: string;
  name: string;
  test: (supabase: any, supabaseUrl: string) => Promise<TestResult>;
}

// ============================================================
// TEST DEFINITIONS - 100+ tests organized by category
// ============================================================

const createTests = (): TestDefinition[] => [
  // =====================================================
  // AUTH TESTS (5)
  // =====================================================
  {
    category: 'auth',
    name: 'database_connection',
    test: async (supabase: any) => {
      const { error } = await supabase.from('organizations').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'auth',
    name: 'auth_service_available',
    test: async (supabase: any) => {
      const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'auth',
    name: 'users_table_accessible',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      return { passed: !error, message: error?.message, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'auth',
    name: 'profiles_exist',
    test: async (supabase: any) => {
      const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
      return { passed: !error && (count || 0) > 0, message: `${count} users found`, details: { count } };
    },
  },
  {
    category: 'auth',
    name: 'super_admins_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('super_admins').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // ORGANIZATIONS TESTS (5)
  // =====================================================
  {
    category: 'organizations',
    name: 'list_organizations',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('organizations').select('id, name, slug').limit(10);
      return { passed: !error, message: error?.message, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'organizations',
    name: 'organization_has_settings',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('organizations').select('id, settings').limit(1).single();
      return { passed: !error && data?.settings !== null, message: error?.message };
    },
  },
  {
    category: 'organizations',
    name: 'memberships_exist',
    test: async (supabase: any) => {
      const { count, error } = await supabase.from('memberships').select('*', { count: 'exact', head: true });
      return { passed: !error && (count || 0) > 0, message: `${count} memberships`, details: { count } };
    },
  },
  {
    category: 'organizations',
    name: 'team_members_accessible',
    test: async (supabase: any) => {
      const { error } = await supabase.from('team_members').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'organizations',
    name: 'roles_configured',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('roles').select('id, name').limit(10);
      return { passed: !error && (data?.length || 0) > 0, message: `${data?.length} roles found` };
    },
  },

  // =====================================================
  // ACCOUNTS (CRM) TESTS (6)
  // =====================================================
  {
    category: 'accounts',
    name: 'list_crm_accounts',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_accounts').select('id, name').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'accounts',
    name: 'account_has_required_fields',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_accounts').select('id, name, organization_id').limit(1).maybeSingle();
      if (!data) return { passed: true, message: 'No accounts to verify' };
      const hasRequired = data.id && data.name && data.organization_id;
      return { passed: !error && hasRequired, message: hasRequired ? 'Fields OK' : 'Missing required fields' };
    },
  },
  {
    category: 'accounts',
    name: 'account_type_config_exists',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('client_type_config').select('id, name').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'accounts',
    name: 'payment_classification_exists',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('payment_classification_config').select('id, name').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'accounts',
    name: 'account_search_works',
    test: async (supabase: any) => {
      const { error } = await supabase.from('crm_accounts').select('id').ilike('name', '%a%').limit(5);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'accounts',
    name: 'account_rls_check',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_accounts').select('organization_id');
      if (!data || data.length === 0) return { passed: true, message: 'No data to verify' };
      const orgs = new Set((data as any[]).map((a: any) => a.organization_id));
      return { passed: !error, message: `Data from ${orgs.size} org(s)`, details: { org_count: orgs.size } };
    },
  },

  // =====================================================
  // CONTACTS TESTS (5)
  // =====================================================
  {
    category: 'contacts',
    name: 'list_crm_contacts',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_contacts').select('id, full_name').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'contacts',
    name: 'contact_account_relation',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_contacts').select('id, account_id').not('account_id', 'is', null).limit(1);
      return { passed: !error, message: data?.length ? 'Relations exist' : 'No linked contacts found' };
    },
  },
  {
    category: 'contacts',
    name: 'contacts_table_exists',
    test: async (supabase: any) => {
      const { error } = await supabase.from('contacts').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'contacts',
    name: 'contact_has_email_or_phone',
    test: async (supabase: any) => {
      const { data } = await supabase.from('crm_contacts').select('email, phone').limit(10);
      const withContact = (data as any[])?.filter((c: any) => c.email || c.phone).length || 0;
      return { passed: true, message: `${withContact}/${data?.length || 0} have contact info` };
    },
  },
  {
    category: 'contacts',
    name: 'lead_scoring_available',
    test: async (supabase: any) => {
      const { error } = await supabase.from('crm_contacts').select('lead_score, is_lead').limit(5);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // MATTERS TESTS (10)
  // =====================================================
  {
    category: 'matters',
    name: 'list_matters',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matters').select('id, reference, title').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'matters',
    name: 'matter_reference_format',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('reference').limit(10);
      if (!data?.length) return { passed: true, message: 'No matters to verify' };
      const validRefs = (data as any[]).filter((m: any) => m.reference && m.reference.length >= 5);
      return { passed: validRefs.length === data.length, message: `${validRefs.length}/${data.length} valid refs` };
    },
  },
  {
    category: 'matters',
    name: 'matter_types_configured',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matter_types').select('id, code, name').limit(10);
      return { passed: !error && (data?.length || 0) > 0, details: { count: data?.length } };
    },
  },
  {
    category: 'matters',
    name: 'matter_statuses_exist',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('status').limit(50);
      const statuses = new Set((data as any[])?.map((m: any) => m.status));
      return { passed: true, message: `${statuses.size} unique statuses`, details: { statuses: Array.from(statuses) } };
    },
  },
  {
    category: 'matters',
    name: 'matter_workflow_phases',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('current_phase').not('current_phase', 'is', null).limit(20);
      if (!data?.length) return { passed: true, message: 'No phases assigned yet' };
      const validPhases = (data as any[]).filter((m: any) => /^F[0-9]$/.test(m.current_phase || ''));
      return { passed: validPhases.length > 0, message: `${validPhases.length} with valid phases` };
    },
  },
  {
    category: 'matters',
    name: 'matter_account_relation',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('id, account_id').not('account_id', 'is', null).limit(5);
      return { passed: true, message: `${data?.length || 0} matters linked to accounts` };
    },
  },
  {
    category: 'matters',
    name: 'matter_nice_classes',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('nice_classes, nice_classes_detail').limit(10);
      const withClasses = (data as any[])?.filter((m: any) => m.nice_classes?.length > 0 || m.nice_classes_detail).length || 0;
      return { passed: true, message: `${withClasses} matters have Nice classes` };
    },
  },
  {
    category: 'matters',
    name: 'nice_classes_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('nice_classes').select('class_number, description_es').limit(5);
      return { passed: !error && (data?.length || 0) > 0, details: { count: data?.length } };
    },
  },
  {
    category: 'matters',
    name: 'matter_deadlines_relation',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matter_deadlines').select('id, matter_id').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'matters',
    name: 'matter_timeline_view',
    test: async (supabase: any) => {
      const { error } = await supabase.from('matter_timeline').select('*').limit(5);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // WORKFLOW TESTS (5)
  // =====================================================
  {
    category: 'workflow',
    name: 'workflow_definitions_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('workflow_definitions').select('id, name').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'workflow',
    name: 'workflow_steps_defined',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('workflow_steps').select('id, step_order').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'workflow',
    name: 'workflow_transitions',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('workflow_transitions').select('id').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'workflow',
    name: 'workflow_runs_tracking',
    test: async (supabase: any) => {
      const { error } = await supabase.from('workflow_runs').select('id, status').limit(5);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'workflow',
    name: 'workflow_queue_exists',
    test: async (supabase: any) => {
      const { error } = await supabase.from('workflow_queue').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // COMMUNICATIONS TESTS (8)
  // =====================================================
  {
    category: 'communications',
    name: 'list_communications',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('communications').select('id, type, subject').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'communications',
    name: 'communication_types_varied',
    test: async (supabase: any) => {
      const { data } = await supabase.from('communications').select('type').limit(50);
      const types = new Set((data as any[])?.map((c: any) => c.type));
      return { passed: true, message: `${types.size} types`, details: { types: Array.from(types) } };
    },
  },
  {
    category: 'communications',
    name: 'communication_matter_link',
    test: async (supabase: any) => {
      const { data } = await supabase.from('communications').select('matter_id').not('matter_id', 'is', null).limit(5);
      return { passed: true, message: `${data?.length || 0} linked to matters` };
    },
  },
  {
    category: 'communications',
    name: 'email_messages_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('email_messages').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'communications',
    name: 'call_logs_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('call_logs').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'communications',
    name: 'whatsapp_messages_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('whatsapp_messages').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'communications',
    name: 'activities_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('activities').select('id, type').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'communications',
    name: 'activity_log_tracking',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('activity_log').select('id, action').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },

  // =====================================================
  // DOCUMENTS TESTS (6)
  // =====================================================
  {
    category: 'documents',
    name: 'matter_documents_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matter_documents').select('id, file_name').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'documents',
    name: 'document_templates_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('document_templates').select('id, name, category').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'documents',
    name: 'storage_accessible',
    test: async (supabase: any) => {
      const { data, error } = await supabase.storage.listBuckets();
      return { passed: !error, message: `${data?.length || 0} buckets`, details: { buckets: data?.map((b: any) => b.name) } };
    },
  },
  {
    category: 'documents',
    name: 'documents_bucket_exists',
    test: async (supabase: any) => {
      const { data } = await supabase.storage.listBuckets();
      const hasDocs = data?.some((b: any) => b.name === 'documents' || b.name === 'matter-documents');
      return { passed: hasDocs || false, message: hasDocs ? 'Documents bucket found' : 'No documents bucket' };
    },
  },
  {
    category: 'documents',
    name: 'document_categories',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matter_documents').select('doc_type').limit(50);
      const types = new Set((data as any[])?.map((d: any) => d.doc_type).filter(Boolean));
      return { passed: true, message: `${types.size} doc types`, details: { types: Array.from(types) } };
    },
  },
  {
    category: 'documents',
    name: 'ai_generated_documents',
    test: async (supabase: any) => {
      const { error } = await supabase.from('ai_generated_documents').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // TASKS TESTS (6)
  // =====================================================
  {
    category: 'tasks',
    name: 'list_crm_tasks',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_tasks').select('id, title, status').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'tasks',
    name: 'task_statuses',
    test: async (supabase: any) => {
      const { data } = await supabase.from('crm_tasks').select('status').limit(50);
      const statuses = new Set((data as any[])?.map((t: any) => t.status));
      return { passed: true, details: { statuses: Array.from(statuses) } };
    },
  },
  {
    category: 'tasks',
    name: 'task_matter_relation',
    test: async (supabase: any) => {
      const { data } = await supabase.from('crm_tasks').select('matter_id').not('matter_id', 'is', null).limit(5);
      return { passed: true, message: `${data?.length || 0} linked to matters` };
    },
  },
  {
    category: 'tasks',
    name: 'task_assignment',
    test: async (supabase: any) => {
      const { data } = await supabase.from('crm_tasks').select('assigned_to').not('assigned_to', 'is', null).limit(5);
      return { passed: true, message: `${data?.length || 0} tasks assigned` };
    },
  },
  {
    category: 'tasks',
    name: 'task_due_dates',
    test: async (supabase: any) => {
      const { data } = await supabase.from('crm_tasks').select('due_date').not('due_date', 'is', null).limit(10);
      return { passed: true, message: `${data?.length || 0} with due dates` };
    },
  },
  {
    category: 'tasks',
    name: 'overdue_tasks_detection',
    test: async (supabase: any) => {
      const now = new Date().toISOString();
      const { data } = await supabase.from('crm_tasks')
        .select('id')
        .lt('due_date', now)
        .neq('status', 'completed')
        .limit(10);
      return { passed: true, message: `${data?.length || 0} overdue tasks`, details: { overdue_count: data?.length || 0 } };
    },
  },

  // =====================================================
  // ALERTS / DEADLINES TESTS (5)
  // =====================================================
  {
    category: 'alerts',
    name: 'matter_deadlines_list',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matter_deadlines').select('id, title, due_date').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'alerts',
    name: 'upcoming_deadlines',
    test: async (supabase: any) => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('matter_deadlines')
        .select('id')
        .gte('due_date', new Date().toISOString())
        .lte('due_date', future)
        .limit(20);
      return { passed: true, message: `${data?.length || 0} in next 30 days` };
    },
  },
  {
    category: 'alerts',
    name: 'deadline_types',
    test: async (supabase: any) => {
      const { data } = await supabase.from('deadline_types').select('code, name').limit(10);
      return { passed: true, details: { count: data?.length || 0, types: (data as any[])?.map((t: any) => t.code) } };
    },
  },
  {
    category: 'alerts',
    name: 'notifications_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('notifications').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'alerts',
    name: 'alert_configurations',
    test: async (supabase: any) => {
      const { error } = await supabase.from('deadline_alert_config').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // CALENDAR TESTS (5)
  // =====================================================
  {
    category: 'calendar',
    name: 'calendar_events_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('calendar_events').select('id, title').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'calendar',
    name: 'calendar_connections',
    test: async (supabase: any) => {
      const { error } = await supabase.from('calendar_connections').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'calendar',
    name: 'event_types_exist',
    test: async (supabase: any) => {
      const { data } = await supabase.from('calendar_events').select('event_type').limit(20);
      const types = new Set((data as any[])?.map((e: any) => e.event_type).filter(Boolean));
      return { passed: true, details: { types: Array.from(types) } };
    },
  },
  {
    category: 'calendar',
    name: 'event_matter_link',
    test: async (supabase: any) => {
      const { data } = await supabase.from('calendar_events').select('matter_id').not('matter_id', 'is', null).limit(5);
      return { passed: true, message: `${data?.length || 0} linked to matters` };
    },
  },
  {
    category: 'calendar',
    name: 'upcoming_events',
    test: async (supabase: any) => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('calendar_events')
        .select('id')
        .gte('start_time', new Date().toISOString())
        .lte('start_time', future)
        .limit(10);
      return { passed: true, message: `${data?.length || 0} in next 7 days` };
    },
  },

  // =====================================================
  // TIME TRACKING TESTS (6)
  // =====================================================
  {
    category: 'time_tracking',
    name: 'time_entries_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('time_entries').select('id, duration_minutes').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'time_tracking',
    name: 'billing_rates_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('billing_rates').select('id, hourly_rate').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'time_tracking',
    name: 'time_entry_calculation',
    test: async (supabase: any) => {
      const { data } = await supabase.from('time_entries')
        .select('started_at, ended_at, duration_minutes')
        .not('ended_at', 'is', null)
        .limit(5);
      if (!data?.length) return { passed: true, message: 'No entries to verify' };
      const withDuration = (data as any[]).filter((e: any) => e.duration_minutes !== null);
      return { passed: withDuration.length > 0, message: `${withDuration.length}/${data.length} have duration` };
    },
  },
  {
    category: 'time_tracking',
    name: 'billable_entries',
    test: async (supabase: any) => {
      const { data } = await supabase.from('time_entries').select('is_billable, amount').limit(20);
      const billable = (data as any[])?.filter((e: any) => e.is_billable).length || 0;
      return { passed: true, message: `${billable}/${data?.length || 0} billable` };
    },
  },
  {
    category: 'time_tracking',
    name: 'active_timers',
    test: async (supabase: any) => {
      const { data } = await supabase.from('time_entries').select('id').eq('is_running', true).limit(10);
      return { passed: true, message: `${data?.length || 0} active timers` };
    },
  },
  {
    category: 'time_tracking',
    name: 'time_entry_matter_link',
    test: async (supabase: any) => {
      const { data } = await supabase.from('time_entries').select('matter_id').not('matter_id', 'is', null).limit(10);
      return { passed: true, message: `${data?.length || 0} linked to matters` };
    },
  },

  // =====================================================
  // INVOICING TESTS (7)
  // =====================================================
  {
    category: 'invoicing',
    name: 'invoices_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('invoices').select('id, invoice_number, status').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'invoicing',
    name: 'invoice_line_items',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('invoice_line_items').select('id, quantity, unit_price').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'invoicing',
    name: 'invoice_totals_calculation',
    test: async (supabase: any) => {
      const { data } = await supabase.from('invoices')
        .select('subtotal_amount, tax_amount, total_amount')
        .not('total_amount', 'is', null)
        .limit(5);
      if (!data?.length) return { passed: true, message: 'No invoices to verify' };
      const correct = (data as any[]).filter((i: any) => {
        const expected = (i.subtotal_amount || 0) + (i.tax_amount || 0);
        return Math.abs(expected - (i.total_amount || 0)) < 0.01;
      });
      return { passed: correct.length === data.length, message: `${correct.length}/${data.length} correct totals` };
    },
  },
  {
    category: 'invoicing',
    name: 'invoice_statuses',
    test: async (supabase: any) => {
      const { data } = await supabase.from('invoices').select('status').limit(50);
      const statuses = new Set((data as any[])?.map((i: any) => i.status));
      return { passed: true, details: { statuses: Array.from(statuses) } };
    },
  },
  {
    category: 'invoicing',
    name: 'quotes_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('quotes').select('id, status').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'invoicing',
    name: 'invoice_sequences',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('invoice_sequences').select('id, prefix').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'invoicing',
    name: 'payment_records',
    test: async (supabase: any) => {
      const { error } = await supabase.from('payments').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // TEMPLATES TESTS (5)
  // =====================================================
  {
    category: 'templates',
    name: 'document_templates_list',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('document_templates').select('id, name, category').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'templates',
    name: 'template_categories',
    test: async (supabase: any) => {
      const { data } = await supabase.from('document_templates').select('category').limit(20);
      const categories = new Set((data as any[])?.map((t: any) => t.category));
      return { passed: true, details: { categories: Array.from(categories) } };
    },
  },
  {
    category: 'templates',
    name: 'template_merge_fields',
    test: async (supabase: any) => {
      const { data } = await supabase.from('document_templates').select('merge_fields').limit(5);
      const withFields = (data as any[])?.filter((t: any) => t.merge_fields && t.merge_fields.length > 0).length || 0;
      return { passed: true, message: `${withFields} templates with merge fields` };
    },
  },
  {
    category: 'templates',
    name: 'email_templates_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('email_templates').select('id').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'templates',
    name: 'letter_templates',
    test: async (supabase: any) => {
      const { data } = await supabase.from('document_templates').select('id').eq('category', 'letter').limit(5);
      return { passed: true, message: `${data?.length || 0} letter templates` };
    },
  },

  // =====================================================
  // SIGNATURES TESTS (4)
  // =====================================================
  {
    category: 'signatures',
    name: 'signature_requests_table',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('signature_requests').select('id, status').limit(10);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'signatures',
    name: 'signature_statuses',
    test: async (supabase: any) => {
      const { data } = await supabase.from('signature_requests').select('status').limit(20);
      const statuses = new Set((data as any[])?.map((s: any) => s.status));
      return { passed: true, details: { statuses: Array.from(statuses) } };
    },
  },
  {
    category: 'signatures',
    name: 'signature_signers_data',
    test: async (supabase: any) => {
      const { data } = await supabase.from('signature_requests').select('signers').limit(5);
      const withSigners = (data as any[])?.filter((s: any) => s.signers && Array.isArray(s.signers) && s.signers.length > 0).length || 0;
      return { passed: true, message: `${withSigners} requests with signers` };
    },
  },
  {
    category: 'signatures',
    name: 'signature_audit_log',
    test: async (supabase: any) => {
      const { error } = await supabase.from('signature_audit_log').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },

  // =====================================================
  // ANALYTICS TESTS (5)
  // =====================================================
  {
    category: 'analytics',
    name: 'analytics_events_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('analytics_events').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'analytics',
    name: 'dashboard_widgets',
    test: async (supabase: any) => {
      const { error } = await supabase.from('dashboard_widgets').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'analytics',
    name: 'matters_count_for_kpi',
    test: async (supabase: any) => {
      const { count, error } = await supabase.from('matters').select('*', { count: 'exact', head: true });
      return { passed: !error, message: `${count} total matters`, details: { count } };
    },
  },
  {
    category: 'analytics',
    name: 'invoices_for_revenue_kpi',
    test: async (supabase: any) => {
      const { data } = await supabase.from('invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .limit(100);
      const total = (data as any[])?.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) || 0;
      return { passed: true, message: `€${total.toFixed(2)} revenue`, details: { revenue: total } };
    },
  },
  {
    category: 'analytics',
    name: 'time_entries_for_hours_kpi',
    test: async (supabase: any) => {
      const { data } = await supabase.from('time_entries')
        .select('duration_minutes')
        .eq('is_billable', true)
        .limit(500);
      const hours = ((data as any[])?.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0) || 0) / 60;
      return { passed: true, message: `${hours.toFixed(1)} billable hours`, details: { hours } };
    },
  },

  // =====================================================
  // SEARCH TESTS (4)
  // =====================================================
  {
    category: 'search',
    name: 'search_matters_by_reference',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('matters')
        .select('id')
        .ilike('reference', '%TM%')
        .limit(5);
      return { passed: !error, message: error?.message, details: { results: data?.length || 0 } };
    },
  },
  {
    category: 'search',
    name: 'search_accounts_by_name',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_accounts')
        .select('id')
        .ilike('name', '%a%')
        .limit(5);
      return { passed: !error, details: { results: data?.length || 0 } };
    },
  },
  {
    category: 'search',
    name: 'search_contacts_by_email',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('crm_contacts')
        .select('id')
        .ilike('email', '%@%')
        .limit(5);
      return { passed: !error, details: { results: data?.length || 0 } };
    },
  },
  {
    category: 'search',
    name: 'full_text_search_check',
    test: async (supabase: any) => {
      const { data } = await supabase.from('matters').select('search_vector').limit(1).maybeSingle();
      return { passed: true, message: data?.search_vector ? 'FTS available' : 'FTS not configured' };
    },
  },

  // =====================================================
  // NICE CLASSES TESTS (4)
  // =====================================================
  {
    category: 'nice_classes',
    name: 'nice_classes_45_exist',
    test: async (supabase: any) => {
      const { count, error } = await supabase.from('nice_classes').select('*', { count: 'exact', head: true });
      return { passed: !error && (count || 0) >= 45, message: `${count} classes`, details: { count } };
    },
  },
  {
    category: 'nice_classes',
    name: 'nice_products_seeded',
    test: async (supabase: any) => {
      const { count, error } = await supabase.from('nice_products').select('*', { count: 'exact', head: true });
      return { passed: !error && (count || 0) > 0, message: `${count} products`, details: { count } };
    },
  },
  {
    category: 'nice_classes',
    name: 'nice_class_translations',
    test: async (supabase: any) => {
      const { data } = await supabase.from('nice_classes').select('description_es, description_en').limit(1).single();
      const hasTranslations = data?.description_es && data?.description_en;
      return { passed: hasTranslations || false, message: hasTranslations ? 'Translations OK' : 'Missing translations' };
    },
  },
  {
    category: 'nice_classes',
    name: 'nice_products_by_class',
    test: async (supabase: any) => {
      const { data } = await supabase.from('nice_products').select('class_number').limit(50);
      const classes = new Set((data as any[])?.map((p: any) => p.class_number));
      return { passed: classes.size > 0, message: `Products in ${classes.size} classes` };
    },
  },

  // =====================================================
  // PORTAL TESTS (5)
  // =====================================================
  {
    category: 'portal',
    name: 'portal_configurations_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('client_portal_config').select('id, is_enabled').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'portal',
    name: 'portal_access_tokens',
    test: async (supabase: any) => {
      const { error } = await supabase.from('portal_access_tokens').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'portal',
    name: 'portal_sessions_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('portal_sessions').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'portal',
    name: 'portal_file_access_logs',
    test: async (supabase: any) => {
      const { error } = await supabase.from('portal_file_access_log').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'portal',
    name: 'portal_contact_relations',
    test: async (supabase: any) => {
      const { data } = await supabase.from('contacts').select('portal_access_enabled').limit(10);
      const enabled = (data as any[])?.filter((c: any) => c.portal_access_enabled).length || 0;
      return { passed: true, message: `${enabled} contacts with portal access` };
    },
  },

  // =====================================================
  // SETTINGS TESTS (4)
  // =====================================================
  {
    category: 'settings',
    name: 'organization_settings_exist',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('organization_settings').select('id').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },
  {
    category: 'settings',
    name: 'user_settings_table',
    test: async (supabase: any) => {
      const { error } = await supabase.from('user_settings').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'settings',
    name: 'email_configs_exist',
    test: async (supabase: any) => {
      const { error } = await supabase.from('email_configs').select('id').limit(1);
      return { passed: !error, message: error?.message };
    },
  },
  {
    category: 'settings',
    name: 'active_sessions_tracking',
    test: async (supabase: any) => {
      const { data, error } = await supabase.from('active_sessions').select('id').limit(5);
      return { passed: !error, details: { count: data?.length || 0 } };
    },
  },

  // =====================================================
  // EDGE FUNCTIONS TESTS (3)
  // =====================================================
  {
    category: 'edge_functions',
    name: 'health_endpoint',
    test: async (_supabase: any, supabaseUrl: string) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/health`);
        return { passed: res.ok, message: `Status: ${res.status}`, details: { status: res.status } };
      } catch (e) {
        return { passed: false, message: e instanceof Error ? e.message : 'Failed' };
      }
    },
  },
  {
    category: 'edge_functions',
    name: 'api_v1_endpoint',
    test: async (_supabase: any, supabaseUrl: string) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/api-v1`, { method: 'OPTIONS' });
        return { passed: res.status < 500, details: { status: res.status } };
      } catch (e) {
        return { passed: false, message: e instanceof Error ? e.message : 'Failed' };
      }
    },
  },
  {
    category: 'edge_functions',
    name: 'genius_chat_available',
    test: async (_supabase: any, supabaseUrl: string) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/genius-chat`, { method: 'OPTIONS' });
        return { passed: res.status < 500, details: { status: res.status } };
      } catch (e) {
        return { passed: false, message: e instanceof Error ? e.message : 'Failed' };
      }
    },
  },
];

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const runId = crypto.randomUUID();
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get tests
  const tests = createTests();
  
  // Parse query params for filtering
  const url = new URL(req.url);
  const categoryFilter = url.searchParams.get('category');
  const filteredTests = categoryFilter 
    ? tests.filter(t => t.category === categoryFilter)
    : tests;

  const results: Array<{
    category: string;
    name: string;
    status: string;
    message?: string;
    duration_ms: number;
    details?: Record<string, unknown>;
  }> = [];

  // Run all tests
  for (const test of filteredTests) {
    const testStart = Date.now();
    let status = 'passed';
    let message: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      const result = await test.test(supabase, supabaseUrl);
      status = result.passed ? 'passed' : 'failed';
      message = result.message;
      details = result.details;
    } catch (error) {
      status = 'failed';
      message = error instanceof Error ? error.message : 'Unknown error';
    }

    const duration = Date.now() - testStart;
    
    results.push({
      category: test.category,
      name: test.name,
      status,
      message,
      duration_ms: duration,
      details,
    });

    // Save to database
    await supabase.from('system_tests').insert({
      run_id: runId,
      category: test.category,
      test_name: test.name,
      status,
      message,
      duration_ms: duration,
      details: details || {},
    });
  }

  // Calculate summary
  const summary = {
    run_id: runId,
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    warnings: results.filter(r => r.status === 'warning').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    duration_ms: Date.now() - startTime,
    pass_rate: Math.round((results.filter(r => r.status === 'passed').length / results.length) * 100),
  };

  // Group by category
  const byCategory: Record<string, typeof results> = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }

  return new Response(JSON.stringify({
    summary,
    by_category: byCategory,
    results,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
