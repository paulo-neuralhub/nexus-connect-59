/**
 * CRM Account Detail — Tab: Contactos
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Phone, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  role?: string | null;
  is_primary?: boolean;
}

interface Props {
  contacts: Contact[];
  onAddContact?: () => void;
}

export function AccountContactsTab({ contacts, onAddContact }: Props) {
  if (!contacts.length) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground mb-4">No hay contactos registrados</p>
        <Button size="sm" onClick={onAddContact}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar contacto
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{contacts.length} contacto(s)</h3>
        <Button size="sm" variant="outline" onClick={onAddContact}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contacts.map(c => (
          <Card key={c.id} className={cn("transition-shadow hover:shadow-md", c.is_primary && "ring-2 ring-primary")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    {c.full_name?.substring(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.full_name}</p>
                    {c.is_primary && <Badge variant="outline" className="text-[10px]">Principal</Badge>}
                  </div>
                  {c.job_title && <p className="text-xs text-muted-foreground">{c.job_title}</p>}
                  {c.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.email}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {c.phone && (
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Phone className="w-3 h-3 mr-1" /> Llamar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                  <Mail className="w-3 h-3 mr-1" /> Email
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
