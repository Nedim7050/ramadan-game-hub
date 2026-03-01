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
    console.log("Fetching gossips schema...");
    const { data: gossips, error } = await supabase.from('gossips').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (gossips && gossips.length > 0) {
            console.log("Columns:", Object.keys(gossips[0]));
        } else {
            console.log("No gossips found. Let's insert one to see the columns.");
            const { data: newGossip, error: insErr } = await supabase.from('gossips').insert({ message: 'test', type: 'dare' }).select('*').single();
            if (insErr) {
                console.log("Insert error (helps us determine columns):", insErr);
            } else {
                console.log("Columns:", Object.keys(newGossip));
            }
        }
    }
}

run();
