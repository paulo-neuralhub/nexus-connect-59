/**
 * Query Optimizer for Supabase
 * Provides query batching, deduplication, and optimization utilities
 */

import { supabase } from '@/integrations/supabase/client';

interface BatchedQuery {
  table: string;
  ids: string[];
  resolve: (data: any[]) => void;
  reject: (error: Error) => void;
}

class QueryOptimizerClass {
  private batchQueue: Map<string, BatchedQuery[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // ms
  private readonly MAX_BATCH_SIZE = 100;

  // ==========================================
  // QUERY BATCHING
  // ==========================================

  /**
   * Batch multiple getById queries into a single query
   */
  async batchGetById<T>(
    table: string,
    id: string,
    selectFields: string = '*'
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const key = `${table}:${selectFields}`;
      
      if (!this.batchQueue.has(key)) {
        this.batchQueue.set(key, []);
      }

      this.batchQueue.get(key)!.push({
        table,
        ids: [id],
        resolve: (data) => resolve(data[0] || null),
        reject,
      });

      this.scheduleBatch(key, table, selectFields);
    });
  }

  private scheduleBatch(key: string, table: string, selectFields: string): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(async () => {
      this.batchTimeout = null;
      await this.executeBatch(key, table, selectFields);
    }, this.BATCH_DELAY);
  }

  private async executeBatch(
    key: string,
    table: string,
    selectFields: string
  ): Promise<void> {
    const queries = this.batchQueue.get(key);
    if (!queries || queries.length === 0) return;

    this.batchQueue.delete(key);

    // Collect all unique IDs
    const allIds = [...new Set(queries.flatMap(q => q.ids))];
    
    // Split into chunks if too large
    const chunks = this.chunkArray(allIds, this.MAX_BATCH_SIZE);

    try {
      const results: any[] = [];
      
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from(table as any)
          .select(selectFields)
          .in('id', chunk);

        if (error) throw error;
        if (data) results.push(...data);
      }

      // Create id -> data map
      const dataMap = new Map(results.map(item => [item.id, item]));

      // Resolve each query with its data
      for (const query of queries) {
        const queryResults = query.ids.map(id => dataMap.get(id)).filter(Boolean);
        query.resolve(queryResults);
      }
    } catch (error) {
      for (const query of queries) {
        query.reject(error as Error);
      }
    }
  }

  // ==========================================
  // QUERY DEDUPLICATION
  // ==========================================

  private pendingQueries: Map<string, Promise<any>> = new Map();

  /**
   * Deduplicate identical queries that happen within a short window
   */
  async deduplicateQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Check if query is already in flight
    if (this.pendingQueries.has(queryKey)) {
      return this.pendingQueries.get(queryKey) as Promise<T>;
    }

    // Execute query and store promise
    const promise = queryFn().finally(() => {
      // Remove from pending after a short delay
      setTimeout(() => {
        this.pendingQueries.delete(queryKey);
      }, 50);
    });

    this.pendingQueries.set(queryKey, promise);
    return promise;
  }

  // ==========================================
  // PAGINATION OPTIMIZER
  // ==========================================

  /**
   * Optimized cursor-based pagination
   */
  async paginateCursor<T extends { id: string; created_at: string }>(
    table: string,
    options: {
      cursor?: string;
      limit?: number;
      select?: string;
      order?: 'asc' | 'desc';
      filters?: Record<string, any>;
    }
  ): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const { cursor, limit = 20, select = '*', order = 'desc', filters = {} } = options;

    let query = supabase
      .from(table as any)
      .select(select)
      .order('created_at', { ascending: order === 'asc' })
      .limit(limit + 1); // Fetch one extra to check hasMore

    // Apply cursor
    if (cursor) {
      const operator = order === 'desc' ? 'lt' : 'gt';
      query = query.filter('created_at', operator, cursor);
    }

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const items = (data as unknown as T[]) || [];
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && resultItems.length > 0 
      ? resultItems[resultItems.length - 1].created_at 
      : null;

    return {
      data: resultItems,
      nextCursor,
      hasMore,
    };
  }

  // ==========================================
  // SELECT FIELD OPTIMIZER
  // ==========================================

  /**
   * Build optimized select string based on needed fields
   */
  buildSelect(fields: string[], relations?: Record<string, string[]>): string {
    const parts = [...fields];

    if (relations) {
      for (const [relation, relFields] of Object.entries(relations)) {
        parts.push(`${relation}(${relFields.join(',')})`);
      }
    }

    return parts.join(',');
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate query key for caching/deduplication
   */
  generateQueryKey(
    table: string,
    params: Record<string, any>
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    
    return `${table}?${sortedParams}`;
  }
}

export const QueryOptimizer = new QueryOptimizerClass();
