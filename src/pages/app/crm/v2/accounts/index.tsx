import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMAccounts } from "@/hooks/crm/v2/accounts";
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
import { Building2, Search } from "lucide-react";

type AccountRow = {
  id: string;
  name?: string | null;
  legal_name?: string | null;
  status?: string | null;
  tier?: string | null;
  health_score?: number | null;
  churn_risk_level?: string | null;
};

export default function CRMV2AccountsList() {
  usePageTitle("Cuentas");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const { data, isLoading } = useCRMAccounts({
    search: search || undefined,
  });

  const rows = useMemo(() => (data ?? []) as AccountRow[], [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cuentas</h1>
        <p className="text-muted-foreground">Organizaciones/empresas en tu CRM</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cuentas..."
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
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Sin cuentas</p>
              <p className="text-sm text-muted-foreground">No se encontraron cuentas con estos filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Churn risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/app/crm/accounts/${a.id}`)}
                  >
                    <TableCell className="font-medium">{a.name || a.legal_name || a.id}</TableCell>
                    <TableCell className="text-muted-foreground">{a.status ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.tier ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.health_score ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.churn_risk_level ?? "—"}</TableCell>
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
