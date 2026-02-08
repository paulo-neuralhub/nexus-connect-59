// ============================================================
// IP-NEXUS APP - HELP GLOSSARY PAGE
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IP_GLOSSARY, type GlossaryTerm } from '@/lib/helpStaticContent';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  marcas: 'Marcas',
  patentes: 'Patentes',
  diseños: 'Diseños',
  procedimientos: 'Procedimientos',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  marcas: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400',
  patentes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  diseños: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  procedimientos: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
};

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...IP_GLOSSARY];
    if (activeCategory) items = items.filter(t => t.category === activeCategory);
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();
      items = items.filter(t =>
        t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      );
    }
    return items;
  }, [query, activeCategory]);

  // Group by first letter
  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    filtered.sort((a, b) => a.term.localeCompare(b.term, 'es'));
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(term);
    }
    return map;
  }, [filtered]);

  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/help">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Glosario de Propiedad Intelectual</h2>
            <p className="text-sm text-muted-foreground">{IP_GLOSSARY.length} términos y definiciones</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar término..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !activeCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Terms */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-border">
          <p className="text-muted-foreground">No se encontraron términos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([letter, terms]) => (
            <div key={letter}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-2">
                <span className="text-lg font-bold text-primary">{letter}</span>
              </div>
              <div className="space-y-2">
                {terms.map((term) => (
                  <div
                    key={term.term}
                    className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{term.term}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {term.definition}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] flex-shrink-0 ${CATEGORY_COLORS[term.category] || ''}`}
                      >
                        {CATEGORY_LABELS[term.category]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
