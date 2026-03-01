import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing DB credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log("WIPING ALL ACCOUNTS TO ENSURE NADOU SUPREMACY...");

    // 1. Fetch ALL users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Fetch Error:", error);
    } else {
        console.log(`Found ${users.length} users to delete.`);
        for (const user of users) {
            const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
            if (delErr) console.error("Could not delete user:", user.id, delErr.message);
        }
        console.log("Deleted all users from Auth.");
    }

    console.log("Purging all profiles just in case...");
    await supabase.from('profiles').delete().neq('id', '0000'); // delete everything

    console.log("Creating nadou admin account...");
    const fakeEmail = 'nadou@ramadan.local';

    const { data: newAdmin, error: createError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: 'TM2627',
        email_confirm: true
    });

    if (createError) {
        console.error("Failed to create admin:", createError);
        process.exit(1);
    }

    if (newAdmin && newAdmin.user) {
        console.log("Admin auth created:", newAdmin.user.id);

        // Force the profile to be an admin
        const { error: profileErr } = await supabase.from('profiles').upsert({
            id: newAdmin.user.id,
            username: 'nadou',
            is_admin: true
        });

        if (profileErr) {
            console.error("Failed to set admin profile:", profileErr);
        } else {
            console.log("✅ SUCCESS: 'nadou' with 'TM2627' is now the ONLY admin!");
        }
    }
}

run();
