import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isMock = supabaseUrl === 'https://mock.supabase.co';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
