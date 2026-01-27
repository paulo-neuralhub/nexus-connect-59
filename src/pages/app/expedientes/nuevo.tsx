// ============================================================
// IP-NEXUS - New Matter Page (Matters V2)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { 
  useCreateMatterV2, 
  useGenerateMatterNumber, 
  useMatterTypes 
} from '@/hooks/use-matters-v2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/contexts/page-context';
import { cn } from '@/lib/utils';

// Jurisdictions
const JURISDICTIONS = [
  { code: 'ES', name: 'España (OEPM)' },
  { code: 'EU', name: 'Unión Europea (EUIPO)' },
  { code: 'WO', name: 'Internacional (WIPO)' },
  { code: 'US', name: 'Estados Unidos (USPTO)' },
  { code: 'GB', name: 'Reino Unido (UKIPO)' },
  { code: 'DE', name: 'Alemania (DPMA)' },
  { code: 'FR', name: 'Francia (INPI)' },
  { code: 'CN', name: 'China (CNIPA)' },
];

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  matter_type: z.string().min(1, 'Selecciona un tipo'),
  jurisdiction_code: z.string().min(1, 'Selecciona una jurisdicción'),
  mark_name: z.string().optional(),
  invention_title: z.string().optional(),
  nice_classes: z.string().optional(),
  goods_services: z.string().optional(),
  reference: z.string().optional(),
  internal_notes: z.string().optional(),
  is_urgent: z.boolean().default(false),
  is_confidential: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function NewMatterPage() {
  usePageTitle('Nuevo Expediente');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: matterTypes, isLoading: loadingTypes } = useMatterTypes();
  const createMatter = useCreateMatterV2();
  const generateNumber = useGenerateMatterNumber();
  
  const [previewNumber, setPreviewNumber] = useState<string | null>(null);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      matter_type: '',
      jurisdiction_code: '',
      mark_name: '',
      invention_title: '',
      nice_classes: '',
      goods_services: '',
      reference: '',
      internal_notes: '',
      is_urgent: false,
      is_confidential: false,
    },
  });
  
  const watchedType = form.watch('matter_type');
  const watchedJurisdiction = form.watch('jurisdiction_code');
  
  // Generate preview number when type and jurisdiction change
  useEffect(() => {
    if (watchedType && watchedJurisdiction) {
      setGeneratingNumber(true);
      generateNumber.mutateAsync({
        matterType: watchedType,
        jurisdictionCode: watchedJurisdiction,
      }).then(number => {
        setPreviewNumber(number);
      }).catch(() => {
        setPreviewNumber(null);
      }).finally(() => {
        setGeneratingNumber(false);
      });
    } else {
      setPreviewNumber(null);
    }
  }, [watchedType, watchedJurisdiction]);
  
  const onSubmit = async (data: FormData) => {
    try {
      // Generate final number
      const matterNumber = await generateNumber.mutateAsync({
        matterType: data.matter_type,
        jurisdictionCode: data.jurisdiction_code,
      });
      
      // Parse nice classes
      const niceClasses = data.nice_classes
        ? data.nice_classes.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n))
        : undefined;
      
      // Create matter
      const matter = await createMatter.mutateAsync({
        matter_number: matterNumber,
        title: data.title,
        matter_type: data.matter_type,
        reference: data.reference || null,
        mark_name: data.mark_name || null,
        invention_title: data.invention_title || null,
        nice_classes: niceClasses?.length ? niceClasses : null,
        goods_services: data.goods_services || null,
        internal_notes: data.internal_notes || null,
        is_urgent: data.is_urgent,
        is_confidential: data.is_confidential,
      });
      
      toast({ title: 'Expediente creado', description: matterNumber });
      navigate(`/app/expedientes/${matter.id}`);
    } catch (error) {
      toast({ 
        title: 'Error al crear expediente', 
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive' 
      });
    }
  };
  
  const selectedType = matterTypes?.find(t => t.code === watchedType);
  const isTrademarkType = watchedType === 'TM';
  const isPatentType = watchedType === 'PT' || watchedType === 'UM';
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/expedientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Expediente</h1>
          <p className="text-muted-foreground">Crea un nuevo expediente de propiedad intelectual</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Expediente</CardTitle>
              <CardDescription>Selecciona el tipo de derecho de propiedad intelectual</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTypes ? (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {matterTypes?.map(type => (
                    <button
                      key={type.code}
                      type="button"
                      onClick={() => form.setValue('matter_type', type.code)}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                        watchedType === type.code
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card"
                      )}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${type.color}20` }}
                      >
                        <span className="text-lg" style={{ color: type.color }}>
                          {type.code}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{type.name_es}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.formState.errors.matter_type && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.matter_type.message}
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Jurisdiction + Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Jurisdicción</CardTitle>
              <CardDescription>Selecciona la oficina principal de registro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="jurisdiction_code"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona jurisdicción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JURISDICTIONS.map(j => (
                          <SelectItem key={j.code} value={j.code}>{j.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Number Preview */}
              {(watchedType && watchedJurisdiction) && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Número de expediente</p>
                    {generatingNumber ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Generando...</span>
                      </div>
                    ) : previewNumber ? (
                      <p className="font-mono text-lg font-semibold">{previewNumber}</p>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del expediente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Registro de marca ACME en España" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia interna</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: CLI-2026-001" {...field} />
                    </FormControl>
                    <FormDescription>Referencia opcional para identificación interna</FormDescription>
                  </FormItem>
                )}
              />
              
              {/* Trademark specific fields */}
              {isTrademarkType && (
                <>
                  <FormField
                    control={form.control}
                    name="mark_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denominación de la marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: ACME" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nice_classes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clases Nice</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 9, 35, 42" {...field} />
                        </FormControl>
                        <FormDescription>Separadas por comas</FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="goods_services"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Productos/Servicios</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción de productos y servicios..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {/* Patent specific fields */}
              {isPatentType && (
                <FormField
                  control={form.control}
                  name="invention_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título de la invención</FormLabel>
                      <FormControl>
                        <Input placeholder="Título técnico de la invención" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="internal_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas internas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Opciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_urgent"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Urgente</FormLabel>
                      <FormDescription>Marcar como expediente prioritario</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_confidential"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Confidencial</FormLabel>
                      <FormDescription>Restringir acceso a usuarios autorizados</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/app/expedientes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMatter.isPending}>
              {createMatter.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Expediente
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
