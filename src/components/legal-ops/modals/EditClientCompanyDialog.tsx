import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Nombre obligatorio"),
  tax_id: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditClientCompanyDialog({
  open,
  onOpenChange,
  clientId,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialValues: FormValues;
}) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) form.reset(initialValues);
  }, [open, initialValues, form]);

  const onSubmit = async (values: FormValues) => {
    if (!currentOrganization?.id) {
      toast.error("No hay organización activa");
      return;
    }

    const { error } = await supabase
      .from("crm_accounts")
      .update({
        name: values.name,
        tax_id: values.tax_id || null,
        email: values.email || null,
        phone: values.phone || null,
        address_line1: values.address_line1 || null,
        city: values.city || null,
        postal_code: values.postal_code || null,
        country: values.country || null,
        website: values.website || null,
      })
      .eq("id", clientId)
      .eq("organization_id", currentOrganization.id);

    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }

    toast.success("Cliente actualizado");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["client-detail", clientId] }),
      queryClient.invalidateQueries({ queryKey: ["crm-account", currentOrganization.id, clientId] }),
      queryClient.invalidateQueries({ queryKey: ["crm-accounts"] }),
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">CIF/NIF</Label>
              <Input id="tax_id" {...form.register("tax_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_line1">Dirección</Label>
              <Input id="address_line1" {...form.register("address_line1")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...form.register("city")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Código postal</Label>
              <Input id="postal_code" {...form.register("postal_code")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" {...form.register("country")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Web</Label>
              <Input id="website" {...form.register("website")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
