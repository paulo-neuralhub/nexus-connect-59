// ============================================================
// IP-NEXUS - RELATED MATTERS MANAGER
// Component for managing relationships between matters
// ============================================================

import React, { useState } from 'react';
import { Plus, Link2, Unlink, ExternalLink, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  useRelatedMatters, 
  useCreateRelationship, 
  useDeleteRelationship,
} from '@/hooks/useRelatedMatters';
import { 
  RELATIONSHIP_TYPES,
  type RelationshipType, 
  type MatterRelationship 
} from '@/types/relationships';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface RelatedMattersManagerProps {
  matterId: string;
  matterType?: 'trademark' | 'patent' | 'design' | 'utility_model';
  readOnly?: boolean;
  compact?: boolean;
}

export function RelatedMattersManager({ 
  matterId, 
  matterType = 'trademark',
  readOnly = false,
  compact = false
}: RelatedMattersManagerProps) {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RelationshipType | ''>('');
  const [targetMatterRef, setTargetMatterRef] = useState('');
  const [notes, setNotes] = useState('');

  const { data: relationships, isLoading, error } = useRelatedMatters(matterId);
  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();

  // Filter relationship types applicable to this matter type
  const applicableTypes = Object.entries(RELATIONSHIP_TYPES)
    .filter(([_, meta]) => 
      meta.applicableTo.includes('all') || 
      meta.applicableTo.includes(matterType as 'trademark' | 'patent' | 'design' | 'utility_model')
    )
    .map(([type, meta]) => ({ type: type as RelationshipType, ...meta }));

  // Group relationships by type
  const groupedRelationships = relationships?.reduce((acc, rel) => {
    const type = rel.relationship_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rel);
    return acc;
  }, {} as Record<string, MatterRelationship[]>) ?? {};

  const handleCreate = async () => {
    if (!selectedType || !targetMatterRef) return;

    try {
      await createRelationship.mutateAsync({
        sourceMatterId: matterId,
        targetMatterId: targetMatterRef,
        relationshipType: selectedType,
        isBidirectional: RELATIONSHIP_TYPES[selectedType]?.isBidirectionalDefault ?? false,
        notes: notes || undefined,
      });

      setIsAddDialogOpen(false);
      setSelectedType('');
      setTargetMatterRef('');
      setNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleNavigateToMatter = (matterId: string) => {
    navigate(`/docket/matters/${matterId}`);
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="py-4">
          <p className="text-sm text-destructive">Error al cargar relaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("flex flex-row items-center justify-between", compact && "px-0 pt-0")}>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Expedientes Relacionados
          {relationships && relationships.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {relationships.length}
            </Badge>
          )}
        </CardTitle>
        
        {!readOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Añadir Relación</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Relación</Label>
                  <Select 
                    value={selectedType} 
                    onValueChange={(v) => setSelectedType(v as RelationshipType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {applicableTypes.map(({ type, label, labelEs, icon, descriptionEs }) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <span>{icon}</span>
                            <span>{labelEs}</span>
                            <span className="text-xs text-muted-foreground">
                              ({descriptionEs})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expediente Relacionado</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={targetMatterRef}
                      onChange={(e) => setTargetMatterRef(e.target.value)}
                      placeholder="Buscar por referencia o ID..."
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Introduce la referencia o ID del expediente a relacionar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade notas sobre esta relación..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!selectedType || !targetMatterRef || createRelationship.isPending}
                >
                  {createRelationship.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Crear Relación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className={cn(compact && "px-0 pb-0")}>
        {!relationships || relationships.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin expedientes relacionados</p>
            {!readOnly && (
              <p className="text-xs mt-1">
                Añade relaciones para vincular expedientes
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRelationships).map(([type, rels]) => {
              const typeMeta = RELATIONSHIP_TYPES[type as RelationshipType];
              
              return (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <span>{typeMeta?.icon}</span>
                    <span>{typeMeta?.labelEs || typeMeta?.label || type}</span>
                    <Badge variant="outline" className="text-xs">
                      {rels.length}
                    </Badge>
                  </h4>
                  
                  <div className="space-y-1 pl-6">
                    {rels.map((rel) => {
                      // Determine which matter is the "other" one
                      const otherMatter = rel.source_matter_id === matterId 
                        ? rel.target_matter 
                        : rel.source_matter;
                      
                      if (!otherMatter) return null;
                      
                      return (
                        <div 
                          key={rel.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-sm shrink-0">
                              {otherMatter.reference}
                            </span>
                            <span className="text-sm text-muted-foreground truncate">
                              {otherMatter.title}
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {otherMatter.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleNavigateToMatter(otherMatter.id)}
                              title="Abrir expediente"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            
                            {!readOnly && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    title="Eliminar relación"
                                  >
                                    <Unlink className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar relación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esto eliminará la relación entre estos expedientes. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteRelationship.mutate(rel.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RelatedMattersManager;
