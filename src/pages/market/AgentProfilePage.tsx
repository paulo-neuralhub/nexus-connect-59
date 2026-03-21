/**
 * Public Agent Profile — /market/agents/:slug
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck, Globe, Clock, Shield, ShieldAlert, Award, Sparkles, BookmarkPlus, MessageSquare, FileText, Briefcase, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandingHeader } from '@/components/market/landing/LandingHeader';
import { LandingFooter } from '@/components/market/landing/LandingFooter';
import { useMarketAgentBySlug, useAgentServices, useAgentReviews, useAgentPortfolio, useAgentCredentials, usePriceRegulations, useSaveAgent } from '@/hooks/market/useMarketAgentsV3';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  trademark_registration: 'Registro de Marca',
  patent_registration: 'Patentes',
  design_registration: 'Diseños Industriales',
  opposition: 'Oposiciones',
  search: 'Búsquedas',
  prior_art_search: 'Estado del arte',
  renewal: 'Renovaciones',
  surveillance: 'Vigilancia',
  legal_opinion: 'Dictámenes',
};

export default function AgentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: agent, isLoading } = useMarketAgentBySlug(slug);
  const { data: services = [] } = useAgentServices(agent?.id);
  const { data: reviews = [] } = useAgentReviews(agent?.id);
  const { data: portfolio = [] } = useAgentPortfolio(agent?.id);
  const { data: credentials = [] } = useAgentCredentials(agent?.id);
  const { data: regulations = [] } = usePriceRegulations();
  const saveAgent = useSaveAgent();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando perfil...</div>;
  if (!agent) return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <LandingHeader />
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-2">Agente no encontrado</h2>
        <Link to="/market/agents" className="text-emerald-600 text-sm">← Volver al directorio</Link>
      </div>
    </div>
  );

  const getRegulation = (jCode: string) => regulations.find(r => r.jurisdiction_code === jCode);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <LandingHeader />

      {/* Professional type alert */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {agent.bar_association || agent.license_number ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: '#ECFDF5', borderColor: '#6EE7B7' }}>
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-800">
              <strong>Profesional habilitado</strong> para representación ante oficinas de PI. Credenciales comprobadas.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-800">
              <strong>Consultor/asesor.</strong> No habilitado para representación directa ante oficinas.
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback className="text-xl font-bold" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                      {agent.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">{agent.display_name}</h1>
                      {agent.is_verified && <BadgeCheck className="w-5 h-5 text-emerald-500" />}
                      {agent.is_featured && (
                        <Badge style={{ background: '#FCA311', color: '#fff' }} className="text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" /> Patrocinado
                        </Badge>
                      )}
                    </div>
                    {agent.firm_name && <p className="text-sm text-gray-500 mb-2">{agent.firm_name}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: '#FCA311', fill: '#FCA311' }} />
                        <strong className="text-gray-800">{agent.rating_avg?.toFixed(1)}</strong>
                        <span>({agent.ratings_count} reviews)</span>
                      </span>
                      {agent.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {agent.city}</span>}
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {agent.completed_services} servicios</span>
                    </div>
                    {/* Jurisdictions */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {agent.jurisdictions?.map((j: string) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">{j}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="about">
              <TabsList className="mb-4">
                <TabsTrigger value="about">Sobre mí</TabsTrigger>
                <TabsTrigger value="services">Servicios</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                {credentials.length > 0 && <TabsTrigger value="credentials">Credenciales</TabsTrigger>}
              </TabsList>

              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{agent.bio || 'Sin descripción disponible.'}</p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Experiencia</p>
                        <p className="text-sm font-medium">{agent.years_experience} años</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Idiomas</p>
                        <div className="flex flex-wrap gap-1">
                          {(agent.languages || []).map((l: string) => (
                            <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <Card><CardContent className="p-6 text-center text-gray-400 text-sm">No hay servicios publicados</CardContent></Card>
                  ) : services.map(svc => {
                    const reg = getRegulation(svc.jurisdiction_code);
                    return (
                      <Card key={svc.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{svc.title || SERVICE_TYPE_LABELS[svc.service_type] || svc.service_type}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">{svc.jurisdiction_code} · {SERVICE_TYPE_LABELS[svc.service_type]}</p>
                              {svc.description && <p className="text-sm text-gray-600 mt-2">{svc.description}</p>}
                            </div>
                            {svc.base_price_eur != null && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">€{svc.base_price_eur}</p>
                                {svc.official_fees_eur ? <p className="text-[10px] text-gray-400">+ €{svc.official_fees_eur} tasas oficiales</p> : null}
                              </div>
                            )}
                          </div>
                          {/* Regulation note */}
                          {reg && (
                            <div className="mt-3 p-2 rounded text-[11px]" style={{
                              background: reg.price_regulation_type === 'mandatory_estimate' ? '#FFFBEB' : '#F0FDF4',
                              color: reg.price_regulation_type === 'mandatory_estimate' ? '#92400E' : '#166534',
                            }}>
                              {reg.price_regulation_type === 'free' && '🟢 '}
                              {reg.price_regulation_type === 'reference_only' && '🔵 '}
                              {reg.price_regulation_type === 'mandatory_estimate' && '🟡 '}
                              {reg.price_display_note}
                            </div>
                          )}
                          {/* Includes */}
                          {svc.includes?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {svc.includes.map((inc: string) => (
                                <Badge key={inc} variant="outline" className="text-[10px]">✓ {inc}</Badge>
                              ))}
                            </div>
                          )}
                          {/* Delivery time */}
                          {(svc.estimated_days_min || svc.estimated_days_max) && (
                            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {svc.estimated_days_min && svc.estimated_days_max
                                ? `${svc.estimated_days_min}–${svc.estimated_days_max} días`
                                : `~${svc.estimated_days_min || svc.estimated_days_max} días`}
                              · {svc.revisions_included} revisiones incluidas
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="portfolio">
                {portfolio.length === 0 ? (
                  <Card><CardContent className="p-6 text-center text-gray-400 text-sm">No hay casos en el portfolio</CardContent></Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolio.map((p: any) => (
                      <Card key={p.id}>
                        <CardContent className="p-4">
                          <h4 className="font-medium text-sm text-gray-800">{p.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                          <div className="flex gap-2 mt-2">
                            {p.service_type && <Badge variant="secondary" className="text-[10px]">{SERVICE_TYPE_LABELS[p.service_type] || p.service_type}</Badge>}
                            {p.jurisdiction_code && <Badge variant="secondary" className="text-[10px]">{p.jurisdiction_code}</Badge>}
                            {p.outcome && <Badge className="text-[10px]" style={{ background: '#10B981', color: '#fff' }}>{p.outcome}</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews">
                {reviews.length === 0 ? (
                  <Card><CardContent className="p-6 text-center text-gray-400 text-sm">Aún no hay reviews publicadas</CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r: any) => (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5" style={{ color: i < r.overall_rating ? '#FCA311' : '#E5E7EB', fill: i < r.overall_rating ? '#FCA311' : 'none' }} />
                            ))}
                            <span className="text-xs text-gray-400 ml-2">
                              {r.created_at && format(new Date(r.created_at), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{r.review_text}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{r.is_anonymous ? 'Cliente verificado' : 'Cliente'}</p>
                          {r.agent_reply && (
                            <div className="mt-3 p-3 rounded-lg bg-gray-50 border-l-2 border-emerald-400">
                              <p className="text-[11px] font-semibold text-emerald-700 mb-1">Respuesta del agente</p>
                              <p className="text-sm text-gray-600">{r.agent_reply}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {credentials.length > 0 && (
                <TabsContent value="credentials">
                  <div className="space-y-3">
                    {credentials.map((c: any) => (
                      <Card key={c.id}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <Award className="w-8 h-8 text-emerald-500" />
                          <div>
                            <h4 className="font-medium text-sm">{c.credential_name}</h4>
                            <p className="text-xs text-gray-500">{c.issuing_authority} {c.credential_number && `· Nº ${c.credential_number}`}</p>
                            {c.verified && <Badge className="mt-1 text-[10px]" style={{ background: '#10B981', color: '#fff' }}>✓ Verificado</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar sticky */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <Link to={`/market/request/${agent.slug}`}>
                    <Button className="w-full text-white" style={{ background: '#10B981' }}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Enviar solicitud
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => saveAgent.mutate({ agentId: agent.id, save: true })}>
                    <BookmarkPlus className="w-4 h-4 mr-2" /> Guardar agente
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Responde en</span>
                    <span className="font-medium">{agent.avg_response_hours ? `${Math.round(agent.avg_response_hours)}h` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nuevos clientes</span>
                    <span className="font-medium">{agent.accepts_new_clients ? '✅ Sí' : '❌ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tasa de éxito</span>
                    <span className="font-medium">{agent.success_rate}%</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-[10px] text-gray-400 text-center px-4">
                IP-NEXUS actúa como plataforma tecnológica. El contrato de servicios es entre usted y el profesional.
              </div>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
