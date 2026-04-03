/**
 * Portal Authentication Hook — V2
 * Uses Supabase Auth + portal_access table (Phase 1 schema)
 */

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================

export interface PortalPermissions {
  can_view_matters: boolean;
  can_view_documents: boolean;
  can_view_invoices: boolean;
  can_view_deadlines: boolean;
  can_view_alerts: boolean;
  can_request_services: boolean;
  can_pay_invoices: boolean;
  can_sign_documents: boolean;
  can_use_basic_search: boolean;
  can_use_advanced_search: boolean;
  can_message_despacho: boolean;
  can_use_chatbot: boolean;
  can_complete_intake_forms: boolean;
  can_sync_calendar: boolean;
}

export interface PortalOrg {
  id: string;
  slug: string;
  name: string;
  portal_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  portal_chatbot_name: string | null;
  portal_show_ipnexus_branding: boolean;
  portal_footer_text: string | null;
}

export interface PortalCrmAccount {
  id: string;
  name: string;
  email: string;
  portal_notification_email: boolean;
}

export interface PortalUser {
  id: string; // auth.uid()
  email: string;
  name: string;
  role: string;
  permissions: PortalPermissions;
  portal: {
    id: string;
    slug: string;
    name: string;
    logo_url?: string;
    primary_color?: string;
    organization_id: string;
  };
  contactId: string;
}

interface PortalAuthContextType {
  user: PortalUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  portalAccess: any | null;
  crmAccount: PortalCrmAccount | null;
  org: PortalOrg | null;
  permissions: PortalPermissions | null;
  isImpersonating: boolean;
  impersonateSessionId: string | null;
  login: (email: string, portalSlug: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const defaultPermissions: PortalPermissions = {
  can_view_matters: true,
  can_view_documents: true,
  can_view_invoices: true,
  can_view_deadlines: true,
  can_view_alerts: false,
  can_request_services: false,
  can_pay_invoices: false,
  can_sign_documents: false,
  can_use_basic_search: false,
  can_use_advanced_search: false,
  can_message_despacho: true,
  can_use_chatbot: true,
  can_complete_intake_forms: true,
  can_sync_calendar: true,
};

// =============================================
// CONTEXT
// =============================================

const PortalAuthContext = createContext<PortalAuthContextType | null>(null);

// =============================================
// PROVIDER
// =============================================

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [portalAccess, setPortalAccess] = useState<any | null>(null);
  const [crmAccount, setCrmAccount] = useState<PortalCrmAccount | null>(null);
  const [org, setOrg] = useState<PortalOrg | null>(null);
  const [permissions, setPermissions] = useState<PortalPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonateSessionId, setImpersonateSessionId] = useState<string | null>(null);

  const loadPortalData = useCallback(async (authUserId: string, authEmail: string, organizationId?: string) => {
    try {
      // Query portal_access — scoped to organization when available
      let query = fromTable('portal_access')
        .select('*')
        .eq('portal_user_id', authUserId)
        .eq('status', 'active');

      // Scope to org if subdomain was resolved (prevents multi-org cross-leak)
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: paData, error: paError } = await query.limit(1).maybeSingle();

      if (paError || !paData) {
        return null;
      }

      // Get CRM account
      const { data: caData } = await fromTable('crm_accounts')
        .select('id, name, email, portal_notification_email')
        .eq('id', paData.crm_account_id)
        .single();

      // Get organization (fixed: portal_subdomain not slug)
      const { data: orgData } = await fromTable('organizations')
        .select(`
          id, portal_subdomain, name, portal_name, logo_url,
          primary_color, secondary_color,
          portal_chatbot_name, portal_show_ipnexus_branding,
          portal_footer_text
        `)
        .eq('id', paData.organization_id)
        .single();

      if (!caData || !orgData) return null;

      const perms: PortalPermissions = {
        can_view_matters: paData.can_view_matters ?? true,
        can_view_documents: paData.can_view_documents ?? true,
        can_view_invoices: paData.can_view_invoices ?? true,
        can_view_deadlines: paData.can_view_deadlines ?? true,
        can_view_alerts: paData.can_view_alerts ?? false,
        can_request_services: paData.can_request_services ?? false,
        can_pay_invoices: paData.can_pay_invoices ?? false,
        can_sign_documents: paData.can_sign_documents ?? false,
        can_use_basic_search: paData.can_use_basic_search ?? false,
        can_use_advanced_search: paData.can_use_advanced_search ?? false,
        can_message_despacho: paData.can_message_despacho ?? true,
        can_use_chatbot: paData.can_use_chatbot ?? true,
        can_complete_intake_forms: paData.can_complete_intake_forms ?? true,
        can_sync_calendar: paData.can_sync_calendar ?? true,
      };

      const orgInfo: PortalOrg = {
        id: orgData.id,
        slug: orgData.portal_subdomain || '',
        name: orgData.name || '',
        portal_name: orgData.portal_name,
        logo_url: orgData.logo_url,
        primary_color: orgData.primary_color,
        secondary_color: orgData.secondary_color,
        portal_chatbot_name: orgData.portal_chatbot_name,
        portal_show_ipnexus_branding: orgData.portal_show_ipnexus_branding ?? true,
        portal_footer_text: orgData.portal_footer_text,
      };

      const crmInfo: PortalCrmAccount = {
        id: caData.id,
        name: caData.name || '',
        email: caData.email || '',
        portal_notification_email: caData.portal_notification_email ?? true,
      };

      const portalUser: PortalUser = {
        id: authUserId,
        email: authEmail,
        name: caData.name || authEmail,
        role: paData.access_level || 'viewer',
        permissions: perms,
        portal: {
          id: orgInfo.id,
          slug: orgInfo.slug,
          name: orgInfo.portal_name || orgInfo.name,
          logo_url: orgInfo.logo_url || undefined,
          primary_color: orgInfo.primary_color || undefined,
          organization_id: orgInfo.id,
        },
        contactId: caData.id,
      };

      // Inject branding into DOM (sanitized to prevent CSS injection)
      const hexRe = /^#[0-9a-fA-F]{6}$/;
      const safePrimary = hexRe.test(orgInfo.primary_color || '') ? orgInfo.primary_color! : '#1E40AF';
      const safeSecondary = hexRe.test(orgInfo.secondary_color || '') ? orgInfo.secondary_color! : '#3B82F6';
      const root = document.documentElement;
      root.style.setProperty('--portal-primary', safePrimary);
      root.style.setProperty('--portal-secondary', safeSecondary);
      document.title = orgInfo.portal_name || `Portal ${orgInfo.name}`;

      setPortalAccess(paData);
      setCrmAccount(crmInfo);
      setOrg(orgInfo);
      setPermissions(perms);
      setUser(portalUser);

      // Update last activity
      fromTable('portal_access')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', paData.id)
        .then(() => {});

      return portalUser;
    } catch (err) {
      console.error('Error loading portal data:', err);
      return null;
    }
  }, []);

  // Init: check Supabase Auth session
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadPortalData(session.user.id, session.user.email || '');
        }
      } catch {
        // No session
      }
      setIsLoading(false);
    };

    init();

    // Detect impersonation mode — verify session exists server-side
    const params = new URLSearchParams(window.location.search);
    const impersonateId = params.get('impersonate');
    if (impersonateId) {
      fromTable('portal_impersonation_sessions')
        .select('id')
        .eq('id', impersonateId)
        .eq('is_active', true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setIsImpersonating(true);
            setImpersonateSessionId(impersonateId);
          }
        });
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadPortalData(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPortalAccess(null);
        setCrmAccount(null);
        setOrg(null);
        setPermissions(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPortalData]);

  // Login with magic link — scoped to portal subdomain
  const login = useCallback(async (email: string, portalSlug: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `https://${portalSlug}.ip-nexus.app/auth/callback`,
      },
    });

    if (error) throw new Error(error.message);
    toast.success('Enlace de acceso enviado a tu email');
  }, []);

  const verifyMagicLink = useCallback(async (_token: string): Promise<boolean> => {
    // OTP verification is handled by Supabase Auth automatically
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPortalAccess(null);
    setCrmAccount(null);
    setOrg(null);
    setPermissions(null);
    toast.success('Sesión cerrada');
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadPortalData(session.user.id, session.user.email || '');
    } else {
      setUser(null);
    }
  }, [loadPortalData]);

  return (
    <PortalAuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      portalAccess,
      crmAccount,
      org,
      permissions,
      isImpersonating,
      impersonateSessionId,
      login,
      verifyMagicLink,
      logout,
      refreshSession,
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

// =============================================
// HOOK
// =============================================

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error('usePortalAuth must be used within PortalAuthProvider');
  }
  return context;
}
