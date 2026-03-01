import { createClient } from '@supabase/supabase-js';

/**
 * Initialise un client Supabase côté navigateur.  Les variables d’environnement
 * NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être
 * définies dans `.env.local` pour permettre la connexion.  Le client est
 * réutilisé dans l’ensemble de l’application.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);