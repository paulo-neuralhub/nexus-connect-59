// ============================================================
// IP-NEXUS APP - HELP ARTICLES LIST
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { HelpArticleCard } from '@/components/features/help/HelpArticleCard';
import { useHelpArticles, useSearchHelpArticles } from '@/hooks/help';
import { useDebounce } from '@/hooks/use-debounce';

export default function HelpArticlesListPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);

  const isSearching = debounced.trim().length >= 2;

  const { data: articles = [], isLoading: loadingAll } = useHelpArticles();
  const { data: searchResults = [], isLoading: loadingSearch } = useSearchHelpArticles(debounced, {
    enabled: isSearching,
  });

  const items = isSearching ? searchResults : articles;
  const isLoading = isSearching ? loadingSearch : loadingAll;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/app/help">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
          <h2 className="text-xl font-semibold">Artículos</h2>
          <p className="text-sm text-muted-foreground">
            Explora todos los artículos publicados del Centro de Ayuda
          </p>
        </div>

        <div className="relative w-full sm:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artículos..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin artículos"
          description={
            isSearching
              ? 'No encontramos resultados para tu búsqueda.'
              : 'Aún no hay artículos publicados.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <HelpArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
