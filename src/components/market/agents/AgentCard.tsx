import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  CheckCircle, 
  MessageSquare, 
  Clock, 
  Briefcase,
  BadgeCheck,
  Users
} from 'lucide-react';
import { 
  MarketUser, 
  BADGE_CONFIG, 
  AGENT_TYPE_LABELS,
  getReputationColor,
  formatResponseTime 
} from '@/types/market-users';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: MarketUser;
  compact?: boolean;
  onContact?: () => void;
  onRequestQuote?: () => void;
}

export function AgentCard({ 
  agent, 
  compact = false,
  onContact,
  onRequestQuote 
}: AgentCardProps) {
  const initials = agent.display_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const agentTypeLabel = agent.agent_type 
    ? AGENT_TYPE_LABELS[agent.agent_type]?.es 
    : null;

  return (
    <Card 
      className={cn(
        "hover:border-primary/50 hover:shadow-lg transition-all duration-200",
        compact ? "p-4" : "p-6"
      )}
    >
      <Link to={`/app/market/agents/${agent.id}`} className="block">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className={cn(compact ? "w-12 h-12" : "w-16 h-16")}>
              <AvatarImage src={agent.avatar_url || undefined} alt={agent.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {agent.is_verified_agent && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold text-foreground truncate",
                compact ? "text-base" : "text-lg"
              )}>
                {agent.display_name}
              </h3>
              {agent.is_verified_agent && (
                <BadgeCheck className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            
            {agent.company_name && (
              <p className="text-sm text-muted-foreground truncate">
                {agent.company_name}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {agent.city || agent.country}
              </span>
              {agentTypeLabel && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {agentTypeLabel}
                </span>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="text-right shrink-0">
            <div className={cn(
              "text-lg font-bold",
              getReputationColor(agent.reputation_score)
            )}>
              {agent.reputation_score}
            </div>
            <div className="flex items-center gap-1 text-sm justify-end">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{agent.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({agent.ratings_count})</span>
            </div>
          </div>
        </div>
        
        {!compact && (
          <>
            {/* Bio */}
            {agent.bio && (
              <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                {agent.bio}
              </p>
            )}
            
            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{agent.success_rate.toFixed(0)}% éxito</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatResponseTime(agent.response_time_avg)} respuesta</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{agent.total_transactions} transacciones</span>
              </div>
            </div>
            
            {/* Badges */}
            {agent.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {agent.badges.slice(0, 3).map((badge) => {
                  const config = BADGE_CONFIG[badge];
                  return (
                    <Badge 
                      key={badge} 
                      variant="secondary" 
                      className={cn("text-xs", config?.bgColor, config?.color)}
                    >
                      {config?.labelEs || badge}
                    </Badge>
                  );
                })}
                {agent.badges.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.badges.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Jurisdictions */}
            {agent.jurisdictions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {agent.jurisdictions.slice(0, 5).map((j) => (
                  <span 
                    key={j} 
                    className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                  >
                    {j}
                  </span>
                ))}
                {agent.jurisdictions.length > 5 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{agent.jurisdictions.length - 5}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </Link>
      
      {/* Actions */}
      {!compact && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              onContact?.();
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contactar
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              onRequestQuote?.();
            }}
          >
            Solicitar Presupuesto
          </Button>
        </div>
      )}
    </Card>
  );
}
