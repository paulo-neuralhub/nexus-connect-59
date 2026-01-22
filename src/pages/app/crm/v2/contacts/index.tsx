import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMContacts } from "@/hooks/crm/v2/contacts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users } from "lucide-react";

type ContactRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_lead?: boolean | null;
  lead_status?: string | null;
  lead_score?: number | null;
  account?: { id: string; name?: string | null } | null;
};

export default function CRMV2ContactsList() {
  usePageTitle("Contactos");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const { data, isLoading } = useCRMContacts({ search: search || undefined });
  const rows = useMemo(() => (data ?? []) as ContactRow[], [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
        <p className="text-muted-foreground">Personas vinculadas a cuentas</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contactos..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Sin contactos</p>
              <p className="text-sm text-muted-foreground">No se encontraron contactos con estos filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/app/crm/contacts/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.full_name || c.id}</TableCell>
                    <TableCell className="text-muted-foreground">{c.account?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.is_lead ? (c.lead_status ?? "lead") : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.lead_score ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
