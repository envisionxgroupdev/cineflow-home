import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://qqyldlfexibvvnykklee.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWxkbGZleGlidnZueWtrbGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDYwMjQsImV4cCI6MjA5MDg4MjAyNH0.hjW0cjcCuo0OsnqVShc7dzdPzKmWDgPLw6RRn4eiiPY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
