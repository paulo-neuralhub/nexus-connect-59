// ============================================================
// IP-NEXUS HELP - ARTICLE LAYOUT WRAPPER
// ============================================================

import { useState, type ReactNode } from 'react';
import { Clock, Calendar, ThumbsUp, ThumbsDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HelpArticleLayoutProps {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  category: string;
  categoryPath: string;
  readTime: string;
  lastUpdated: string;
  relatedArticles?: Array<{ title: string; path: string }>;
  children: ReactNode;
}

export function HelpArticleLayout({
  title, icon: Icon, accentColor, category, categoryPath, readTime, lastUpdated, relatedArticles, children
}: HelpArticleLayoutProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/app/help" className="hover:text-foreground transition-colors">Centro de Ayuda</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={categoryPath} className="hover:text-foreground transition-colors">{category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}15` }}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
            {category}
          </span>
        </div>
        <h1 className="text-[26px] font-bold text-foreground leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {readTime}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lastUpdated}</span>
        </div>
      </div>

      {/* Article content */}
      <div className="text-[15px] text-foreground/90 leading-[1.8] space-y-4">
        {children}
      </div>

      {/* Feedback */}
      <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border">
        {feedback ? (
          <p className="text-sm font-medium text-foreground text-center">
            {feedback === 'up' ? '¡Gracias por tu feedback! 🎉' : 'Gracias. Trabajaremos en mejorar este artículo.'}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground text-center mb-3">¿Te ha resultado útil este artículo?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setFeedback('up')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-background border border-border hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                <ThumbsUp className="w-4 h-4 text-emerald-500" /> Sí, me ayudó
              </button>
              <button onClick={() => setFeedback('down')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-background border border-border hover:border-red-300 hover:bg-red-50 transition-all">
                <ThumbsDown className="w-4 h-4 text-red-400" /> No del todo
              </button>
            </div>
          </>
        )}
      </div>

      {/* Related articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Artículos relacionados</h3>
          <div className="space-y-1">
            {relatedArticles.map((article, i) => (
              <Link key={i} to={article.path}
                className="flex items-center gap-2 p-3 rounded-xl text-sm text-foreground/80 hover:bg-background hover:shadow-sm transition-all">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-8 pt-6 border-t border-border">
        <Link to={categoryPath} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" /> Volver a {category}
        </Link>
      </div>
    </div>
  );
}
