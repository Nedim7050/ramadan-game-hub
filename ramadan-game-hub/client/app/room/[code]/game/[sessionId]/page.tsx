"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../../lib/useSocket';
import XOGame from '../../../../components/XOGame';
import QuizGame from '../../../../components/QuizGame';
import TruthOrDareGame from '../../../../components/TruthOrDareGame';

/**
 * Page de jeu dédiée à une session donnée.  Sélectionne le composant de jeu
 * en fonction du type envoyé par le serveur.  Si la session n’est pas
 * trouvée, on redirige vers le lobby.
 */
export default function GameSessionPage() {
  const params = useParams<{ code: string; sessionId: string }>();
  const roomCode = params.code as string;
  const sessionId = params.sessionId as string;
  const socket = useSocket();
  const router = useRouter();
  const [gameType, setGameType] = useState<string>('');

  useEffect(() => {
    if (!socket) return;
    // Écoute pour connaître le type de jeu de cette session
    function onState(payload: { state: any }) {
      setGameType(payload.state.gameType);
    }
    function onEnd() {
      // retourner à la room à la fin du jeu
      router.push(`/room/${roomCode}`);
    }
    socket.on('game:state', onState);
    socket.on('game:end', onEnd);
    // rejoindre la partie immédiatement pour obtenir l’état initial
    socket.emit('game:join', { roomCode, sessionId });
    return () => {
      socket.off('game:state', onState);
      socket.off('game:end', onEnd);
    };
  }, [socket, roomCode, sessionId, router]);

  let content: JSX.Element | null = null;
  if (!gameType) {
    content = <p>Chargement du jeu…</p>;
  } else if (gameType === 'xo') {
    content = <XOGame socket={socket} roomCode={roomCode} sessionId={sessionId} />;
  } else if (gameType === 'quiz') {
    content = <QuizGame socket={socket} roomCode={roomCode} sessionId={sessionId} />;
  } else if (gameType === 'truthOrDare') {
    content = <TruthOrDareGame socket={socket} roomCode={roomCode} sessionId={sessionId} />;
  } else {
    content = <p>Jeu inconnu : {gameType}</p>;
  }
  return <div>{content}</div>;
}