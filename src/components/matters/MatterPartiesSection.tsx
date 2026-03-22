/**
 * MatterPartiesSection — Shows B2B2B parties when relevant
 * Only shown when intermediate_agent_id differs from client_id
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatterPartiesSectionProps {
  clientId?: string | null;
  clientName?: string | null;
  ownerAccountId?: string | null;
  ownerName?: string | null;
  intermediateAgentId?: string | null;
  intermediateAgentName?: string | null;
  billingAccountId?: string | null;
  billingAccountName?: string | null;
}

export function MatterPartiesSection({
  clientId, clientName, ownerAccountId, ownerName,
  intermediateAgentId, intermediateAgentName,
  billingAccountId, billingAccountName,
}: MatterPartiesSectionProps) {
  const navigate = useNavigate();

  // Don't show if there's no agent intermediary or all are the same
  const hasAgent = intermediateAgentId && intermediateAgentId !== clientId;
  const hasOwner = ownerAccountId && ownerAccountId !== clientId;
  if (!hasAgent && !hasOwner) return null;

  const parties = [
    { label: 'Titular', id: ownerAccountId || clientId, name: ownerName || clientName || 'Sin asignar', icon: Building2, color: 'text-blue-600' },
    ...(hasAgent ? [{ label: 'Agente intermediario', id: intermediateAgentId, name: intermediateAgentName || 'Sin nombre', icon: Users, color: 'text-emerald-600' }] : []),
    { label: 'Facturación', id: billingAccountId || intermediateAgentId || clientId, name: billingAccountName || intermediateAgentName || clientName || 'Sin asignar', icon: Receipt, color: 'text-purple-600' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Partes del expediente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {parties.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => p.id && navigate(`/app/crm/clients/${p.id}`)}
              >
                <Icon className={`w-4 h-4 ${p.color} shrink-0`} />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.label}</div>
                  <div className="text-sm font-medium truncate">{p.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
