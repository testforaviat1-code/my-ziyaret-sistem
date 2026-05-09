import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Bileşen her render olduğunda yeni Supabase client oluşturmasın diye
 * useMemo ile memoize edilmiş tek bir client döndüren hook.
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
