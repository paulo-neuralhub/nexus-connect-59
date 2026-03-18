// ============================================================
// DESIGN TOKENS PARA SISTEMA DE TEMPLATES DE DOCUMENTOS
// 18 estilos × 15 tipos = 270 combinaciones
// ============================================================

export type HeaderLayout = 'standard' | 'split' | 'sidebar' | 'topbar' | 'wave' | 'flat' | 'grid';
export type StylePack = 'Classic' | 'Modern' | 'Executive';
export type DocumentCategory = 'financiero' | 'comunicacion' | 'informe' | 'legal' | 'ip';

export interface DesignColors {
  primary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  headerBg: string;
  headerText: string;
  text: string;
  textMuted: string;
  border: string;
  tableHeadBg: string;
  tableHeadText: string;
  totalBg: string;
  totalText: string;
}

export interface DesignTokens {
  id: string;
  code: string;
  name: string;
  pack: StylePack;
  description: string;
  headFont: string;
  bodyFont: string;
  headerLayout: HeaderLayout;
  colors: DesignColors;
  isDark: boolean;
  sortOrder: number;
}

export interface DocumentType {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  category: DocumentCategory;
  description: string;
  sortOrder: number;
}

// CSS variables prefix mapping for document renderer
export const CSS_VAR_MAP: Record<keyof DesignColors, string> = {
  primary: '--pr',
  accent: '--ac',
  background: '--bg',
  backgroundAlt: '--al',
  headerBg: '--hb',
  headerText: '--ht',
  text: '--tx',
  textMuted: '--mu',
  border: '--br',
  tableHeadBg: '--thb',
  tableHeadText: '--thc',
  totalBg: '--ttb',
  totalText: '--ttc',
};

// Converts design tokens to inline CSS variables string
export function tokensToCssVars(tokens: DesignTokens): string {
  const vars: string[] = [];
  
  // Colors
  Object.entries(tokens.colors).forEach(([key, value]) => {
    const cssVar = CSS_VAR_MAP[key as keyof DesignColors];
    if (cssVar) {
      vars.push(`${cssVar}:${value}`);
    }
  });
  
  // Fonts
  vars.push(`--fh:${tokens.headFont}`);
  vars.push(`--fb:${tokens.bodyFont}`);
  
  return vars.join(';');
}

// Category display names
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  financiero: 'Financiero',
  comunicacion: 'Comunicación',
  informe: 'Informe',
  legal: 'Legal',
  ip: 'Propiedad Intelectual',
};

// Category icons
export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  financiero: '💰',
  comunicacion: '✉️',
  informe: '📊',
  legal: '⚖️',
  ip: '🏆',
};

// Pack display colors
export const PACK_COLORS: Record<StylePack, { bg: string; text: string }> = {
  Classic: { bg: 'bg-slate-100', text: 'text-slate-700' },
  Modern: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Executive: { bg: 'bg-amber-100', text: 'text-amber-700' },
};
