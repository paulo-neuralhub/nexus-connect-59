import { useMatterPresence } from '@/hooks/use-realtime-collab';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  matterId: string;
  className?: string;
}

export function MatterPresence({ matterId, className }: Props) {
  const { data: viewers } = useMatterPresence(matterId);

  if (!viewers?.length) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">
        Viendo ahora:
      </span>
      <div className="flex -space-x-2">
        {viewers.slice(0, 5).map((viewer: any) => (
          <Tooltip key={viewer.user_id}>
            <TooltipTrigger>
              <div className="relative">
                <Avatar className="w-7 h-7 border-2 border-background ring-2 ring-green-500/30">
                  <AvatarImage src={viewer.users?.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {viewer.users?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{viewer.users?.full_name}</p>
              <p className="text-xs text-muted-foreground">En línea</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {viewers.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
            +{viewers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
