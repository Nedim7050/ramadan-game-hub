"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

/**
 * Barre de navigation principale.  Affiche les liens vers le lobby, le leaderboard
 * et le profil.  Permet également de se déconnecter.  Le composant est
 * déclaré "use client" car il interagit avec l’état et Supabase.
 */
export default function Navbar() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
      if (!error && data) setUsername(data.username);
    }
    fetchProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <nav className="bg-secondary text-primary p-4 flex justify-between items-center">
      <div className="font-bold text-lg">
        <Link href="/lobby">Ramadan Game Hub</Link>
      </div>
      <div className="flex gap-4 items-center">
        <Link href="/lobby" className="hover:text-white">Lobby</Link>
        <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
        <Link href="/profile" className="hover:text-white">{username || 'Profil'}</Link>
        <button
          onClick={handleLogout}
          className="bg-accent text-white px-3 py-1 rounded hover:bg-primary"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}