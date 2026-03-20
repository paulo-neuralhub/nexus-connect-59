// Hook for the ai_tasks table (routing configuration)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AITask {
  id: string;
  task_code: string;
  name: string;
  task_name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  module: string | null;
  primary_model: string | null;
  primary_provider: string | null;
  temperature: number | null;
  max_tokens: number | null;
  created_at: string;
  updated_at: string;
}

export function useAITasks() {
  return useQuery({
    queryKey: ['ai-tasks'],
    queryFn: async (): Promise<AITask[]> => {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('is_active', true)
        .order('module')
        .order('name');

      if (error) throw error;
      return (data as unknown) as AITask[];
    },
  });
}
