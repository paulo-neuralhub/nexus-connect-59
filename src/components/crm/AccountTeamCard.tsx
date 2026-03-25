/**
 * Equipo asignado card for CRM Account detail
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, X, Bell, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  owner: { label: "Responsable", bg: "#DBEAFE", color: "#1D4ED8" },
  agent: { label: "Agente IP", bg: "#EDE9FE", color: "#6D28D9" },
  commercial: { label: "Comercial", bg: "#DCFCE7", color: "#15803D" },
  accountant: { label: "Admin", bg: "#FEF3C7", color: "#B45309" },
  viewer: { label: "Observador", bg: "#F1F5F9", color: "#64748B" },
};

function getAvatarColor(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "hsl(var(--primary))", "#6D28D9", "#15803D", "#B45309",
    "#DC2626", "#0891B2", "#4F46E5", "#C026D3",
  ];
  return colors[Math.abs(hash) % colors.length];
}

interface AccountTeamCardProps {
  accountId: string;
}

export function AccountTeamCard({ accountId }: AccountTeamCardProps) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const orgId = currentOrganization?.id;

  // Fetch team members
  const { data: team = [], isLoading } = useQuery({
    queryKey: ["account-team", accountId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from("account_team_members")
        .select(`
          id, role, is_primary, notifications_enabled, assigned_at,
          user:profiles!account_team_members_user_id_fkey(
            id, first_name, last_name, avatar_url, role
          )
        `)
        .eq("account_id", accountId)
        .order("is_primary", { ascending: false })
        .order("assigned_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId,
  });

  // Fetch org profiles for dropdown
  const { data: orgProfiles = [] } = useQuery({
    queryKey: ["org-profiles", orgId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("organization_id", orgId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Reassign primary owner
  const reassignMutation = useMutation({
    mutationFn: async (newUserId: string) => {
      const client: any = supabase;
      const primaryMember = team.find((m: any) => m.is_primary);
      if (!primaryMember) return;
      const { error } = await client
        .from("account_team_members")
        .update({ user_id: newUserId })
        .eq("id", primaryMember.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-team", accountId] });
      toast.success("Responsable actualizado");
    },
  });

  // Remove member
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const client: any = supabase;
      const { error } = await client
        .from("account_team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-team", accountId] });
      toast.success("Miembro eliminado del equipo");
    },
  });

  const primaryMember = team.find((m: any) => m.is_primary);
  const otherMembers = team.filter((m: any) => !m.is_primary);
  const existingUserIds = team.map((m: any) => m.user?.id).filter(Boolean);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Equipo asignado
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              {/* Primary owner */}
              {primaryMember && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Responsable principal
                  </p>
                  <MemberItem
                    member={primaryMember}
                    isPrimary
                    profiles={orgProfiles}
                    onReassign={(uid) => reassignMutation.mutate(uid)}
                  />
                </div>
              )}

              {/* Other members */}
              {otherMembers.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Equipo
                  </p>
                  <div className="space-y-2">
                    {otherMembers.map((m: any) => (
                      <MemberItem
                        key={m.id}
                        member={m}
                        onRemove={() => {
                          if (confirm(`¿Eliminar a ${m.user?.first_name || "este miembro"} del equipo?`))
                            removeMutation.mutate(m.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!primaryMember && otherMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin equipo asignado
                </p>
              )}

              {primaryMember && otherMembers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Solo hay un responsable asignado
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddTeamMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        accountId={accountId}
        orgId={orgId!}
        currentUserId={user?.id}
        existingUserIds={existingUserIds}
        profiles={orgProfiles}
      />
    </>
  );
}

function MemberItem({
  member,
  isPrimary,
  profiles,
  onReassign,
  onRemove,
}: {
  member: any;
  isPrimary?: boolean;
  profiles?: any[];
  onReassign?: (uid: string) => void;
  onRemove?: () => void;
}) {
  const u = member.user;
  const initials = ((u?.first_name?.[0] || "") + (u?.last_name?.[0] || "")).toUpperCase() || "?";
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Sin nombre";
  const roleBadge = ROLE_BADGES[member.role] || ROLE_BADGES.viewer;
  const avatarBg = getAvatarColor(u?.id || "x");

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
      <Avatar className="w-9 h-9">
        {u?.avatar_url && <AvatarImage src={u.avatar_url} />}
        <AvatarFallback style={{ backgroundColor: avatarBg, color: "#fff" }} className="text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{name}</p>
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap"
            style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
          >
            {roleBadge.label}
          </span>
        </div>
        {member.notifications_enabled && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Bell className="w-3 h-3" /> Notificaciones activas
          </p>
        )}
      </div>

      {isPrimary && profiles && onReassign && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              Reasignar <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
            {profiles
              .filter((p) => p.id !== u?.id)
              .map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => onReassign(p.id)}>
                  <span className="text-sm">
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Sin nombre"}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.role}</span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isPrimary && onRemove && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

function AddTeamMemberModal({
  open, onClose, accountId, orgId, currentUserId, existingUserIds, profiles,
}: {
  open: boolean;
  onClose: () => void;
  accountId: string;
  orgId: string;
  currentUserId?: string;
  existingUserIds: string[];
  profiles: any[];
}) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("agent");
  const [notifications, setNotifications] = useState(true);

  const availableProfiles = profiles.filter((p) => !existingUserIds.includes(p.id));

  const addMutation = useMutation({
    mutationFn: async () => {
      const client: any = supabase;
      const { error } = await client.from("account_team_members").insert({
        organization_id: orgId,
        account_id: accountId,
        user_id: selectedUserId,
        role,
        is_primary: false,
        notifications_enabled: notifications,
        assigned_by: currentUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const p = profiles.find((p) => p.id === selectedUserId);
      toast.success(`${p?.first_name || "Miembro"} añadido al equipo`);
      queryClient.invalidateQueries({ queryKey: ["account-team", accountId] });
      setSelectedUserId("");
      setRole("agent");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Error al añadir miembro"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir miembro al equipo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
              <SelectContent>
                {availableProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agente IP</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="accountant">Admin</SelectItem>
                <SelectItem value="viewer">Observador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Recibir notificaciones</Label>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!selectedUserId || addMutation.isPending}>
              {addMutation.isPending ? "Añadiendo..." : "Añadir"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
