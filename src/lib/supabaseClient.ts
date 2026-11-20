import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://itmarysfybhcrmvnggyy.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bWFyeXNmeWJoY3Jtdm5nZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODIyOTUsImV4cCI6MjEwOTQ1ODI5NX0.1CaJDVO727VVbMNoh8O9Yx_khb7_TMMCp7UkZEIt9Uc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});
