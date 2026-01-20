// ============================================
// src/pages/app/legal-ops/client-360.tsx
// ============================================

import { useParams, useNavigate } from 'react-router-dom';
import { Client360Page } from '@/components/legal-ops/Client360Page';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClientDetail360Page() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  if (!clientId) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="mt-4 text-muted-foreground">ID de cliente no proporcionado</p>
      </div>
    );
  }

  return <Client360Page clientId={clientId} />;
}
