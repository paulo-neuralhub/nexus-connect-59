// ============================================================
// IP-NEXUS APP - HELP ARTICLE DETAIL (Static content support)
// ============================================================

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock, Calendar, Tag, FileQuestion, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHelpArticle, useSubmitArticleFeedback } from '@/hooks/help';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { getStaticArticle, getStaticCategory, getStaticArticlesByCategory } from '@/lib/helpStaticContent';

export default function HelpArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  // Try DB first
  const { data: dbArticle, isLoading } = useHelpArticle(slug || '');
  const submitFeedback = useSubmitArticleFeedback();

  // Fallback to static
  const staticArticle = getStaticArticle(slug || '');
  const staticCategory = staticArticle ? getStaticCategory(staticArticle.categorySlug) : undefined;
  const relatedStatic = staticArticle
    ? getStaticArticlesByCategory(staticArticle.categorySlug).filter(a => a.slug !== slug).slice(0, 3)
    : [];

  // Use DB article if available, otherwise static
  const hasDbArticle = !!dbArticle;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // If DB article exists, render it (existing behavior)
  if (hasDbArticle) {
    const article = dbArticle;
    const wordCount = article.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/app/help" className="hover:text-foreground">Centro de Ayuda</Link>
          <ChevronRight className="w-3 h-3" />
          {article.category && (
            <>
              <Link to={`/app/help/category/${article.category.slug}`} className="hover:text-foreground">
                {article.category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-foreground truncate">{article.title}</span>
        </nav>
        <h1 className="text-[26px] font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>{article.title}</h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingTime} min</span>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Static article
  if (!staticArticle) {
    return (
      <div className="space-y-6">
        <Link to="/app/help"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button></Link>
        <EmptyState icon={<FileQuestion className="h-12 w-12" />} title="Artículo no encontrado" description="El artículo que buscas no existe." />
      </div>
    );
  }

  const categoryPath = `/app/help/category/${staticArticle.categorySlug}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/app/help" className="hover:text-foreground transition-colors">Centro de Ayuda</Link>
        <ChevronRight className="w-3 h-3" />
        {staticCategory && (
          <>
            <Link to={categoryPath} className="hover:text-foreground transition-colors">{staticCategory.name}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">{staticArticle.title}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="outline" className="text-xs">{staticArticle.articleType === 'guide' ? 'Guía' : staticArticle.articleType === 'tutorial' ? 'Tutorial' : staticArticle.articleType}</Badge>
          {staticCategory && <span className="text-xs text-muted-foreground">{staticCategory.name}</span>}
        </div>
        <h1 className="text-[26px] font-bold text-foreground leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
          {staticArticle.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{staticArticle.readTime}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Febrero 2026</span>
        </div>
        {staticArticle.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {staticArticle.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-table:text-sm">
        <ReactMarkdown>{staticArticle.content}</ReactMarkdown>
      </div>

      {/* Feedback */}
      <div className="p-6 rounded-2xl bg-muted/50 border border-border">
        {feedbackGiven ? (
          <p className="text-sm font-medium text-foreground text-center">
            {feedbackGiven === 'up' ? '¡Gracias por tu feedback! 🎉' : 'Gracias. Trabajaremos en mejorar este artículo.'}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground text-center mb-3">¿Te ha resultado útil este artículo?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setFeedbackGiven('up')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-background border border-border hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                <ThumbsUp className="w-4 h-4 text-emerald-500" /> Sí, me ayudó
              </button>
              <button onClick={() => setFeedbackGiven('down')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-background border border-border hover:border-red-300 hover:bg-red-50 transition-all">
                <ThumbsDown className="w-4 h-4 text-red-400" /> No del todo
              </button>
            </div>
          </>
        )}
      </div>

      {/* Related */}
      {relatedStatic.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Artículos relacionados</h3>
          <div className="space-y-1">
            {relatedStatic.map((r) => (
              <Link key={r.slug} to={`/app/help/article/${r.slug}`}
                className="flex items-center gap-2 p-3 rounded-xl text-sm text-foreground/80 hover:bg-background hover:shadow-sm transition-all">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="pt-6 border-t border-border">
        <Link to={categoryPath} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" /> Volver a {staticCategory?.name || 'categoría'}
        </Link>
      </div>
    </div>
  );
}
