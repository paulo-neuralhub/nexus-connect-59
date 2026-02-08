// ============================================================
// IP-NEXUS APP - HELP CENTER HOME (Enterprise redesign)
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ArrowRight, MessageCircle, ChevronRight,
  BookOpen, Zap, Settings, CreditCard, Shield, Users,
  Database, Target, Brain, TrendingUp, Mail, HelpCircle,
  Keyboard, BookMarked, Sparkles, FileText,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HELP_CATEGORIES, HELP_ARTICLES,
  searchStaticArticles, getStaticArticlesByCategory, getFeaturedStaticArticles,
  type StaticHelpArticle,
} from '@/lib/helpStaticContent';

// ── Icon map ──
const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen, 'zap': Zap, 'settings': Settings,
  'credit-card': CreditCard, 'shield': Shield, 'users': Users,
  'database': Database, 'target': Target, 'brain': Brain,
  'trending-up': TrendingUp, 'mail': Mail, 'help-circle': HelpCircle,
};

// ── Article type badges ──
const typeBadge: Record<string, string> = {
  guide: 'Guía', tutorial: 'Tutorial', faq: 'FAQ',
  troubleshooting: 'Solución', reference: 'Referencia',
};

// ── Quick topics for search suggestions ──
const QUICK_TOPICS = [
  'expedientes', 'plazos', 'marcas', 'Genius AI', 'CRM', 'importar', 'soporte',
];

export default function HelpCenterIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length >= 2;

  const searchResults = useMemo(
    () => (isSearching ? searchStaticArticles(searchQuery) : []),
    [searchQuery, isSearching],
  );

  const featured = useMemo(() => getFeaturedStaticArticles(), []);

  return (
    <div className="space-y-10 -mt-2">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Centro de Ayuda IP-NEXUS
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3" style={{ letterSpacing: '-0.02em' }}>
            ¿En qué podemos ayudarte?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Busca en nuestra base de conocimiento o explora las guías y tutoriales
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar artículos, guías, tutoriales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-13 text-base rounded-xl border-primary/20 shadow-sm focus:shadow-md transition-shadow bg-background"
            />
          </div>

          {/* Quick topics */}
          {!isSearching && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Popular:</span>
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSearchQuery(topic)}
                  className="text-xs px-3 py-1 rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SEARCH RESULTS ── */}
      {isSearching && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Resultados para "{searchQuery}"
          </h3>
          {searchResults.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-border">
              <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No encontramos artículos para tu búsqueda.</p>
              <p className="text-sm text-muted-foreground mt-1">Intenta con otros términos o <Link to="/app/help/tickets/new" className="text-primary hover:underline">contacta con soporte</Link>.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── MAIN CONTENT (when not searching) ── */}
      {!isSearching && (
        <>
          {/* Getting Started */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Primeros pasos</h3>
              </div>
              <Link to="/app/help/category/getting-started" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {getStaticArticlesByCategory('getting-started').map((a, i) => (
                <GettingStartedCard key={a.slug} article={a} step={i + 1} />
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-5">Explorar por categoría</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {HELP_CATEGORIES.map((cat) => {
                const count = getStaticArticlesByCategory(cat.slug).length;
                const Icon = iconMap[cat.icon] || HelpCircle;
                return (
                  <Link
                    key={cat.slug}
                    to={`/app/help/category/${cat.slug}`}
                    className="group block"
                  >
                    <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                            {cat.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {cat.description}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {count} {count === 1 ? 'artículo' : 'artículos'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Featured Articles */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Artículos destacados</h3>
              <Link to="/app/help/articles" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>

          {/* Quick Links Row */}
          <section className="grid gap-4 md:grid-cols-3">
            <Link to="/app/help/glossary" className="group">
              <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                  <BookMarked className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Glosario de PI</h4>
                  <p className="text-sm text-muted-foreground">Términos y definiciones</p>
                </div>
              </div>
            </Link>
            <Link to="/app/help/shortcuts" className="group">
              <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <Keyboard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Atajos de teclado</h4>
                  <p className="text-sm text-muted-foreground">Trabaja más rápido</p>
                </div>
              </div>
            </Link>
            <Link to="/app/help/tickets/new" className="group">
              <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">¿Necesitas ayuda?</h4>
                  <p className="text-sm text-muted-foreground">Crea un ticket de soporte</p>
                </div>
              </div>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──

function GettingStartedCard({ article, step }: { article: StaticHelpArticle; step: number }) {
  return (
    <Link to={`/app/help/article/${article.slug}`} className="group block">
      <div className="relative p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-all h-full">
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{step}</span>
        </div>
        <div className="mb-3">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 pr-10">
          {article.title}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{typeBadge[article.articleType] || 'Guía'}</Badge>
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: StaticHelpArticle }) {
  const cat = HELP_CATEGORIES.find(c => c.slug === article.categorySlug);

  return (
    <Link to={`/app/help/article/${article.slug}`} className="group block">
      <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all h-full">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[10px]">
            {typeBadge[article.articleType] || 'Guía'}
          </Badge>
          {cat && (
            <span className="text-[10px] text-muted-foreground">{cat.name}</span>
          )}
        </div>
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
