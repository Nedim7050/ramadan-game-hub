"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSocket } from '../../../lib/useSocket';
import { supabase } from '../../../lib/supabaseClient';
import Chat from '../../../components/Chat';
import GameCard from '../../../components/GameCard';
import { FaTiktok, FaQuestionCircle, FaPlay } from 'react-icons/fa';

interface Player {
  id: string;
  username: string;
  ready: boolean;
}

/**
 * Page d’une room spécifique.  Affiche les joueurs connectés, le chat, la
 * sélection de jeu et un bouton prêt/départ.  Toute la communication se fait
 * via Socket.io.
 */
export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const roomCode = params.code as string;
  const socket = useSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('xo');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');

  useEffect(() => {
    // vérifie la session et enregistre l’ID utilisateur
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/');
      } else {
        setCurrentUserId(session.user.id);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!socket) return;
    // rejoindre la room à la connexion du socket
    socket.emit('room:join', { roomCode });
    function onRoomState(payload: { players: Player[]; ownerId: string; selectedGame: string }) {
      setPlayers(payload.players);
      setOwnerId(payload.ownerId);
      setSelectedGame(payload.selectedGame);
    }
    function onGameStarted(payload: { sessionId: string; gameType: string }) {
      router.push(`/room/${roomCode}/game/${payload.sessionId}`);
    }
    socket.on('room:state', onRoomState);
    socket.on('game:started', onGameStarted);
    return () => {
      socket.off('room:state', onRoomState);
      socket.off('game:started', onGameStarted);
    };
  }, [socket, roomCode, router]);

  function toggleReady() {
    const me = players.find((p) => p.id === currentUserId);
    if (!me) return;
    socket?.emit('room:ready', { roomCode, isReady: !me.ready });
  }

  function selectGame(gameType: string) {
    if (currentUserId !== ownerId) return;
    setSelectedGame(gameType);
    socket?.emit('game:select', { roomCode, gameType });
  }

  function startGame() {
    if (currentUserId !== ownerId) return;
    socket?.emit('game:start', { roomCode, gameType: selectedGame });
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Panneau gauche: Liste des joueurs et Ready */}
      <div className="md:w-1/4 bg-secondary p-4 rounded flex flex-col">
        <h2 className="text-xl font-bold mb-2 text-primary">Joueurs</h2>
        <ul className="flex-1 mb-4 overflow-y-auto">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between p-2 bg-gray-700 mb-1 rounded"
            >
              <span>{player.username}</span>
              <span className={player.ready ? 'text-green-400' : 'text-red-400'}>
                {player.ready ? '✔' : '✖'}
              </span>
            </li>
          ))}
        </ul>
        <button onClick={toggleReady} className="bg-accent text-white py-2 rounded hover:bg-primary mb-2">
          Prêt / Pas prêt
        </button>
        {currentUserId === ownerId && (
          <button onClick={startGame} className="bg-accent text-white py-2 rounded hover:bg-primary">
            Démarrer le jeu
          </button>
        )}
      </div>
      {/* Panneau central: sélection de jeu */}
      <div className="md:w-2/4 bg-secondary p-4 rounded flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary">Sélection du jeu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GameCard
            gameType="xo"
            title="Tic‑Tac‑Toe"
            description="Affronte un ami dans une grille 3×3."
            onSelect={selectGame}
            icon={<FaTiktok />}
          />
          <GameCard
            gameType="quiz"
            title="Quiz"
            description="Testez vos connaissances sur divers thèmes."
            onSelect={selectGame}
            icon={<FaQuestionCircle />}
          />
          <GameCard
            gameType="truthOrDare"
            title="Action/Vérité"
            description="Relevez des défis ou dites la vérité."
            onSelect={selectGame}
            icon={<FaPlay />}
          />
        </div>
        <p className="mt-2 text-sm">Jeu sélectionné : <span className="text-primary font-semibold">{selectedGame}</span></p>
      </div>
      {/* Panneau droit: Chat */}
      <div className="md:w-1/4 h-full flex flex-col">
        <Chat socket={socket} roomCode={roomCode} username={''} />
      </div>
    </div>
  );
}