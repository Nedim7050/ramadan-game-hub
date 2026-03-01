"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * Page de profil.  L’utilisateur peut choisir ou modifier son username et
 * afficher son avatar (optionnel).  Après l’inscription, l’utilisateur est
 * redirigé vers cette page pour définir son username unique.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUserId(session.user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
      if (!error && data) {
        setUsername(data.username);
        setNewUsername(data.username);
      }
    }
    fetchProfile();
  }, [router]);

  async function saveUsername() {
    setError(null);
    if (!newUsername.trim()) return;
    setLoading(true);
    const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId, username: newUsername }, { onConflict: 'id' });
    setLoading(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setUsername(newUsername);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-primary">Profil</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <label className="block mb-2">
        <span className="text-sm">Username</span>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="mt-1 w-full p-2 rounded bg-gray-700 text-white"
        />
      </label>
      <button
        onClick={saveUsername}
        disabled={loading}
        className="bg-accent text-white px-4 py-2 rounded hover:bg-primary disabled:opacity-50"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {username && (
        <p className="mt-4">Username actuel : <span className="font-semibold">{username}</span></p>
      )}
    </div>
  );
}