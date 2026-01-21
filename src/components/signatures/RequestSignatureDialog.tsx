/**
 * Dialog para solicitar firma de un documento
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Trash2, Send, GripVertical, Loader2, FileSignature } from 'lucide-react';
import { useCreateSignatureRequest } from '@/hooks/signatures/useSignatureRequests';
import { cn } from '@/lib/utils';

const signerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  role: z.enum(['signer', 'approver', 'cc']),
});

const formSchema = z.object({
  signers: z.array(signerSchema).min(1, 'Añade al menos un firmante'),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
  expiresInDays: z.number().min(1).max(90),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  document: {
    id: string;
    name: string;
    url: string;
  };
  matter?: {
    id: string;
    reference: string;
    contact?: {
      id: string;
      email: string;
      full_name: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RequestSignatureDialog({
  document,
  matter,
  open,
  onOpenChange,
  onSuccess
}: Props) {
  const { t } = useTranslation();
  const createRequest = useCreateSignatureRequest();

  // Build initial signers with proper types
  const initialSigners: Array<{ email: string; name: string; role: 'signer' | 'approver' | 'cc' }> = 
    matter?.contact?.email 
      ? [{ email: matter.contact.email, name: matter.contact.full_name, role: 'signer' }]
      : [{ email: '', name: '', role: 'signer' }];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      signers: initialSigners,
      emailSubject: `${t('signatures.document')}: ${document.name}`,
      emailMessage: '',
      expiresInDays: 7,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'signers',
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Filter out empty signers and cast to proper type
      const validSigners = data.signers
        .filter((s): s is { email: string; name: string; role: 'signer' | 'approver' | 'cc' } => 
          Boolean(s.email && s.name)
        );
      
      if (validSigners.length === 0) {
        return;
      }

      await createRequest.mutateAsync({
        documentId: document.id,
        documentName: document.name,
        documentUrl: document.url,
        matterId: matter?.id,
        contactId: matter?.contact?.id,
        signers: validSigners,
        emailSubject: data.emailSubject,
        emailMessage: data.emailMessage,
        expiresInDays: data.expiresInDays,
      });

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const roleLabels = {
    signer: t('signatures.role.signer'),
    approver: t('signatures.role.approver'),
    cc: t('signatures.role.cc'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('signatures.request_signature')}</DialogTitle>
              <DialogDescription>
                {t('signatures.document')}: <strong>{document.name}</strong>
                {matter && <> • {t('docket.reference')}: {matter.reference}</>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Firmantes */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">{t('signatures.signers')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ email: '', name: '', role: 'signer' })}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('signatures.add_signer')}
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center text-muted-foreground pt-2">
                    <GripVertical className="w-4 h-4" />
                    <span className="w-6 text-center text-sm font-medium">{index + 1}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        placeholder={t('common.email')}
                        type="email"
                        {...form.register(`signers.${index}.email`)}
                        className={cn(
                          form.formState.errors.signers?.[index]?.email && "border-destructive"
                        )}
                      />
                      {form.formState.errors.signers?.[index]?.email && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.signers[index]?.email?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder={t('signatures.signer_name')}
                        {...form.register(`signers.${index}.name`)}
                        className={cn(
                          form.formState.errors.signers?.[index]?.name && "border-destructive"
                        )}
                      />
                      {form.formState.errors.signers?.[index]?.name && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.signers[index]?.name?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Select
                    value={form.watch(`signers.${index}.role`)}
                    onValueChange={(value) => form.setValue(`signers.${index}.role`, value as 'signer' | 'approver' | 'cc')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signer">{roleLabels.signer}</SelectItem>
                      <SelectItem value="approver">{roleLabels.approver}</SelectItem>
                      <SelectItem value="cc">{roleLabels.cc}</SelectItem>
                    </SelectContent>
                  </Select>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-0.5"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('signatures.role.cc')} - {t('common.preview')}
            </p>
          </div>

          {/* Mensaje personalizado */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('signatures.email_subject')}</Label>
              <Input {...form.register('emailSubject')} />
            </div>

            <div className="space-y-2">
              <Label>{t('signatures.email_message')}</Label>
              <Textarea
                {...form.register('emailMessage')}
                placeholder={t('signatures.email_message')}
                rows={3}
              />
            </div>
          </div>

          {/* Expiración */}
          <div className="space-y-2">
            <Label>{t('signatures.expires_in')}</Label>
            <Select
              value={String(form.watch('expiresInDays'))}
              onValueChange={(v) => form.setValue('expiresInDays', Number(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 {t('signatures.days')}</SelectItem>
                <SelectItem value="7">7 {t('signatures.days')}</SelectItem>
                <SelectItem value="14">14 {t('signatures.days')}</SelectItem>
                <SelectItem value="30">30 {t('signatures.days')}</SelectItem>
                <SelectItem value="60">60 {t('signatures.days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('signatures.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('signatures.send_request')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
