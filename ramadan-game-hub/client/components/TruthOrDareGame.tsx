"use client";

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface TruthOrDareGameProps {
  socket: Socket | null;
  roomCode: string;
  sessionId: string;
}

/**
 * Composant pour le jeu Action/Vérité.  Les joueurs choisissent une carte
 * Action ou Vérité, puis valident leur tour.  La logique détaillée se trouve
 * côté serveur.
 */
export default function TruthOrDareGame({ socket, roomCode, sessionId }: TruthOrDareGameProps) {
  const [card, setCard] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (!socket) return;
    function onState(payload: { state: any }) {
      setCard(payload.state.currentCard);
      setIsMyTurn(payload.state.isMyTurn);
    }
    socket.on('game:state', onState);
    socket.emit('game:join', { roomCode, sessionId });
    return () => {
      socket.off('game:state', onState);
    };
  }, [socket, roomCode, sessionId]);

  function draw(type: 'truth' | 'dare') {
    if (!socket || !isMyTurn) return;
    socket.emit('game:action', { roomCode, sessionId, action: { draw: type } });
  }

  function done() {
    if (!socket || !isMyTurn) return;
    socket.emit('game:action', { roomCode, sessionId, action: { done: true } });
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold text-primary mb-2">Action / Vérité</h2>
      {card ? (
        <div className="bg-gray-700 p-4 rounded mb-2 text-center max-w-md">
          {card}
        </div>
      ) : (
        <p className="mb-2">Choisissez une option :</p>
      )}
      {isMyTurn && !card && (
        <div className="flex gap-4 mb-2">
          <button onClick={() => draw('truth')} className="bg-accent text-white px-4 py-2 rounded hover:bg-primary">
            Vérité
          </button>
          <button onClick={() => draw('dare')} className="bg-accent text-white px-4 py-2 rounded hover:bg-primary">
            Action
          </button>
        </div>
      )}
      {isMyTurn && card && (
        <button onClick={done} className="bg-accent text-white px-4 py-2 rounded hover:bg-primary">
          Terminé
        </button>
      )}
    </div>
  );
}