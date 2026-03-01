import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = 'sb_publishable_LadVpZaaDGirm2lP-Gjo1A_Ji0AHzeH';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function testLogin() {
    console.log("URL:", SUPABASE_URL);
    console.log("Testing nadou admin login...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'nadou@ramadan.local',
        password: 'TM2627'
    });

    console.log("Nadou login Success:", !!signInData?.user);
    if (signInError) {
        console.log("Nadou login Error:", signInError.message, signInError.status);
    }

    console.log("\nTesting auth state using full Service Role...");
    const adminClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false }
    });

    const { data: users, error: e2 } = await adminClient.auth.admin.listUsers();
    console.log("Auth Users Count:", users?.users.length);
    if (e2) {
        console.log("ListUsers Error:", e2?.message);
    }
    if (users) {
        console.log(users.users.find(u => u.email === 'nadou@ramadan.local') ? '=> Nadou mapped in Supabase Auth' : '=> Nadou NOT IN AUTH');
    }
}

testLogin().catch(console.error);
