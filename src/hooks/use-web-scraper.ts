import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

// ===== IMPORT SOURCES (Web Scraping) =====

interface CreateScrapingSourceParams {
  name: string;
  system_id: string;
  organization_id: string;
  portal_url: string;
  username: string;
  password: string;
}

/**
 * Create a web scraping import source with encrypted credentials.
 * Credentials are sent to the edge function for server-side encryption.
 * They are NEVER stored in plaintext.
 */
export function useCreateScrapingSource() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: CreateScrapingSourceParams) => {
      // 1. Create the import_source record (without credentials)
      const { data: source, error: sourceError } = await supabase
        .from('import_sources')
        .insert({
          name: params.name,
          source_type: 'web_scraper',
          system_id: params.system_id,
          organization_id: currentOrganization!.id, // Always use context, not params
          config: { portal_url: params.portal_url },
          scraper_config: {
            login_url: params.portal_url,
            base_url: params.portal_url.replace(/\/$/, ''),
            rate_limit: {
              requests_per_minute: 10,
              delay_between_pages_ms: 3000,
              max_concurrent: 1,
            },
          },
          is_active: true,
        } as any)
        .select()
        .single();

      if (sourceError || !source) {
        throw new Error(sourceError?.message || 'Error al crear la fuente de datos');
      }

      // 2. Encrypt credentials via edge function (service-role only)
      const { error: encryptError } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'encrypt-credentials',
            source_id: source.id,
            credentials: {
              username: params.username,
              password: params.password,
            },
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (encryptError) {
        // Rollback: delete the source if encryption fails
        await supabase.from('import_sources').delete().eq('id', source.id);
        throw new Error('Error al cifrar las credenciales');
      }

      return source as { id: string; name: string; system_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-sources'] });
    },
  });
}

/**
 * Test connection to a web scraping source.
 * Calls the edge function with action: test-connection.
 */
export function useTestScrapingConnection() {
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'test-connection',
            source_id: sourceId,
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (error) throw error;
      return data as {
        success: boolean;
        message: string;
        page_title?: string;
        detected_structure?: {
          navigation_links: number;
          tables: number;
          forms: number;
        };
      };
    },
  });
}

/**
 * Discover portal structure (navigation, tables, entities).
 */
export function useDiscoverPortal() {
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'discover',
            source_id: sourceId,
            options: { max_pages: 5 },
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Start a scraping session.
 */
export function useStartScraping() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      sourceId,
      entityTypes,
      options,
    }: {
      sourceId: string;
      entityTypes: string[];
      options?: {
        max_pages?: number;
        include_details?: boolean;
        create_import_job?: boolean;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'scrape',
            source_id: sourceId,
            entity_types: entityTypes,
            options: options || { create_import_job: true },
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraping-sessions'] });
    },
  });
}

/**
 * Get scraping session status (with auto-refresh while active).
 */
export function useScrapingSession(sessionId: string | null) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['scraping-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'status',
            session_id: sessionId,
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!currentOrganization?.id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.is_active ? 3000 : false; // Poll every 3s while active
    },
  });
}

/**
 * Cancel a scraping session.
 */
export function useCancelScraping() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'web-scraper-engine',
        {
          body: {
            action: 'cancel',
            session_id: sessionId,
          },
          headers: {
            'x-organization-id': currentOrganization!.id,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraping-sessions'] });
    },
  });
}

/**
 * List all scraping sessions for the current organization.
 */
export function useScrapingSessions() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['scraping-sessions', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_sessions')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });
}

/**
 * List import sources of type web_scraper.
 */
export function useScrapingSources() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['import-sources', 'web_scraper', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_sources')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('source_type', 'web_scraper')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });
}
