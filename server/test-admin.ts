import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
    console.log("Testing leaderboard_view...");
    const { data: lb, error: errLb } = await supabaseAdmin.from('leaderboard_view').select('*').limit(5);
    console.log("Leaderboard:", lb);
    console.log("LB Error:", errLb);

    console.log("\nTesting nadou user...");
    const { data: q2, error: e2 } = await supabaseAdmin.auth.admin.listUsers();
    const nadou = q2?.users.find(u => u.email === 'nadou@ramadan.local');
    console.log("Nadou auth exists?", !!nadou);
    if (nadou) {
        const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('id', nadou.id).single();
        console.log("Nadou profile:", p);
    }
}
test();
