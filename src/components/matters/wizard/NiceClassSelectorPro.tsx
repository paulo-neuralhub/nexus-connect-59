// ============================================================
// IP-NEXUS - NICE CLASS SELECTOR PRO
// L129: Enhanced Nice class selector with tabs, icons, search
// ============================================================

import { useState, useMemo } from 'react';
import { Check, Search, X, Package, Briefcase, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Nice Classification data with icons
const NICE_CLASSES = [
  // Products (1-34)
  { number: 1, title: 'Productos químicos', icon: '🧪', description: 'Productos químicos para la industria, ciencia, fotografía, agricultura', category: 'products' },
  { number: 2, title: 'Pinturas y barnices', icon: '🎨', description: 'Pinturas, barnices, lacas; preservativos contra oxidación', category: 'products' },
  { number: 3, title: 'Cosméticos', icon: '💄', description: 'Cosméticos, preparaciones de tocador, dentífricos', category: 'products' },
  { number: 4, title: 'Aceites industriales', icon: '🛢️', description: 'Aceites y grasas industriales, lubricantes, combustibles', category: 'products' },
  { number: 5, title: 'Productos farmacéuticos', icon: '💊', description: 'Productos farmacéuticos, veterinarios, dietéticos', category: 'products' },
  { number: 6, title: 'Metales', icon: '🔩', description: 'Metales comunes y sus aleaciones, materiales de construcción metálicos', category: 'products' },
  { number: 7, title: 'Máquinas', icon: '⚙️', description: 'Máquinas y máquinas herramientas, motores', category: 'products' },
  { number: 8, title: 'Herramientas manuales', icon: '🔧', description: 'Herramientas e instrumentos de mano, cuchillería', category: 'products' },
  { number: 9, title: 'Electrónica', icon: '📱', description: 'Aparatos científicos, electrónicos, informáticos, software', category: 'products' },
  { number: 10, title: 'Aparatos médicos', icon: '🩺', description: 'Aparatos quirúrgicos, médicos, dentales, ortopédicos', category: 'products' },
  { number: 11, title: 'Iluminación', icon: '💡', description: 'Aparatos de alumbrado, calefacción, refrigeración', category: 'products' },
  { number: 12, title: 'Vehículos', icon: '🚗', description: 'Vehículos y aparatos de locomoción terrestre, aérea, marítima', category: 'products' },
  { number: 13, title: 'Armas', icon: '🔫', description: 'Armas de fuego, municiones, explosivos, fuegos artificiales', category: 'products' },
  { number: 14, title: 'Joyería', icon: '💎', description: 'Metales preciosos, joyería, piedras preciosas, relojería', category: 'products' },
  { number: 15, title: 'Instrumentos musicales', icon: '🎸', description: 'Instrumentos musicales, estuches, accesorios', category: 'products' },
  { number: 16, title: 'Papel y cartón', icon: '📄', description: 'Papel, cartón, artículos de oficina, material de embalaje', category: 'products' },
  { number: 17, title: 'Caucho y plástico', icon: '🧴', description: 'Caucho, plásticos semielaborados, materiales de calafateo', category: 'products' },
  { number: 18, title: 'Cuero y equipaje', icon: '👜', description: 'Cuero, bolsos, maletas, paraguas, artículos de guarnicionería', category: 'products' },
  { number: 19, title: 'Materiales construcción', icon: '🧱', description: 'Materiales de construcción no metálicos, tuberías', category: 'products' },
  { number: 20, title: 'Muebles', icon: '🪑', description: 'Muebles, espejos, marcos, contenedores no metálicos', category: 'products' },
  { number: 21, title: 'Utensilios cocina', icon: '🍳', description: 'Utensilios de cocina, cristalería, porcelana, cerámica', category: 'products' },
  { number: 22, title: 'Cuerdas y redes', icon: '🪢', description: 'Cuerdas, redes, tiendas de campaña, toldos, velas', category: 'products' },
  { number: 23, title: 'Hilos textiles', icon: '🧵', description: 'Hilos para uso textil', category: 'products' },
  { number: 24, title: 'Tejidos', icon: '🧶', description: 'Tejidos, ropa de cama, mantelería', category: 'products' },
  { number: 25, title: 'Ropa y calzado', icon: '👕', description: 'Prendas de vestir, calzado, sombrerería', category: 'products' },
  { number: 26, title: 'Mercería', icon: '🪡', description: 'Encajes, bordados, cintas, botones, flores artificiales', category: 'products' },
  { number: 27, title: 'Alfombras', icon: '🧺', description: 'Alfombras, felpudos, revestimientos de suelos', category: 'products' },
  { number: 28, title: 'Juegos y juguetes', icon: '🎮', description: 'Juegos, juguetes, artículos de deporte, decoraciones navideñas', category: 'products' },
  { number: 29, title: 'Alimentos (carne)', icon: '🥩', description: 'Carne, pescado, frutas y verduras en conserva, lácteos', category: 'products' },
  { number: 30, title: 'Alimentos (cereales)', icon: '🍞', description: 'Café, té, cacao, arroz, harinas, pan, pastelería, condimentos', category: 'products' },
  { number: 31, title: 'Productos agrícolas', icon: '🌾', description: 'Productos agrícolas, granos, frutas y verduras frescas', category: 'products' },
  { number: 32, title: 'Bebidas', icon: '🥤', description: 'Cervezas, aguas minerales, refrescos, bebidas sin alcohol', category: 'products' },
  { number: 33, title: 'Bebidas alcohólicas', icon: '🍷', description: 'Bebidas alcohólicas (excepto cervezas), vinos, licores', category: 'products' },
  { number: 34, title: 'Tabaco', icon: '🚬', description: 'Tabaco, artículos para fumadores, cerillas', category: 'products' },
  // Services (35-45)
  { number: 35, title: 'Publicidad y negocios', icon: '📢', description: 'Publicidad, gestión de negocios, administración, retail', category: 'services' },
  { number: 36, title: 'Seguros y finanzas', icon: '🏦', description: 'Seguros, operaciones financieras, inmobiliarias, monetarias', category: 'services' },
  { number: 37, title: 'Construcción', icon: '🏗️', description: 'Servicios de construcción, reparación, instalación', category: 'services' },
  { number: 38, title: 'Telecomunicaciones', icon: '📡', description: 'Telecomunicaciones, transmisión de datos', category: 'services' },
  { number: 39, title: 'Transporte', icon: '🚚', description: 'Transporte, embalaje, almacenamiento, viajes', category: 'services' },
  { number: 40, title: 'Tratamiento materiales', icon: '🏭', description: 'Tratamiento de materiales, reciclaje, producción de energía', category: 'services' },
  { number: 41, title: 'Educación y ocio', icon: '🎓', description: 'Educación, formación, entretenimiento, deportes', category: 'services' },
  { number: 42, title: 'Servicios científicos', icon: '🔬', description: 'Servicios científicos, tecnológicos, I+D, software', category: 'services' },
  { number: 43, title: 'Restauración', icon: '🍽️', description: 'Servicios de restauración, alojamiento temporal', category: 'services' },
  { number: 44, title: 'Servicios médicos', icon: '🏥', description: 'Servicios médicos, veterinarios, belleza, agricultura', category: 'services' },
  { number: 45, title: 'Servicios jurídicos', icon: '⚖️', description: 'Servicios jurídicos, seguridad, licencias de PI', category: 'services' },
];

interface NiceClassSelectorProProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

export function NiceClassSelectorPro({ value, onChange, disabled }: NiceClassSelectorProProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'products' | 'services'>('all');
  const [tempSelected, setTempSelected] = useState<number[]>(value);

  // Open modal and sync state
  const handleOpen = () => {
    setTempSelected(value);
    setSearch('');
    setSelectedTab('all');
    setOpen(true);
  };

  // Filter classes
  const filteredClasses = useMemo(() => {
    let classes = NICE_CLASSES;
    
    // Filter by tab
    if (selectedTab !== 'all') {
      classes = classes.filter(c => c.category === selectedTab);
    }
    
    // Filter by search
    if (search.trim()) {
      const s = search.toLowerCase();
      classes = classes.filter(c =>
        c.number.toString().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s)
      );
    }
    
    return classes;
  }, [search, selectedTab]);

  // Toggle class selection
  const toggleClass = (num: number) => {
    setTempSelected(prev =>
      prev.includes(num)
        ? prev.filter(n => n !== num)
        : [...prev, num].sort((a, b) => a - b)
    );
  };

  // Confirm selection
  const handleConfirm = () => {
    onChange(tempSelected);
    setOpen(false);
  };

  // Count by category
  const productCount = tempSelected.filter(n => n <= 34).length;
  const serviceCount = tempSelected.filter(n => n > 34).length;

  return (
    <>
      {/* Trigger - Show selected classes */}
      <div
        onClick={disabled ? undefined : handleOpen}
        className={cn(
          'min-h-[52px] p-3 rounded-xl border-2 border-dashed transition-all',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        {value.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Package className="h-5 w-5" />
            <div>
              <p className="font-medium">Seleccionar clases Nice</p>
              <p className="text-xs">Haz clic para elegir productos y servicios</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{value.length} clase(s) seleccionada(s)</span>
              {productCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {productCount} productos
                </Badge>
              )}
              {serviceCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {serviceCount} servicios
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {value.slice(0, 8).map(num => {
                const clase = NICE_CLASSES.find(c => c.number === num);
                return (
                  <Badge key={num} variant="outline" className="gap-1 text-xs">
                    {clase?.icon} {num}
                    {!disabled && (
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(value.filter(n => n !== num));
                        }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                );
              })}
              {value.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{value.length - 8} más
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Clasificación Nice
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Selecciona las clases de productos y/o servicios para tu marca
            </p>
          </DialogHeader>

          {/* Controls */}
          <div className="px-6 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  Todas (45)
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1">
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Productos (1-34)
                </TabsTrigger>
                <TabsTrigger value="services" className="flex-1">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  Servicios (35-45)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Selected (sticky) */}
            <AnimatePresence>
              {tempSelected.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg"
                >
                  {tempSelected.map(num => {
                    const clase = NICE_CLASSES.find(c => c.number === num);
                    return (
                      <Badge
                        key={num}
                        variant="default"
                        className="gap-1 cursor-pointer"
                        onClick={() => toggleClass(num)}
                      >
                        {clase?.icon} {num}. {clase?.title}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Class List */}
          <ScrollArea className="flex-1 px-6 mt-3">
            <div className="space-y-2 pb-4">
              {filteredClasses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron clases con "{search}"
                </div>
              ) : (
                filteredClasses.map((clase) => {
                  const isSelected = tempSelected.includes(clase.number);
                  const isProduct = clase.category === 'products';
                  
                  return (
                    <motion.div
                      key={clase.number}
                      onClick={() => toggleClass(clase.number)}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                        isSelected
                          ? isProduct
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/30"
                      )}
                    >
                      {/* Checkbox visual */}
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                        isSelected
                          ? isProduct
                            ? "border-blue-500 bg-blue-500"
                            : "border-green-500 bg-green-500"
                          : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Icon */}
                      <span className="text-2xl shrink-0">{clase.icon}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {clase.number}
                          </Badge>
                          <span className="font-medium">{clase.title}</span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              isProduct ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            )}
                          >
                            {isProduct ? 'Producto' : 'Servicio'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {clase.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm">
                <span className="font-medium">{tempSelected.length}</span>
                <span className="text-muted-foreground"> clase(s) seleccionada(s)</span>
                {tempSelected.length > 0 && (
                  <span className="text-muted-foreground">
                    {' · '}{tempSelected.filter(n => n <= 34).length} productos,
                    {' '}{tempSelected.filter(n => n > 34).length} servicios
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm}>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar selección
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
