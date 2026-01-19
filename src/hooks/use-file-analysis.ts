import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FileAnalysisResult } from '@/types/universal-import';

export interface FileAnalysisRequest {
  fileId: string;
  fileType: string;
  options?: {
    detectSystem?: boolean;
    extractMetadata?: boolean;
    ocrEnabled?: boolean;
    sampleRows?: number;
  };
}

export interface ColumnAnalysis {
  name: string;
  originalName: string;
  index: number;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed' | 'empty';
  nullCount: number;
  uniqueCount: number;
  sampleValues: string[];
  suggestedField?: string;
  suggestedTransform?: string;
  issues: string[];
}

export interface DataIssue {
  severity: 'info' | 'warning' | 'error';
  type: 'missing_data' | 'invalid_format' | 'duplicate' | 'inconsistent' | 'truncated';
  field?: string;
  message: string;
  affectedRows?: number;
  suggestion?: string;
}

export interface FieldSuggestion {
  sourceField: string;
  targetEntity: string;
  targetField: string;
  confidence: number;
  reasoning: string;
  transformation?: {
    type: string;
    config: Record<string, any>;
  };
  alternatives: Array<{
    targetEntity: string;
    targetField: string;
    confidence: number;
  }>;
}

export interface ExtendedFileAnalysisResult extends FileAnalysisResult {
  detectedSystem?: {
    systemId: string;
    systemName: string;
    confidence: number;
    indicators: string[];
  };
  dataQuality?: {
    score: number;
    completeness: number;
    consistency: number;
    issues: DataIssue[];
  };
  suggestedMapping?: Record<string, FieldSuggestion>;
  estimatedImportTime?: number;
}

export function useFileAnalysis() {
  return useMutation({
    mutationFn: async (request: FileAnalysisRequest): Promise<ExtendedFileAnalysisResult> => {
      const { data, error } = await supabase.functions.invoke('analyze-import-file', {
        body: request
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Error al analizar archivo: ${error.message}`);
    }
  });
}

export function useOcrExtraction() {
  return useMutation({
    mutationFn: async (params: {
      fileId: string;
      pages?: number[];
      language?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ocr-extract', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Error en OCR: ${error.message}`);
    }
  });
}

export function useSystemDetection() {
  return useMutation({
    mutationFn: async (params: {
      columns?: string[];
      sampleData?: Record<string, any>[];
      fileStructure?: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('detect-source-system', {
        body: params
      });

      if (error) throw error;
      return data as {
        detectedSystem: string;
        confidence: number;
        indicators: string[];
        suggestedMappings: Record<string, string>;
      };
    },
    onError: (error: Error) => {
      toast.error(`Error en detección de sistema: ${error.message}`);
    }
  });
}
