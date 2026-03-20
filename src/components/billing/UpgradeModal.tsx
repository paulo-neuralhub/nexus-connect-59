import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  feature: string;
  requiredPlan: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ feature, requiredPlan, isOpen, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(217,91%,60%)]/10 flex items-center justify-center mb-3">
            <Rocket className="w-6 h-6 text-[hsl(217,91%,60%)]" />
          </div>
          <DialogTitle className="text-center">Desbloquea {feature}</DialogTitle>
          <DialogDescription className="text-center">
            Esta función está disponible desde el plan <strong>{requiredPlan}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={() => { onClose(); navigate('/app/settings/subscription'); }}
            className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)]"
          >
            Ver planes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
