// ============================================================
// IP-NEXUS - Click to Call Button Component
// ============================================================

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ClickToCallButtonProps {
  phone: string;
  name?: string;
  company?: string;
  clientId?: string;
  contactId?: string;
  matterId?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onCallInitiated?: () => void;
  onCallCompleted?: () => void;
}

export function ClickToCallButton({
  phone,
  name,
  company,
  clientId,
  contactId,
  matterId,
  label = "Llamar",
  variant = "outline",
  size = "sm",
  className,
  onCallInitiated,
  onCallCompleted,
}: ClickToCallButtonProps) {
  const handleClick = () => {
    // Dispatch custom event to open call modal
    const event = new CustomEvent("ip-nexus:initiate-call", {
      detail: {
        phone,
        name,
        company,
        clientId,
        contactId,
        matterId,
        onCallInitiated,
        onCallCompleted,
      },
    });
    window.dispatchEvent(event);
  };

  if (!phone) return null;

  if (variant === "icon" || size === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn("h-8 w-8 text-success hover:bg-success/10", className)}
        title={`Llamar a ${name || phone}`}
      >
        <Phone className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "gap-1.5",
        variant === "default" && "bg-success hover:bg-success/90 text-success-foreground",
        variant === "outline" && "border-success/50 text-success hover:bg-success/10",
        className
      )}
    >
      <Phone className="h-4 w-4" />
      {label}
    </Button>
  );
}
