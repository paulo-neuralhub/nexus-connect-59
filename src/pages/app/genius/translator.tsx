// src/pages/app/genius/translator.tsx
import { LegalTranslator } from '@/components/features/genius/legal-translator';
import { Languages } from 'lucide-react';

export default function TranslatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
          <Languages className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Traductor Legal</h1>
          <p className="text-muted-foreground">Traduce documentos de propiedad intelectual con terminología especializada</p>
        </div>
      </div>
      
      <LegalTranslator />
    </div>
  );
}
