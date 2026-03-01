"use client";

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface XOGameProps {
  socket: Socket | null;
  roomCode: string;
  sessionId: string;
}

/**
 * Composant de jeu Tic‑Tac‑Toe.  Affiche une grille 3×3 et permet de placer un
 * symbole en cliquant sur une case.  L’état est maintenu par le serveur ;
 * chaque clic émet un évènement `game:action` avec les coordonnées.
 */
export default function XOGame({ socket, roomCode, sessionId }: XOGameProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!socket) return;
    function onGameState(payload: { state: any }) {
      setBoard(payload.state.board);
      setStatus(payload.state.status);
    }
    function onGameEnd(payload: { winners: string[]; pointsDelta: any }) {
      setStatus('Partie terminée');
    }
    socket.on('game:state', onGameState);
    socket.on('game:end', onGameEnd);
    // rejoindre la session
    socket.emit('game:join', { roomCode, sessionId });
    return () => {
      socket.off('game:state', onGameState);
      socket.off('game:end', onGameEnd);
    };
  }, [socket, roomCode, sessionId]);

  function handleClick(index: number) {
    if (!socket) return;
    socket.emit('game:action', { roomCode, sessionId, action: { index } });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-primary">Tic‑Tac‑Toe</h2>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            className="w-20 h-20 bg-gray-700 flex items-center justify-center text-3xl font-bold text-primary border border-gray-600"
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="mt-2">{status}</p>
    </div>
  );
}