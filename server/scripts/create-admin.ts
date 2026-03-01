import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createNadou() {
    const adminPseudo = "nadou";
    const adminPassword = "TM2627";
    const adminEmail = `${adminPseudo}@ramadan.local`;

    console.log(`Creating Admin account [${adminPseudo}]...`);

    const { data: adminAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
    });

    if (createError) {
        if (createError.message.includes("already registered")) {
            console.log("Account already registered in Auth, checking profile.");
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const nadou = users?.users.find(u => u.email === adminEmail);
            if (nadou) {
                await supabaseAdmin.from('profiles')
                    .upsert({ id: nadou.id, username: adminPseudo, is_admin: true });
                console.log("Profile updated to SUPER ADMIN.");
            }
            return;
        }
        throw createError;
    }

    const adminId = adminAuth.user.id;
    console.log(`Auth Created: ${adminId}`);

    await new Promise(r => setTimeout(r, 1000));

    await supabaseAdmin.from('profiles').upsert({
        id: adminId,
        username: adminPseudo,
        is_admin: true
    });

    console.log("Profile updated to SUPER ADMIN.");
}

createNadou().catch(console.error);
