import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, ChevronRight, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccountId: string;
}

interface ParsedRow {
  [key: string]: string;
}

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect separator
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(sep).map(v => v.replace(/^["']|["']$/g, '').trim());
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
  return { headers, rows };
}

function parseOFX(text: string): { headers: string[]; rows: ParsedRow[] } {
  const transactions: ParsedRow[] = [];
  const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = txnRegex.exec(text)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}>([^<\\n]+)`, 'i').exec(block);
      return m ? m[1].trim() : '';
    };
    const dateRaw = get('DTPOSTED');
    const date = dateRaw.length >= 8 ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}` : dateRaw;
    transactions.push({ date, amount: get('TRNAMT'), description: get('NAME') || get('MEMO'), reference: get('FITID') });
  }
  return { headers: ['date', 'amount', 'description', 'reference'], rows: transactions };
}

function parseMT940(text: string): { headers: string[]; rows: ParsedRow[] } {
  const transactions: ParsedRow[] = [];
  const lines = text.split(/\r?\n/);
  let currentDate = '';
  let currentAmount = '';
  let currentDesc = '';

  for (const line of lines) {
    if (line.startsWith(':61:')) {
      if (currentDate && currentAmount) {
        transactions.push({ date: currentDate, amount: currentAmount, description: currentDesc.trim() });
      }
      const dateStr = line.substring(4, 10);
      currentDate = `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;
      const amtMatch = /[DC](\d+[,.]?\d*)/.exec(line.substring(10));
      if (amtMatch) {
        const sign = line.charAt(10 + (line.substring(10).indexOf(amtMatch[0][0]))) === 'D' ? '-' : '';
        currentAmount = sign + amtMatch[1].replace(',', '.');
      }
      currentDesc = '';
    } else if (line.startsWith(':86:')) {
      currentDesc = line.substring(4);
    } else if (currentDesc && !line.startsWith(':')) {
      currentDesc += ' ' + line;
    }
  }
  if (currentDate && currentAmount) {
    transactions.push({ date: currentDate, amount: currentAmount, description: currentDesc.trim() });
  }
  return { headers: ['date', 'amount', 'description'], rows: transactions };
}

function detectFormat(fileName: string, content: string): 'csv' | 'ofx' | 'mt940' {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'ofx' || ext === 'qfx' || content.includes('<OFX>')) return 'ofx';
  if (content.includes(':20:') && content.includes(':60F:')) return 'mt940';
  return 'csv';
}

export default function BankImportWizard({ open, onOpenChange, bankAccountId }: Props) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState({ date: '', amount: '', description: '' });
  const [result, setResult] = useState({ imported: 0, matched: 0 });
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({ date: '', amount: '', description: '' });
    setResult({ imported: 0, matched: 0 });
    setDetectedFormat('');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const format = detectFormat(file.name, text);
      setDetectedFormat(format);

      let parsed: { headers: string[]; rows: ParsedRow[] };
      if (format === 'ofx') parsed = parseOFX(text);
      else if (format === 'mt940') parsed = parseMT940(text);
      else parsed = parseCSV(text);

      if (!parsed.headers.length) {
        toast.error('No se pudieron detectar columnas en el archivo');
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);

      // Auto-map common column names
      const autoMap = { date: '', amount: '', description: '' };
      for (const h of parsed.headers) {
        const lower = h.toLowerCase();
        if (!autoMap.date && (lower.includes('fecha') || lower.includes('date') || lower === 'date')) autoMap.date = h;
        if (!autoMap.amount && (lower.includes('importe') || lower.includes('amount') || lower.includes('monto') || lower.includes('cantidad'))) autoMap.amount = h;
        if (!autoMap.description && (lower.includes('descripción') || lower.includes('description') || lower.includes('concepto') || lower.includes('detalle'))) autoMap.description = h;
      }
      // For pre-parsed formats, set directly
      if (format !== 'csv') {
        autoMap.date = 'date';
        autoMap.amount = 'amount';
        autoMap.description = 'description';
      }
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt', '.mt940', '.sta'],
      'application/x-ofx': ['.ofx', '.qfx'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!currentOrganization?.id) return;
    setStep('importing');

    const batchId = crypto.randomUUID();
    const transactions = rows.map(row => {
      const rawAmount = row[mapping.amount] || '0';
      const amount = parseFloat(rawAmount.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      const rawDate = row[mapping.date] || '';
      // Try to normalize date
      let txnDate = rawDate;
      if (/^\d{2}[/.-]\d{2}[/.-]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[/.-]/);
        txnDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      return {
        organization_id: currentOrganization.id,
        bank_account_id: bankAccountId,
        transaction_date: txnDate || new Date().toISOString().slice(0, 10),
        description: row[mapping.description] || 'Sin descripción',
        amount,
        currency: 'EUR',
        source: 'csv_import',
        import_batch_id: batchId,
        reconciliation_status: 'unmatched',
      };
    }).filter(t => t.amount !== 0);

    try {
      const { error } = await supabase
        .from('fin_bank_transactions')
        .insert(transactions);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      setResult({ imported: transactions.length, matched: 0 });
      setStep('done');
      toast.success(`${transactions.length} movimientos importados`);
    } catch (err: any) {
      toast.error('Error al importar: ' + err.message);
      setStep('preview');
    }
  };

  const previewRows = rows.slice(0, 5);
  const canProceed = mapping.date && mapping.amount;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar extracto bancario
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          {['Upload', 'Mapear', 'Preview', 'Importar'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <Badge variant={['upload', 'map', 'preview', 'done'][i] === step || (['importing', 'done'].includes(step) && i === 3) ? 'default' : 'outline'} className="text-xs">{i + 1}</Badge>
              <span>{s}</span>
              {i < 3 && <ChevronRight className="w-3 h-3" />}
            </div>
          ))}
        </div>

        {step === 'upload' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Arrastra tu extracto bancario aquí</p>
            <p className="text-sm text-muted-foreground mt-1">CSV, OFX/QFX, MT940 · Máx 10MB</p>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            {detectedFormat && (
              <Badge variant="outline" className="text-xs">
                Formato detectado: {detectedFormat.toUpperCase()}
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">
              Se encontraron <strong>{rows.length}</strong> filas y <strong>{headers.length}</strong> columnas.
              Mapea las columnas necesarias:
            </p>

            <div className="grid gap-3">
              {[
                { key: 'date' as const, label: '📅 Columna de fecha', required: true },
                { key: 'amount' as const, label: '💶 Columna de importe', required: true },
                { key: 'description' as const, label: '📝 Columna de descripción', required: false },
              ].map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm w-48 flex-shrink-0">
                    {label} {required && <span className="text-destructive">*</span>}
                  </span>
                  <Select value={mapping[key]} onValueChange={v => setMapping(p => ({ ...p, [key]: v }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar columna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button disabled={!canProceed} onClick={() => setStep('preview')}>
                Vista previa <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vista previa de los primeros {previewRows.length} de {rows.length} movimientos:
            </p>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => {
                    const amount = parseFloat((row[mapping.amount] || '0').replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{row[mapping.date]}</TableCell>
                        <TableCell className="text-xs truncate max-w-60">{row[mapping.description] || '—'}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {fmt(amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {rows.some(r => !r[mapping.date]) && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                Algunas filas no tienen fecha. Revisa el mapeo.
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('map')}>← Ajustar mapeo</Button>
              <Button onClick={handleImport}>
                Importar {rows.length} movimientos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando movimientos…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold">{result.imported} movimientos importados</p>
              {result.matched > 0 && (
                <p className="text-sm text-muted-foreground">{result.matched} matches sugeridos</p>
              )}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
