/**
 * useCalendarBookings - Hook para reuniones/bookings del Backoffice (datos reales)
 * Reemplaza MOCK_BOOKINGS en backoffice/calendar/index.tsx
 * NOTE: Tabla calendar_bookings puede no existir aún - devuelve vacío gracefully
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface Booking {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  attendee: string;
  email: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CalendarStats {
  thisWeek: number;
  confirmed: number;
  pending: number;
  thisMonth: number;
}

// Helper para hacer queries a tablas que pueden no existir en tipos generados
const queryTable = (tableName: string) => {
  const client: any = supabase;
  return client.from(tableName);
};

export function useCalendarBookings() {
  return useQuery({
    queryKey: ['calendar-bookings'],
    queryFn: async (): Promise<Booking[]> => {
      try {
        // Intentar obtener de tabla de bookings/meetings
        const { data, error } = await queryTable('calendar_bookings')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20);

        if (error) {
          // Tabla puede no existir aún
          console.warn('[useCalendarBookings] Table may not exist:', error.message);
          return [];
        }

        return (data || []).map((b: any) => ({
          id: b.id,
          title: b.title || 'Reunión',
          date: b.start_time?.split('T')[0] || '',
          time: b.start_time ? new Date(b.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          duration: b.duration_minutes || 30,
          attendee: b.attendee_name || 'Invitado',
          email: b.attendee_email || '',
          type: b.meeting_type || 'meeting',
          status: b.status || 'pending',
        }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCalendarStats() {
  return useQuery({
    queryKey: ['calendar-stats'],
    queryFn: async (): Promise<CalendarStats> => {
      const stats: CalendarStats = {
        thisWeek: 0,
        confirmed: 0,
        pending: 0,
        thisMonth: 0,
      };

      try {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Contar reuniones de esta semana
        const { data: weekData } = await queryTable('calendar_bookings')
          .select('id, status')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());

        if (weekData) {
          stats.thisWeek = weekData.length;
          stats.confirmed = weekData.filter((b: any) => b.status === 'confirmed').length;
          stats.pending = weekData.filter((b: any) => b.status === 'pending').length;
        }

        // Contar reuniones del mes
        const { data: monthData } = await queryTable('calendar_bookings')
          .select('id', { count: 'exact' })
          .gte('start_time', monthStart.toISOString())
          .lte('start_time', monthEnd.toISOString());

        if (monthData) {
          stats.thisMonth = monthData.length;
        }

        return stats;
      } catch {
        return stats;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}
