import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateActivity } from '@/hooks/use-crm';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, FileText, CheckSquare, Calendar } from 'lucide-react';
import type { ActivityType } from '@/types/crm';

const activitySchema = z.object({
  type: z.string(),
  subject: z.string().optional(),
  content: z.string().optional(),
  // Email fields
  email_to: z.string().optional(),
  // Call fields
  call_duration: z.number().optional(),
  call_outcome: z.string().optional(),
  // Meeting fields
  meeting_location: z.string().optional(),
  meeting_start: z.string().optional(),
  meeting_end: z.string().optional(),
  // Task fields
  due_date: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  contactId?: string;
  dealId?: string;
  defaultType?: ActivityType;
}

export function AddActivityModal({ open, onClose, contactId, dealId, defaultType = 'note' }: Props) {
  const [activeTab, setActiveTab] = useState<string>(defaultType);
  const createActivity = useCreateActivity();
  
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: defaultType,
      subject: '',
      content: '',
    },
  });

  const onSubmit = async (values: ActivityFormValues) => {
    try {
      const activityData: Record<string, unknown> = {
        type: activeTab,
        subject: values.subject,
        content: values.content,
        contact_id: contactId,
        deal_id: dealId,
      };

      // Add type-specific fields
      if (activeTab === 'email' && values.email_to) {
        activityData.email_to = values.email_to.split(',').map(e => e.trim());
        activityData.direction = 'outbound';
      }
      
      if (activeTab === 'call') {
        activityData.call_duration = values.call_duration ? values.call_duration * 60 : null;
        activityData.call_outcome = values.call_outcome;
        activityData.direction = 'outbound';
      }
      
      if (activeTab === 'meeting') {
        activityData.meeting_location = values.meeting_location;
        activityData.meeting_start = values.meeting_start;
        activityData.meeting_end = values.meeting_end;
      }
      
      if (activeTab === 'task') {
        activityData.due_date = values.due_date;
        activityData.is_completed = false;
      }

      await createActivity.mutateAsync(activityData as Parameters<typeof createActivity.mutateAsync>[0]);
      toast.success('Actividad registrada');
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Error al registrar la actividad');
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue('type', value);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="note" className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Nota</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="call" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Llamada</span>
                </TabsTrigger>
                <TabsTrigger value="meeting" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Reunión</span>
                </TabsTrigger>
                <TabsTrigger value="task" className="flex items-center gap-1">
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Tarea</span>
                </TabsTrigger>
              </TabsList>

              {/* Nota */}
              <TabsContent value="note" className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Escribe tu nota..." rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Email */}
              <TabsContent value="email" className="space-y-4">
                <FormField
                  control={form.control}
                  name="email_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatario(s)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="email@ejemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Asunto del email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Contenido del email..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Llamada */}
              <TabsContent value="call" className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumen</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Resumen de la llamada" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="call_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="5" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="call_outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resultado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="connected">Conectado</SelectItem>
                            <SelectItem value="voicemail">Buzón de voz</SelectItem>
                            <SelectItem value="no_answer">Sin respuesta</SelectItem>
                            <SelectItem value="busy">Ocupado</SelectItem>
                            <SelectItem value="wrong_number">Número incorrecto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notas de la llamada..." rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Reunión */}
              <TabsContent value="meeting" className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Título de la reunión" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="meeting_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inicio</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meeting_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fin</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="meeting_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Zoom, Oficina, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notas de la reunión..." rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tarea */}
              <TabsContent value="task" className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarea</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descripción de la tarea" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha límite</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalles</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Detalles adicionales..." rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
