// ============================================================
// IP-NEXUS - Softphone Search Results Dropdown
// Shows matching contacts/accounts when typing in softphone
// ============================================================

import { User, Building2, Folder, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SoftphoneSearchResult } from "@/hooks/voip/useSoftphoneSearch";

interface SoftphoneSearchResultsProps {
  results: SoftphoneSearchResult[];
  isLoading: boolean;
  query: string;
  onSelect: (result: SoftphoneSearchResult) => void;
}

export function SoftphoneSearchResults({
  results,
  isLoading,
  query,
  onSelect,
}: SoftphoneSearchResultsProps) {
  if (query.length < 3) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border bg-card p-3 shadow-lg">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando...
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border bg-card p-3 shadow-lg">
        <p className="text-center text-sm text-muted-foreground">
          No se encontraron contactos
        </p>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-card shadow-lg">
      <ScrollArea className="max-h-[200px]">
        <div className="divide-y">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => onSelect(result)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              {/* Icon */}
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  result.type === "account"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent text-accent-foreground"
                )}
              >
                {result.type === "account" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {result.display_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {result.phone || result.whatsapp_phone || "Sin teléfono"}
                  {result.type === "contact" && result.account_name && (
                    <>
                      {" · "}
                      <span className="text-muted-foreground/80">
                        {result.account_name}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Matters badge */}
              {result.active_matters_count > 0 && (
                <Badge
                  variant="secondary"
                  className="flex-shrink-0 gap-1 text-xs"
                >
                  <Folder className="h-3 w-3" />
                  {result.active_matters_count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
