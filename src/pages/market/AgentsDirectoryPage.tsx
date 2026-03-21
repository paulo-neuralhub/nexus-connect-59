/**
 * Public Market Directory — /market/agents
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Star, MapPin, BadgeCheck, Globe, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LandingHeader } from '@/components/market/landing/LandingHeader';
import { LandingFooter } from '@/components/market/landing/LandingFooter';
import { useMarketAgentsList, type AgentFilters } from '@/hooks/market/useMarketAgentsV3';

const SERVICE_TYPES = [
  { value: 'trademark_registration', label: 'Registro de Marca' },
  { value: 'patent_registration', label: 'Patentes' },
  { value: 'design_registration', label: 'Diseños' },
  { value: 'opposition', label: 'Oposiciones' },
  { value: 'search', label: 'Búsquedas' },
  { value: 'renewal', label: 'Renovaciones' },
  { value: 'surveillance', label: 'Vigilancia' },
  { value: 'legal_opinion', label: 'Dictámenes' },
];

const JURISDICTIONS = [
  { value: 'EM', label: '🇪🇺 EUIPO' },
  { value: 'ES', label: '🇪🇸 España' },
  { value: 'US', label: '🇺🇸 USA' },
  { value: 'GB', label: '🇬🇧 UK' },
  { value: 'DE', label: '🇩🇪 Alemania' },
  { value: 'FR', label: '🇫🇷 Francia' },
  { value: 'JP', label: '🇯🇵 Japón' },
  { value: 'CN', label: '🇨🇳 China' },
];

export default function MarketAgentsDirectoryPage() {
  const [filters, setFilters] = useState<AgentFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const { data: agents = [], isLoading } = useMarketAgentsList(filters, 50);

  const handleSearch = () => setFilters(f => ({ ...f, search: searchInput }));

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <LandingHeader />

      {/* Hero mini */}
      <section className="py-12" style={{ background: 'linear-gradient(135deg, #0D1B2A, #14213D)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Directorio de Profesionales PI</h1>
          <p className="text-white/60 text-sm">Encuentra al especialista ideal para tu proyecto de propiedad intelectual</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-8 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, firma, especialización..."
              className="pl-9"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={filters.jurisdiction || ''} onValueChange={v => setFilters(f => ({ ...f, jurisdiction: v || undefined }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Jurisdicción" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {JURISDICTIONS.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.service_type || ''} onValueChange={v => setFilters(f => ({ ...f, service_type: v || undefined }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo servicio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={filters.verified_only || false} onCheckedChange={v => setFilters(f => ({ ...f, verified_only: v }))} />
            <span className="text-xs text-gray-500">Solo verificados</span>
          </div>
          <Button size="sm" onClick={handleSearch} style={{ background: '#10B981' }} className="text-white">
            <Search className="w-4 h-4 mr-1" /> Buscar
          </Button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando agentes...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron agentes</h3>
            <p className="text-gray-500 text-sm">Ajusta los filtros o vuelve más tarde</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/market/agents/${agent.slug}`} className="block no-underline">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-emerald-200 transition-all group relative">
                    {agent.is_featured && (
                      <Badge className="absolute top-3 right-3 text-[10px]" style={{ background: '#FCA311', color: '#fff' }}>
                        <Sparkles className="w-3 h-3 mr-1" /> Patrocinado
                      </Badge>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback className="text-sm font-bold" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                          {agent.display_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 truncate text-sm group-hover:text-emerald-700 transition-colors">
                            {agent.display_name}
                          </h3>
                          {agent.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                        </div>
                        {agent.firm_name && <p className="text-xs text-gray-500 truncate">{agent.firm_name}</p>}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5" style={{ color: '#FCA311', fill: '#FCA311' }} />
                        <span className="text-sm font-bold text-gray-800">{agent.rating_avg?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-xs text-gray-400">({agent.ratings_count} reviews)</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{agent.completed_services} servicios</span>
                    </div>

                    {/* Jurisdictions */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(agent.jurisdictions || []).slice(0, 4).map((j: string) => (
                        <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0.5">{j}</Badge>
                      ))}
                      {(agent.jurisdictions || []).length > 4 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">+{agent.jurisdictions.length - 4}</Badge>
                      )}
                    </div>

                    {/* Bio */}
                    {agent.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{agent.bio}</p>
                    )}

                    <div className="flex items-center justify-between">
                      {agent.city && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" /> {agent.city}
                        </span>
                      )}
                      <span className="text-xs font-medium text-emerald-600 group-hover:underline ml-auto">Ver perfil →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
