import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in env. Server admin features will not work.");
}

// Create a Supabase client with the Service Role key
// This bypasses Row Level Security (RLS) entirely. Use with caution!
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
