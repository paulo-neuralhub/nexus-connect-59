// src/components/market/rfq/RfqReviewModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubmitRfqReview } from '@/hooks/market/useRfqWorkflow';

interface RfqReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  agentId: string;
  agentName: string;
}

function StarRating({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  label: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                (hover || value) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 && `${value}/5`}
        </span>
      </div>
    </div>
  );
}

export function RfqReviewModal({
  open,
  onOpenChange,
  requestId,
  agentId,
  agentName,
}: RfqReviewModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const submitReview = useSubmitRfqReview();

  const handleSubmit = async () => {
    if (overallRating === 0) return;

    await submitReview.mutateAsync({
      requestId,
      agentId,
      overallRating,
      communicationRating: communicationRating || undefined,
      qualityRating: qualityRating || undefined,
      timelinessRating: timelinessRating || undefined,
      title: title || undefined,
      comment: comment || undefined,
      isPublic,
    });

    onOpenChange(false);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deja tu valoración</DialogTitle>
          <DialogDescription>
            ¿Cómo fue tu experiencia trabajando con {agentName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating - Required */}
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Valoración general *"
          />

          {/* Detailed Ratings - Optional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Comunicación"
            />
            <StarRating
              value={qualityRating}
              onChange={setQualityRating}
              label="Calidad"
            />
            <StarRating
              value={timelinessRating}
              onChange={setTimelinessRating}
              label="Puntualidad"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Título (opcional)</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumen de tu experiencia"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comentario</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 20 caracteres para publicar
            </p>
          </div>

          {/* Public checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <Label htmlFor="is-public" className="text-sm font-normal">
              Mostrar review públicamente
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Omitir
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={overallRating === 0 || submitReview.isPending}
          >
            {submitReview.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enviar Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
