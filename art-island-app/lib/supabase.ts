import { createClient } from '@supabase/supabase-js';

// Next.js: use NEXT_PUBLIC_ prefix for env vars that run in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a dummy client if credentials are missing (for development)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// DB row shape (snake_case) for Supabase select results
export interface CharacterRow {
  id: string;
  name: string;
  age: number;
  image_url: string;
  position_x: number;
  position_y: number;
  created_at: string;
}
