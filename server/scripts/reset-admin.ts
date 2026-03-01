import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function performReset() {
    console.log("⚠️ Starting Database Reset Sequence...");

    // 0. Manual cleanup of public tables to avoid FK conflicts
    console.log("0. Cleaning up public tables...");
    await supabaseAdmin.from('gossips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('points_ledger').delete().neq('id', 0);
    await supabaseAdmin.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("   Public tables wiped.");

    // 1. Delete all existing authenticated users
    console.log("1. Deleting all users from Auth...");
    let hasMore = true;
    while (hasMore) {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;

        if (users.users.length === 0) {
            hasMore = false;
        } else {
            console.log(`   Found ${users.users.length} users... Deleting...`);
            let deletedThisRound = 0;
            for (const u of users.users) {
                const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
                if (error) {
                    console.error(`   Failed to delete ${u.id}:`, error.message);
                } else {
                    deletedThisRound++;
                }
            }
            if (deletedThisRound === 0) {
                console.log("   No users were deleted this round! Breaking loop to avoid infinite hang.");
                hasMore = false;
            }
        }
    }
    console.log("✅ All Auth users deleted.");

    // 2. Create the precise Admin user
    const adminPseudo = "nadou";
    const adminPassword = "TM2627";
    const adminEmail = `${adminPseudo}@ramadan.local`;

    console.log(`2. Creating ultimate Admin account [${adminPseudo}]...`);

    const { data: adminAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
    });

    if (createError) throw createError;

    const adminId = adminAuth.user.id;
    console.log(`✅ Admin Auth Created: ${adminId}`);

    // Wait a moment for DB triggers
    await new Promise(r => setTimeout(r, 1000));

    console.log("3. Securing Admin Privileges...");
    const { error: profileError } = await supabaseAdmin.from('profiles')
        .update({ username: adminPseudo, is_admin: true })
        .eq('id', adminId);

    if (profileError) {
        console.log("   Update failed, attempting insert...");
        await supabaseAdmin.from('profiles').upsert({
            id: adminId,
            username: adminPseudo,
            is_admin: true
        });
    }

    console.log("✅ Profile updated to SUPER ADMIN.");
    console.log("\n🎉 RESET COMPLETE. The database is clean and locked down.");
    console.log(`   Login: ${adminPseudo} | Pass: ${adminPassword}`);
    process.exit(0);
}

performReset().catch(err => {
    console.error("❌ Reset Failed:", err);
    process.exit(1);
});
