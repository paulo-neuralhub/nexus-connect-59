// ============================================================
// L111: Footer del Documento A4
// ============================================================

import React from 'react';
import { DocumentStyle, TenantDocumentSettings, StyleColors } from '@/types/documents';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

interface DocumentFooterProps {
  style: DocumentStyle;
  colors: StyleColors;
  tenantSettings?: TenantDocumentSettings;
  pageNumber?: number;
  totalPages?: number;
}

export function DocumentFooter({
  style,
  colors,
  tenantSettings,
  pageNumber,
  totalPages,
}: DocumentFooterProps) {
  const companyInfo = tenantSettings?.companyInfo;
  const customFooter = tenantSettings?.customTexts?.footerText;
  const confidentiality = tenantSettings?.customTexts?.confidentialityNotice ||
    'Este documento es confidencial y está destinado únicamente al destinatario indicado.';

  switch (style.layout.footerStyle) {
    case 'band':
      return (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            backgroundColor: colors.footerBg,
            color: colors.footerText,
            padding: '15px 25px',
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {companyInfo?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {companyInfo.phone}
                </span>
              )}
              {companyInfo?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {companyInfo.email}
                </span>
              )}
              {companyInfo?.website && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {companyInfo.website}
                </span>
              )}
            </div>
            {pageNumber && totalPages && (
              <span className="font-mono">Página {pageNumber} de {totalPages}</span>
            )}
          </div>
          {customFooter && (
            <p className="text-[10px] mt-2 text-center opacity-70">{customFooter}</p>
          )}
        </div>
      );

    case 'line':
      return (
        <div
          className="absolute bottom-0 left-0 right-0 border-t"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.footerBg || colors.background,
            padding: '12px 25px',
          }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: colors.footerText }}>
            <div className="flex items-center gap-3">
              {companyInfo?.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {companyInfo.address}
                  {companyInfo.city && `, ${companyInfo.city}`}
                </span>
              )}
              {companyInfo?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {companyInfo.phone}
                </span>
              )}
              {companyInfo?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {companyInfo.email}
                </span>
              )}
            </div>
            {pageNumber && totalPages && (
              <span className="font-mono">Página {pageNumber} de {totalPages}</span>
            )}
          </div>
          {confidentiality && (
            <p
              className="text-[9px] mt-2 text-center"
              style={{ color: colors.footerText, opacity: 0.6 }}
            >
              {confidentiality}
            </p>
          )}
        </div>
      );

    case 'minimal':
    default:
      return (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            backgroundColor: colors.footerBg || colors.background,
            padding: '12px 25px',
          }}
        >
          <div
            className="flex items-center justify-center flex-wrap gap-1 text-[10px]"
            style={{ color: colors.footerText || colors.secondary }}
          >
            {companyInfo?.name && <span>{companyInfo.name}</span>}
            {companyInfo?.phone && <span> • {companyInfo.phone}</span>}
            {companyInfo?.email && <span> • {companyInfo.email}</span>}
            {companyInfo?.website && <span> • {companyInfo.website}</span>}
          </div>
          {pageNumber && totalPages && (
            <p
              className="text-center text-[9px] mt-1 font-mono"
              style={{ color: colors.footerText || colors.secondary }}
            >
              Página {pageNumber} de {totalPages}
            </p>
          )}
          {confidentiality && (
            <p
              className="text-[8px] mt-2 text-center"
              style={{ color: colors.footerText || colors.secondary, opacity: 0.6 }}
            >
              {confidentiality}
            </p>
          )}
        </div>
      );
  }
}
