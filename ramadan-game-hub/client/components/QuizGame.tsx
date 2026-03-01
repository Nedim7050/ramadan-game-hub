"use client";

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface QuizGameProps {
  socket: Socket | null;
  roomCode: string;
  sessionId: string;
}

interface QuestionState {
  question: string;
  options: string[];
  timer: number;
  currentIndex: number;
  total: number;
  scoreboard: Record<string, number>;
}

/**
 * Composant pour le jeu de Quiz.  Affiche la question en cours, les choix
 * possibles et un timer.  Les réponses sont envoyées via `game:action`.
 */
export default function QuizGame({ socket, roomCode, sessionId }: QuizGameProps) {
  const [state, setState] = useState<QuestionState | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ winners: string[] } | null>(null);

  useEffect(() => {
    if (!socket) return;
    function onState(payload: { state: any }) {
      setState(payload.state);
      setAnswered(false);
    }
    function onEnd(payload: { winners: string[] }) {
      setResult({ winners: payload.winners });
    }
    socket.on('game:state', onState);
    socket.on('game:end', onEnd);
    socket.emit('game:join', { roomCode, sessionId });
    return () => {
      socket.off('game:state', onState);
      socket.off('game:end', onEnd);
    };
  }, [socket, roomCode, sessionId]);

  function answer(index: number) {
    if (!socket || answered) return;
    setAnswered(true);
    socket.emit('game:action', { roomCode, sessionId, action: { answer: index } });
  }

  if (result) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-primary mb-2">Quiz terminé !</h2>
        <p className="mb-4">Gagnant(s) : {result.winners.join(', ')}</p>
      </div>
    );
  }

  if (!state) return <p>Chargement…</p>;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-2 text-primary">Quiz</h2>
      <p className="mb-1">Question {state.currentIndex + 1} / {state.total}</p>
      <h3 className="font-semibold text-lg mb-4 text-white text-center">{state.question}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-xl">
        {state.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={answered}
            onClick={() => answer(idx)}
            className="bg-gray-700 p-3 rounded hover:bg-primary disabled:opacity-50 text-left"
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm">Temps restant : {state.timer}s</p>
      <div className="mt-4 w-full max-w-md">
        <h4 className="text-primary font-semibold mb-2">Scores</h4>
        <ul>
          {Object.entries(state.scoreboard).map(([user, score]) => (
            <li key={user} className="flex justify-between border-b border-gray-700 py-1">
              <span>{user}</span>
              <span>{score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}