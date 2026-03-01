import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from './supabaseClient';

/**
 * Hook React pour établir une connexion Socket.io authentifiée.  Le token
 * d’authentification Supabase est récupéré via `supabase.auth.getSession()` et
 * transmis dans le header `auth` du handshake.  La fonction renvoie la
 * référence du socket pour être utilisée dans les composants.
 */
export function useSocket(url?: string): Socket | null {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function connect() {
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;
      const endpoint = url || process.env.NEXT_PUBLIC_SOCKET_URL || '';
      if (!endpoint) {
        console.warn('NEXT_PUBLIC_SOCKET_URL non défini');
        return;
      }
      const socket = io(endpoint, {
        auth: { token: accessToken },
        autoConnect: true,
      });
      if (isMounted) {
        socketRef.current = socket;
      }
    }
    connect();
    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [url]);

  return socketRef.current;
}