import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Globe,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useOrganization } from '@/contexts/organization-context';
import { useCreateScrapingSource, useTestScrapingConnection } from '@/hooks/use-web-scraper';
import { KNOWN_SYSTEMS, SYSTEM_ALIASES, detectSystemFromText } from '@/lib/constants/known-systems';

interface WebScrapingSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceCreated?: (sourceId: string) => void;
}

// Systems that support scraping
const SCRAPING_SYSTEMS = Object.entries(KNOWN_SYSTEMS)
  .filter(([_, sys]) => sys.capabilities.supports_scraping && !sys.capabilities.has_api)
  .map(([id, sys]) => ({
    id,
    name: sys.name,
    vendor: sys.vendor,
    description: sys.description,
    color: sys.color,
  }));

export function WebScrapingSourceModal({
  open,
  onOpenChange,
  onSourceCreated,
}: WebScrapingSourceModalProps) {
  // Form state
  const [step, setStep] = useState<'config' | 'testing' | 'result'>('config');
  const [systemId, setSystemId] = useState<string>('puntoip_galena');
  const [sourceName, setSourceName] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Test result state
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    page_title?: string;
    detected_structure?: any;
  } | null>(null);

  const { currentOrganization } = useOrganization();
  const { mutate: createSource, isPending: isCreating } = useCreateScrapingSource();
  const { mutate: testConnection, isPending: isTesting } = useTestScrapingConnection();

  // Auto-fill portal URL when system changes
  const handleSystemChange = (newSystemId: string) => {
    setSystemId(newSystemId);
    const system = KNOWN_SYSTEMS[newSystemId];
    if (system?.connection_templates?.scraper) {
      setPortalUrl(system.connection_templates.scraper.login_url || '');
      setSourceName(system.name);
    }
    setTestResult(null);
  };

  // Create source + encrypt credentials + test connection
  const handleCreateAndTest = () => {
    if (!currentOrganization?.id || !username || !password) return;

    setStep('testing');
    setTestResult(null);

    createSource(
      {
        name: sourceName || KNOWN_SYSTEMS[systemId]?.name || 'Portal Web',
        system_id: systemId,
        organization_id: currentOrganization.id,
        portal_url: portalUrl,
        username,
        password,
      },
      {
        onSuccess: (source) => {
          // Test connection immediately after creation
          testConnection(source.id, {
            onSuccess: (result) => {
              setStep('result');
              setTestResult({
                success: result.success,
                message: result.message || 'Conexion verificada',
                page_title: result.page_title,
                detected_structure: result.detected_structure,
              });
              if (result.success) {
                onSourceCreated?.(source.id);
              }
            },
            onError: (error) => {
              setStep('result');
              setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Error al conectar',
              });
            },
          });
        },
        onError: (error) => {
          setStep('result');
          setTestResult({
            success: false,
            message: error instanceof Error ? error.message : 'Error al crear la fuente',
          });
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after close animation
    setTimeout(() => {
      setStep('config');
      setSystemId('puntoip_galena');
      setSourceName('');
      setPortalUrl('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setTestResult(null);
    }, 300);
  };

  const isFormValid = username.trim() && password.trim() && portalUrl.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Conectar Portal Web
          </DialogTitle>
          <DialogDescription>
            Importa datos desde un portal web que no tiene API. Usamos tus credenciales
            para navegar el portal de forma segura y extraer tus datos.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Config */}
        {step === 'config' && (
          <div className="space-y-5">
            {/* Security notice */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Tus credenciales estan protegidas</p>
                <p className="mt-1 text-blue-600 dark:text-blue-300">
                  Se cifran con encriptacion AES-256 antes de almacenarse.
                  Solo se usan para acceder a tu portal y extraer tus datos.
                </p>
              </div>
            </div>

            {/* System selector */}
            <div>
              <Label>Sistema de origen</Label>
              <Select value={systemId} onValueChange={handleSystemChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCRAPING_SYSTEMS.map((sys) => (
                    <SelectItem key={sys.id} value={sys.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sys.color }}
                        />
                        {sys.name}
                        <span className="text-muted-foreground text-xs">
                          — {sys.vendor}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="other_portal">
                    <span className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-gray-500" />
                      Otro portal web
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div>
              <Label>Nombre de la conexion</Label>
              <Input
                className="mt-2"
                placeholder={KNOWN_SYSTEMS[systemId]?.name || 'Mi portal de PI'}
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
            </div>

            {/* Portal URL */}
            <div>
              <Label>URL del portal</Label>
              <Input
                className="mt-2"
                type="url"
                placeholder="https://portal.ejemplo.com"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                La URL de la pagina de login del portal
              </p>
            </div>

            {/* Credentials */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Credenciales de acceso</Label>

              <div>
                <Label className="text-sm">Usuario</Label>
                <Input
                  className="mt-1"
                  type="text"
                  placeholder="tu.usuario"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm">Contrasena</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Testing */}
        {step === 'testing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Globe className="h-12 w-12 text-blue-500" />
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Conectando al portal...</p>
              <p className="text-sm text-muted-foreground">
                Verificando credenciales y explorando la estructura del portal
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Esto puede tardar 15-30 segundos
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && testResult && (
          <div className="space-y-4">
            {testResult.success ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Conexion exitosa
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      {testResult.message}
                    </p>
                    {testResult.page_title && (
                      <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                        Portal: <strong>{testResult.page_title}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {testResult.detected_structure && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Estructura detectada:</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-background rounded">
                        <p className="text-lg font-bold">
                          {testResult.detected_structure.navigation_links || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Secciones</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="text-lg font-bold">
                          {testResult.detected_structure.tables || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Tablas</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="text-lg font-bold">
                          {testResult.detected_structure.forms || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Formularios</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Error de conexion
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {testResult.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Verifica que el usuario, contrasena y URL del portal son correctos.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'config' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAndTest}
                disabled={!isFormValid || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Conectar y Verificar
              </Button>
            </>
          )}

          {step === 'testing' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'result' && (
            <>
              {!testResult?.success && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('config');
                    setTestResult(null);
                  }}
                >
                  Volver a configurar
                </Button>
              )}
              <Button onClick={handleClose}>
                {testResult?.success ? 'Listo' : 'Cerrar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
