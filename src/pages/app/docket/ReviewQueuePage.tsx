import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Edit, FileText, AlertTriangle } from "lucide-react";
import { useImportReview, ReviewItem, ReviewItemDetail } from "@/hooks/useImportReview";
import { Link } from "react-router-dom";

export default function ReviewQueuePage() {
  const { reviewQueue, isLoading, approveItem, rejectItem, bulkApprove, isApproving, isRejecting } = useImportReview();
  
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedReview, setSelectedReview] = React.useState<ReviewItem | null>(null);
  const [fieldSelections, setFieldSelections] = React.useState<Record<string, 'extracted' | 'current'>>({});
  const [reviewNotes, setReviewNotes] = React.useState('');

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === reviewQueue.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reviewQueue.map(r => r.id)));
    }
  };

  const handleOpenEdit = (item: ReviewItem) => {
    setSelectedReview(item);
    // Initialize field selections to extracted by default
    const selections: Record<string, 'extracted' | 'current'> = {};
    item.fields_to_review.forEach(field => {
      selections[field] = 'extracted';
    });
    setFieldSelections(selections);
    setReviewNotes('');
    setEditModalOpen(true);
  };

  const handleApproveWithEdits = async () => {
    if (!selectedReview) return;
    
    // Build final data based on selections
    const finalData: Record<string, unknown> = {};
    Object.entries(fieldSelections).forEach(([field, source]) => {
      if (source === 'extracted') {
        finalData[field] = selectedReview.extracted_data[field];
      } else {
        finalData[field] = selectedReview.current_data[field];
      }
    });
    
    await approveItem({ id: selectedReview.id, finalData });
    setEditModalOpen(false);
    setSelectedReview(null);
  };

  const handleBulkApprove = async () => {
    // Only approve items with confidence > 70%
    const highConfidenceItems = reviewQueue
      .filter(r => selectedItems.has(r.id) && r.confidence_score >= 70)
      .map(r => r.id);
    
    if (highConfidenceItems.length > 0) {
      await bulkApprove(highConfidenceItems);
      setSelectedItems(new Set());
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">{score}%</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">{score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">{score}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pendientes de Revisión</h1>
          <p className="text-muted-foreground mt-1">
            {reviewQueue.length} registros importados necesitan verificación manual
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/app/expedientes/importar">Importar más archivos</Link>
        </Button>
      </div>

      {reviewQueue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Todo revisado</h3>
            <p className="text-muted-foreground mt-1">
              No hay registros pendientes de revisión.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedItems.size === reviewQueue.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} seleccionados
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={selectedItems.size === 0 || isApproving}
                    onClick={handleBulkApprove}
                  >
                    {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Aprobar todos (confianza &gt; 70%)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={selectedItems.size === 0}
                    onClick={() => {
                      // Bulk reject
                      selectedItems.forEach(id => rejectItem({ id }));
                      setSelectedItems(new Set());
                    }}
                  >
                    Rechazar seleccionados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Items */}
          <div className="space-y-4">
            {reviewQueue.map((item) => (
              <Card key={item.id} className={item.confidence_score < 50 ? 'border-yellow-300' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {item.matter_ref || 'Sin referencia'}
                          {getConfidenceBadge(item.confidence_score)}
                        </CardTitle>
                        <CardDescription>
                          Oficina: {item.office_code} • Importado: {new Date(item.created_at).toLocaleString('es-ES')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.confidence_score < 50 && (
                        <Badge variant="outline" className="text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Baja calidad OCR
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Data Comparison */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Datos Extraídos</h4>
                      <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        {Object.entries(item.extracted_data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className={item.fields_to_review.includes(key) ? 'text-yellow-600 font-medium' : ''}>
                              {String(value)}
                              {item.fields_to_review.includes(key) && ' ⚠️'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Datos Actuales</h4>
                      <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        {Object.keys(item.extracted_data).map((key) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{String(item.current_data[key] ?? '-')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {item.fields_to_review.length > 0 && (
                    <p className="text-sm text-yellow-600 mb-4">
                      ⚠️ Campos marcados tienen diferencias significativas
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rejectItem({ id: item.id })}
                      disabled={isRejecting}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar y aprobar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => approveItem({ id: item.id })}
                      disabled={isApproving}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar como está
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit & Approve Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar y Aprobar</DialogTitle>
            <DialogDescription>
              Expediente: {selectedReview?.matter_ref} • Oficina: {selectedReview?.office_code}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              {/* Field Comparison */}
              <div>
                <h4 className="font-medium mb-3">Comparación</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Extraído</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Usar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReview.fields_to_review.map((field) => (
                      <TableRow key={field}>
                        <TableCell className="font-medium">{field}</TableCell>
                        <TableCell>{String(selectedReview.extracted_data[field] ?? '-')}</TableCell>
                        <TableCell>{String(selectedReview.current_data[field] ?? '-')}</TableCell>
                        <TableCell>
                          <RadioGroup
                            value={fieldSelections[field]}
                            onValueChange={(value) => setFieldSelections(prev => ({
                              ...prev,
                              [field]: value as 'extracted' | 'current'
                            }))}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="extracted" id={`${field}-extracted`} />
                              <Label htmlFor={`${field}-extracted`} className="text-xs">Extraído</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="current" id={`${field}-current`} />
                              <Label htmlFor={`${field}-current`} className="text-xs">Actual</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notas de revisión</Label>
                <Textarea
                  id="notes"
                  placeholder="Verificado con certificado oficial recibido por email..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApproveWithEdits} disabled={isApproving}>
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aprobar y actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
