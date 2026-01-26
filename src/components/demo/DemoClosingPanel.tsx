// ============================================================
// IP-NEXUS - DEMO CLOSING PANEL
// Panel de cierre de demo con comparativa y ROI
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    IP-NEXUS vs La Competencia
                  </h1>
                  {prospectCompany && (
                    <p className="text-sm text-muted-foreground">
                      Propuesta para {prospectCompany}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar propuesta
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-7xl mx-auto space-y-8">
                
                <Tabs defaultValue="comparison" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                    <TabsTrigger value="comparison">Comparativa</TabsTrigger>
                    <TabsTrigger value="roi">ROI</TabsTrigger>
                    <TabsTrigger value="unique">Únicos</TabsTrigger>
                  </TabsList>

                  {/* TAB: Comparativa */}
                  <TabsContent value="comparison" className="mt-6 space-y-6">
                    {/* Score Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{scores.ipnexus}%</div>
                        <div className="text-sm font-medium text-primary">IP-NEXUS</div>
                      </div>
                      <div className="bg-muted rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-muted-foreground">{scores.sophia}%</div>
                        <div className="text-sm font-medium text-muted-foreground">Sophia</div>
                      </div>
                      <div className="bg-muted rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-muted-foreground">{scores.patricia}%</div>
                        <div className="text-sm font-medium text-muted-foreground">Patricia</div>
                      </div>
                      <div className="bg-muted rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-muted-foreground">{scores.others}%</div>
                        <div className="text-sm font-medium text-muted-foreground">Otros</div>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-5 gap-2 px-4 py-3 bg-muted/50 border-b border-border text-sm font-semibold">
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
                              className="w-full grid grid-cols-5 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="col-span-1 flex items-center gap-2 font-medium text-left">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="text-center">
                                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                                  {category.features.filter(f => f.ipnexus === true).length}/{category.features.length}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                  {category.features.filter(f => f.sophia === true).length}/{category.features.length}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                  {category.features.filter(f => f.patricia === true).length}/{category.features.length}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
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
                                      className="grid grid-cols-5 gap-2 px-4 py-2 bg-muted/20 border-t border-border/50"
                                    >
                                      <div className="col-span-1 text-sm text-muted-foreground pl-6">
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
                  <TabsContent value="roi" className="mt-6 space-y-6">
                    {/* Main Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                        <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                        <div className="text-4xl font-bold text-primary">
                          {ROI_DATA.timeSaved.weekly}h
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Ahorro semanal
                        </div>
                        <div className="text-xs text-primary/70 mt-2">
                          = {ROI_DATA.timeSaved.yearly}h/año
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6 text-center">
                        <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
                        <div className="text-4xl font-bold text-success">
                          €{ROI_DATA.moneySaved.monthly.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Ahorro mensual
                        </div>
                        <div className="text-xs text-success/70 mt-2">
                          = €{ROI_DATA.moneySaved.yearly.toLocaleString()}/año
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 rounded-xl p-6 text-center">
                        <TrendingUp className="h-8 w-8 text-accent-foreground mx-auto mb-2" />
                        <div className="text-4xl font-bold text-foreground">
                          {ROI_DATA.roiPositive}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ROI positivo
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Recuperación de inversión
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Desglose del ahorro mensual
                      </h3>
                      
                      <div className="space-y-3">
                        {ROI_DATA.moneySaved.breakdown.map((item) => (
                          <div
                            key={item.concept}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.icon}</span>
                              <span className="text-sm font-medium">{item.concept}</span>
                            </div>
                            <span className="text-lg font-bold text-success">
                              €{item.amount}
                            </span>
                          </div>
                        ))}
                        
                        <div className="border-t border-border pt-3 mt-4">
                          <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                            <span className="font-semibold">Total ahorro mensual</span>
                            <span className="text-2xl font-bold text-success">
                              €{ROI_DATA.moneySaved.monthly.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: Características Únicas */}
                  <TabsContent value="unique" className="mt-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {UNIQUE_FEATURES.map((feature) => (
                        <div
                          key={feature.title}
                          className={cn(
                            "bg-card border rounded-xl p-5 space-y-3",
                            "hover:shadow-lg transition-shadow"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{feature.icon}</span>
                            <div>
                              <h4 className="font-semibold text-foreground">{feature.title}</h4>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                          
                          <div className="bg-destructive/10 text-destructive text-xs px-3 py-1.5 rounded-lg">
                            <span className="font-medium">Competencia:</span> {feature.comparison}
                          </div>
                          
                          <div className="bg-success/10 text-success text-sm px-3 py-2 rounded-lg font-semibold text-center">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
