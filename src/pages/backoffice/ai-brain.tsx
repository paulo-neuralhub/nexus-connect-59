// src/pages/backoffice/ai-brain.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Hooks
import { 
  useAIProviders, 
  useAIModels, 
  useAITaskAssignments,
  useAICircuitBreaker,
  useAIRAGCollections,
  useAIAnalytics
} from '@/hooks/ai-brain';

// Components
import {
  AIBrainHeader,
  AIBrainStatsCards,
  ProvidersTab,
  TaskRouterTab,
  CircuitBreakerTab,
  RAGTab,
  AnalyticsTab,
  ProviderDialog,
  TaskDialog,
  RAGDialog
} from '@/components/backoffice/ai-brain';

// Types
import { AIProvider, AITaskAssignment, AIRAGCollection } from '@/types/ai-brain.types';

export default function AIBrainPage() {
  const [activeTab, setActiveTab] = useState('providers');
  
  // Dialog states
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [ragDialogOpen, setRagDialogOpen] = useState(false);
  
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingTask, setEditingTask] = useState<AITaskAssignment | null>(null);
  const [editingRag, setEditingRag] = useState<AIRAGCollection | null>(null);
  
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [refreshingRagId, setRefreshingRagId] = useState<string | null>(null);

  // Data hooks
  const { providers, isLoading: providersLoading, createProvider, updateProvider, deleteProvider, testProvider } = useAIProviders();
  const { models, isLoading: modelsLoading } = useAIModels();
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask, toggleTaskActive } = useAITaskAssignments();
  const { circuitStates, isLoading: circuitLoading, resetCircuit, forceOpenCircuit } = useAICircuitBreaker();
  const { ragCollections, isLoading: ragLoading, createRAG, updateRAG, deleteRAG, toggleRAGActive, refreshRAG } = useAIRAGCollections();
  const { summary, isLoading: analyticsLoading } = useAIAnalytics();

  // Provider handlers
  const openProviderDialog = (provider?: AIProvider) => {
    setEditingProvider(provider || null);
    setProviderDialogOpen(true);
  };

  const handleSaveProvider = async (data: any) => {
    try {
      if (editingProvider) {
        await updateProvider.mutateAsync({ id: editingProvider.id, ...data });
        toast.success('Provider actualizado');
      } else {
        await createProvider.mutateAsync(data);
        toast.success('Provider creado');
      }
      setProviderDialogOpen(false);
    } catch (error) {
      toast.error('Error al guardar provider');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await deleteProvider.mutateAsync(id);
      toast.success('Provider eliminado');
    } catch (error) {
      toast.error('Error al eliminar provider');
    }
  };

  const handleTestProvider = async (provider: AIProvider) => {
    setTestingProviderId(provider.id);
    try {
      await testProvider.mutateAsync(provider.id);
      toast.success(`Conexión exitosa con ${provider.name}`);
    } catch (error) {
      toast.error(`Error de conexión con ${provider.name}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  // Task handlers
  const openTaskDialog = (task?: AITaskAssignment) => {
    setEditingTask(task || null);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async (data: any) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...data });
        toast.success('Task actualizado');
      } else {
        await createTask.mutateAsync(data);
        toast.success('Task creado');
      }
      setTaskDialogOpen(false);
    } catch (error) {
      toast.error('Error al guardar task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task eliminado');
    } catch (error) {
      toast.error('Error al eliminar task');
    }
  };

  const handleToggleTaskActive = async (id: string, isActive: boolean) => {
    try {
      await toggleTaskActive.mutateAsync({ id, isActive });
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  // RAG handlers
  const openRagDialog = (rag?: AIRAGCollection) => {
    setEditingRag(rag || null);
    setRagDialogOpen(true);
  };

  const handleSaveRag = async (data: any) => {
    try {
      if (editingRag) {
        await updateRAG.mutateAsync({ id: editingRag.id, ...data });
        toast.success('RAG actualizado');
      } else {
        await createRAG.mutateAsync(data);
        toast.success('RAG creado');
      }
      setRagDialogOpen(false);
    } catch (error) {
      toast.error('Error al guardar RAG');
    }
  };

  const handleDeleteRag = async (id: string) => {
    try {
      await deleteRAG.mutateAsync(id);
      toast.success('RAG eliminado');
    } catch (error) {
      toast.error('Error al eliminar RAG');
    }
  };

  const handleToggleRagActive = async (id: string, isActive: boolean) => {
    try {
      await toggleRAGActive.mutateAsync({ id, isActive });
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleRefreshRag = async (id: string) => {
    setRefreshingRagId(id);
    try {
      await refreshRAG.mutateAsync(id);
      toast.success('RAG actualizado');
    } catch (error) {
      toast.error('Error al actualizar RAG');
    } finally {
      setRefreshingRagId(null);
    }
  };

  // Circuit breaker handlers
  const handleResetCircuit = async (providerId: string) => {
    try {
      await resetCircuit.mutateAsync(providerId);
      toast.success('Circuit reseteado');
    } catch (error) {
      toast.error('Error al resetear circuit');
    }
  };

  const handleForceOpenCircuit = async (providerId: string) => {
    try {
      await forceOpenCircuit.mutateAsync(providerId);
      toast.success('Circuit abierto');
    } catch (error) {
      toast.error('Error al abrir circuit');
    }
  };

  return (
    <div className="space-y-6">
      <AIBrainHeader 
        onAddProvider={() => openProviderDialog()}
        onRefresh={() => toast.info('Sincronizando...')}
      />

      <AIBrainStatsCards
        totalTokens={(summary?.totalTokensInput || 0) + (summary?.totalTokensOutput || 0)}
        inputTokens={summary?.totalTokensInput || 0}
        outputTokens={summary?.totalTokensOutput || 0}
        totalCost={summary?.totalCost || 0}
        avgLatency={summary?.avgLatency || 0}
        successRate={summary?.successRate || 0}
        isLoading={analyticsLoading}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="router">Task Router</TabsTrigger>
          <TabsTrigger value="circuit">Circuit Breaker</TabsTrigger>
          <TabsTrigger value="rag">RAG</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <ProvidersTab
            providers={providers}
            isLoading={providersLoading}
            onEdit={openProviderDialog}
            onDelete={handleDeleteProvider}
            onTest={handleTestProvider}
            testingProviderId={testingProviderId}
          />
        </TabsContent>

        <TabsContent value="router" className="space-y-4">
          <TaskRouterTab
            tasks={tasks}
            models={models}
            isLoading={tasksLoading || modelsLoading}
            onAdd={() => openTaskDialog()}
            onEdit={openTaskDialog}
            onDelete={handleDeleteTask}
            onToggleActive={handleToggleTaskActive}
          />
        </TabsContent>

        <TabsContent value="circuit" className="space-y-4">
          <CircuitBreakerTab
            circuitStates={circuitStates}
            providers={providers}
            isLoading={circuitLoading}
            onReset={handleResetCircuit}
            onForceOpen={handleForceOpenCircuit}
          />
        </TabsContent>

        <TabsContent value="rag" className="space-y-4">
          <RAGTab
            ragCollections={ragCollections}
            isLoading={ragLoading}
            onAdd={() => openRagDialog()}
            onEdit={openRagDialog}
            onDelete={handleDeleteRag}
            onToggleActive={handleToggleRagActive}
            onRefresh={handleRefreshRag}
            refreshingId={refreshingRagId}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            analytics={summary}
            isLoading={analyticsLoading}
          />
        </TabsContent>
      </Tabs>

      <ProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        provider={editingProvider}
        onSave={handleSaveProvider}
        isSaving={createProvider.isPending || updateProvider.isPending}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        models={models}
        onSave={handleSaveTask}
        isSaving={createTask.isPending || updateTask.isPending}
      />

      <RAGDialog
        open={ragDialogOpen}
        onOpenChange={setRagDialogOpen}
        rag={editingRag}
        onSave={handleSaveRag}
        isSaving={createRAG.isPending || updateRAG.isPending}
      />
    </div>
  );
}
