// ============================================================
// IP-NEXUS - DEMO CLOSING PANEL
// Panel de cierre de demo con comparativa y ROI - ARRASTRABLE
// ============================================================

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Draggable from "react-draggable";
import { 
  X, 
  Trophy, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Check,
  X as XIcon,
  AlertCircle,
  Download,
  Mail,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  COMPETITOR_COMPARISON, 
  COMPETITORS, 
  ROI_DATA, 
  UNIQUE_FEATURES,
  calculateFeatureScore,
  type FeatureStatus 
} from "./competitorData";

interface DemoClosingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prospectCompany?: string;
}

// Renderizar estado de feature
function FeatureStatusBadge({ status }: { status: FeatureStatus }) {
  if (status === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
          <Check className="h-4 w-4 text-success" />
        </div>
      </div>
    );
  }
  
  if (status === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center">
          <XIcon className="h-4 w-4 text-destructive" />
        </div>
      </div>
    );
  }
  
  if (status === 'partial') {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-warning/20 flex items-center justify-center">
          <AlertCircle className="h-4 w-4 text-warning" />
        </div>
      </div>
    );
  }
  
  // Es un precio o texto
  return (
    <div className="flex items-center justify-center">
      <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">
        {status}
      </span>
    </div>
  );
}

export function DemoClosingPanel({ isOpen, onClose, prospectCompany }: DemoClosingPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isMaximized, setIsMaximized] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const scores = calculateFeatureScore(COMPETITOR_COMPARISON);
  
  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop oscuro cuando está maximizado */}
          {isMaximized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMaximized(false)}
            />
          )}
          
          <Draggable
            nodeRef={nodeRef}
            handle=".drag-handle"
            bounds="parent"
            disabled={isMaximized}
            defaultPosition={{ x: 50, y: 50 }}
          >
            <motion.div
              ref={nodeRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25 }}
              className={cn(
                "fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden",
                isMaximized 
                  ? "inset-4" 
                  : "w-[800px] max-w-[90vw] h-[600px] max-h-[80vh]"
              )}
              style={isMaximized ? {} : { top: 50, right: 50 }}
            >
              {/* Header - Arrastrable */}
              <div className="drag-handle flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 cursor-move select-none">
                <div className="flex items-center gap-3">
                  <GripHorizontal className="h-5 w-5 text-muted-foreground" />
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-foreground">
                      IP-NEXUS vs Competencia
                    </h1>
                    {prospectCompany && (
                      <p className="text-xs text-muted-foreground">
                        {prospectCompany}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Descargar PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar propuesta">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => setIsMaximized(!isMaximized)}
                    title={isMaximized ? "Restaurar" : "Maximizar"}
                  >
                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  
                  <Tabs defaultValue="comparison" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-sm mx-auto">
                      <TabsTrigger value="comparison" className="text-xs">Comparativa</TabsTrigger>
                      <TabsTrigger value="roi" className="text-xs">ROI</TabsTrigger>
                      <TabsTrigger value="unique" className="text-xs">Únicos</TabsTrigger>
                    </TabsList>

                    {/* TAB: Comparativa */}
                    <TabsContent value="comparison" className="mt-4 space-y-4">
                      {/* Score Cards */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-primary">{scores.ipnexus}%</div>
                          <div className="text-xs font-medium text-primary">IP-NEXUS</div>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-muted-foreground">{scores.sophia}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Sophia</div>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-muted-foreground">{scores.patricia}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Patricia</div>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-muted-foreground">{scores.others}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Otros</div>
                        </div>
                      </div>

                      {/* Comparison Table */}
                      <div className="bg-card border border-border rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-muted/50 border-b border-border text-xs font-semibold">
                          <div className="col-span-1">Funcionalidad</div>
                          <div className="text-center text-primary">IP-NEXUS</div>
                          <div className="text-center text-muted-foreground">Sophia</div>
                          <div className="text-center text-muted-foreground">Patricia</div>
                          <div className="text-center text-muted-foreground">Otros</div>
                        </div>
                        
                        {/* Categories */}
                        {COMPETITOR_COMPARISON.map((category) => {
                          const isExpanded = expandedCategories.has(category.name);
                          return (
                            <div key={category.name} className="border-b border-border last:border-0">
                              {/* Category Header */}
                              <button
                                type="button"
                                onClick={() => toggleCategory(category.name)}
                                className="w-full grid grid-cols-5 gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
                              >
                                <div className="col-span-1 flex items-center gap-2 font-medium text-left text-sm">
                                  <span>{category.icon}</span>
                                  <span className="truncate">{category.name}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-center">
                                  <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                                    {category.features.filter(f => f.ipnexus === true).length}/{category.features.length}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                    {category.features.filter(f => f.sophia === true).length}/{category.features.length}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                    {category.features.filter(f => f.patricia === true).length}/{category.features.length}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                    {category.features.filter(f => f.others === true).length}/{category.features.length}
                                  </span>
                                </div>
                              </button>
                              
                              {/* Features */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    {category.features.map((feature) => (
                                      <div
                                        key={feature.name}
                                        className="grid grid-cols-5 gap-2 px-3 py-1.5 bg-muted/20 border-t border-border/50"
                                      >
                                        <div className="col-span-1 text-xs text-muted-foreground pl-5 truncate">
                                          {feature.name}
                                        </div>
                                        <FeatureStatusBadge status={feature.ipnexus} />
                                        <FeatureStatusBadge status={feature.sophia} />
                                        <FeatureStatusBadge status={feature.patricia} />
                                        <FeatureStatusBadge status={feature.others} />
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>

                    {/* TAB: ROI */}
                    <TabsContent value="roi" className="mt-4 space-y-4">
                      {/* Main Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                          <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                          <div className="text-3xl font-bold text-primary">
                            {ROI_DATA.timeSaved.weekly}h
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Ahorro semanal
                          </div>
                          <div className="text-xs text-primary/70 mt-1">
                            = {ROI_DATA.timeSaved.yearly}h/año
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-lg p-4 text-center">
                          <DollarSign className="h-6 w-6 text-success mx-auto mb-1" />
                          <div className="text-3xl font-bold text-success">
                            €{ROI_DATA.moneySaved.monthly.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Ahorro mensual
                          </div>
                          <div className="text-xs text-success/70 mt-1">
                            = €{ROI_DATA.moneySaved.yearly.toLocaleString()}/año
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-4 text-center">
                          <TrendingUp className="h-6 w-6 text-accent-foreground mx-auto mb-1" />
                          <div className="text-3xl font-bold text-foreground">
                            {ROI_DATA.roiPositive}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ROI positivo
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Recuperación
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Desglose del ahorro mensual
                        </h3>
                        
                        <div className="space-y-2">
                          {ROI_DATA.moneySaved.breakdown.map((item) => (
                            <div
                              key={item.concept}
                              className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs font-medium">{item.concept}</span>
                              </div>
                              <span className="text-sm font-bold text-success">
                                €{item.amount}
                              </span>
                            </div>
                          ))}
                          
                          <div className="border-t border-border pt-2 mt-3">
                            <div className="flex items-center justify-between p-2 bg-success/10 rounded-lg">
                              <span className="text-sm font-semibold">Total mensual</span>
                              <span className="text-xl font-bold text-success">
                                €{ROI_DATA.moneySaved.monthly.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TAB: Características Únicas */}
                    <TabsContent value="unique" className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {UNIQUE_FEATURES.map((feature) => (
                          <div
                            key={feature.title}
                            className={cn(
                              "bg-card border rounded-lg p-3 space-y-2",
                              "hover:shadow-md transition-shadow"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{feature.icon}</span>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-foreground text-sm truncate">{feature.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                              </div>
                            </div>
                            
                            <div className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded">
                              <span className="font-medium">Comp:</span> {feature.comparison}
                            </div>
                            
                            <div className="bg-success/10 text-success text-xs px-2 py-1 rounded font-semibold text-center">
                              {feature.savings}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </motion.div>
          </Draggable>
        </>
      )}
    </AnimatePresence>
  );
}
