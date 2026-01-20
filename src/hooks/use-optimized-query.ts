import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { ClientCache, CacheKeys } from '@/lib/performance/ClientCache';
import { QueryOptimizer } from '@/lib/performance/QueryOptimizer';
import { supabase } from '@/integrations/supabase/client';

/**
 * Optimized query hook with client-side caching
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> & {
    cacheTime?: number; // Client cache time in seconds
    staleTime?: number; // Client stale time in seconds
  }
) {
  const { cacheTime = 300, staleTime = 60, ...queryOptions } = options || {};
  const cacheKey = queryKey.join(':');

  return useQuery({
    queryKey,
    queryFn: async () => {
      return ClientCache.getOrSet(
        cacheKey,
        async () => {
          return QueryOptimizer.deduplicateQuery(cacheKey, queryFn);
        },
        {
          ttl: cacheTime,
          staleTime: staleTime,
        }
      );
    },
    staleTime: staleTime * 1000,
    gcTime: cacheTime * 1000,
    ...queryOptions,
  });
}

/**
 * Optimized infinite query with cursor pagination
 */
export function useOptimizedInfiniteQuery<T extends { id: string; created_at: string }>(
  queryKey: string[],
  table: string,
  options: {
    select?: string;
    limit?: number;
    filters?: Record<string, any>;
    order?: 'asc' | 'desc';
  } = {},
  queryOptions?: Omit<UseInfiniteQueryOptions<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) {
  const { select = '*', limit = 20, filters = {}, order = 'desc' } = options;

  return useInfiniteQuery({
    queryKey: [...queryKey, filters],
    queryFn: async ({ pageParam }) => {
      return QueryOptimizer.paginateCursor<T>(table, {
        cursor: pageParam as string | undefined,
        limit,
        select,
        order,
        filters,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...queryOptions,
  });
}

/**
 * Batched query for fetching multiple items by ID
 */
export function useBatchedQuery<T>(
  table: string,
  id: string | undefined,
  select: string = '*'
) {
  return useQuery({
    queryKey: [table, id],
    queryFn: async () => {
      if (!id) return null;
      return QueryOptimizer.batchGetById<T>(table, id, select);
    },
    enabled: !!id,
  });
}

/**
 * Prefetch query data
 */
export async function prefetchQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  cacheTime: number = 300
): Promise<void> {
  const cacheKey = queryKey.join(':');
  
  // Only prefetch if not in cache
  const cached = ClientCache.get(cacheKey);
  if (!cached) {
    try {
      const data = await queryFn();
      ClientCache.set(cacheKey, data, { ttl: cacheTime });
    } catch (error) {
      console.warn('[prefetchQuery] Failed to prefetch:', error);
    }
  }
}

/**
 * Invalidate cached query
 */
export function invalidateQuery(queryKey: string[]): void {
  const cacheKey = queryKey.join(':');
  ClientCache.delete(cacheKey);
}

/**
 * Invalidate all queries matching a pattern
 */
export function invalidateQueriesPattern(pattern: string): number {
  return ClientCache.deletePattern(pattern);
}
