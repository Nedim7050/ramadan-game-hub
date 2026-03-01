"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * Page d’accueil affichant un formulaire d’inscription et de connexion.
 * Lorsque l’utilisateur se connecte avec succès, il est redirigé vers le lobby.
 */
export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        // On demande à l'utilisateur de confirmer son email.  Après confirmation,
        // il devra choisir un username sur la page profil.
        router.push('/profile');
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(loginError.message);
      } else {
        router.push('/lobby');
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <h1 className="text-3xl font-bold mb-4 text-primary">Ramadan Game Hub</h1>
      <form onSubmit={handleSubmit} className="bg-secondary p-6 rounded shadow max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">
          {isSignUp ? 'Créer un compte' : 'Connexion'}
        </h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full p-2 rounded bg-gray-700 text-white"
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full p-2 rounded bg-gray-700 text-white"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full bg-accent text-white py-2 rounded hover:bg-primary mb-2"
        >
          {isSignUp ? 'S’inscrire' : 'Se connecter'}
        </button>
        <p className="text-sm text-center">
          {isSignUp ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button type="button" className="text-primary underline" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Connexion' : 'Inscription'}
          </button>
        </p>
      </form>
    </div>
  );
}