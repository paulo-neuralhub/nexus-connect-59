/**
 * Settings > Equipo — Routing de mensajes entrantes
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

export function RoutingConfigSection() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch org profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["org-profiles", orgId],
    queryFn: async () => {
      const client: any = supabase;
      const { data } = await client
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("organization_id", orgId);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Fetch routing rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ["routing-rules", orgId],
    queryFn: async () => {
      const client: any = supabase;
      const { data } = await client
        .from("organization_routing_rules")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const [form, setForm] = useState({
    routing_type: "fixed",
    default_owner_id: "",
    escalate_after_hours: 4,
    escalate_to_id: "",
  });

  useEffect(() => {
    if (rules) {
      setForm({
        routing_type: rules.routing_type || "fixed",
        default_owner_id: rules.default_owner_id || "",
        escalate_after_hours: rules.escalate_after_hours ?? 4,
        escalate_to_id: rules.escalate_to_id || "",
      });
    }
  }, [rules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const client: any = supabase;
      if (rules?.id) {
        const { error } = await client
          .from("organization_routing_rules")
          .update({
            routing_type: form.routing_type,
            default_owner_id: form.default_owner_id || null,
            escalate_after_hours: form.escalate_after_hours,
            escalate_to_id: form.escalate_to_id || null,
          })
          .eq("id", rules.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("organization_routing_rules")
          .insert({
            organization_id: orgId,
            routing_type: form.routing_type,
            default_owner_id: form.default_owner_id || null,
            escalate_after_hours: form.escalate_after_hours,
            escalate_to_id: form.escalate_to_id || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules", orgId] });
      toast.success("Configuración guardada");
    },
    onError: (e: any) => toast.error(e.message || "Error al guardar"),
  });

  const getName = (id: string) => {
    const p = profiles.find((p: any) => p.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "";
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Routing de mensajes entrantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Cuando llega un mensaje nuevo de un remitente desconocido, asignar a:
        </p>

        <div className="space-y-3">
          <Label>Tipo de routing:</Label>
          <RadioGroup value={form.routing_type} onValueChange={(v) => setForm((f) => ({ ...f, routing_type: v }))}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="fixed" id="r-fixed" />
              <Label htmlFor="r-fixed" className="text-sm cursor-pointer">Siempre al mismo usuario (fixed)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="round_robin" id="r-rr" />
              <Label htmlFor="r-rr" className="text-sm cursor-pointer">Rotación entre agentes (round-robin)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="territory" id="r-territory" />
              <Label htmlFor="r-territory" className="text-sm cursor-pointer">Por país/jurisdicción (territory)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Usuario por defecto:</Label>
          <Select value={form.default_owner_id} onValueChange={(v) => setForm((f) => ({ ...f, default_owner_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
            <SelectContent>
              {profiles.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Si no responde en (horas):</Label>
            <Input
              type="number"
              min={1}
              max={72}
              value={form.escalate_after_hours}
              onChange={(e) => setForm((f) => ({ ...f, escalate_after_hours: parseInt(e.target.value) || 4 }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Escalar a:</Label>
            <Select value={form.escalate_to_id} onValueChange={(v) => setForm((f) => ({ ...f, escalate_to_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-1" />
            {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
