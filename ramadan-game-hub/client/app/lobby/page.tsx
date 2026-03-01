"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useSocket } from '../../lib/useSocket';

/**
 * Page Lobby permettant de créer une room ou de rejoindre une room existante.
 * On vérifie que l’utilisateur est connecté ; sinon, on le redirige vers la
 * page d’accueil.  Les actions sont effectuées via le serveur Socket.io.
 */
export default function LobbyPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const socket = useSocket();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifie que l’utilisateur est authentifié
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/');
      }
    });
  }, [router]);

  useEffect(() => {
    if (!socket) return;
    // Écoute l’évènement de création de room
    function onRoomCreated(payload: { roomCode: string }) {
      router.push(`/room/${payload.roomCode}`);
    }
    function onJoined(payload: { roomCode: string }) {
      router.push(`/room/${payload.roomCode}`);
    }
    function onError(payload: { message: string }) {
      setError(payload.message);
    }
    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onJoined);
    socket.on('error', onError);
    return () => {
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onJoined);
      socket.off('error', onError);
    };
  }, [socket, router]);

  function createRoom() {
    setError(null);
    socket?.emit('room:create');
  }

  function joinRoom() {
    setError(null);
    if (roomCode.trim().length === 0) return;
    socket?.emit('room:join', { roomCode });
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <h1 className="text-2xl font-bold text-primary">Lobby</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col md:flex-row gap-2 w-full max-w-md">
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Code de la room (ex. RAM-7K2P)"
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <button onClick={joinRoom} className="bg-accent text-white px-4 py-2 rounded hover:bg-primary">
          Rejoindre
        </button>
      </div>
      <button onClick={createRoom} className="bg-accent text-white px-4 py-2 rounded hover:bg-primary max-w-md w-full">
        Créer une nouvelle room
      </button>
    </div>
  );
}