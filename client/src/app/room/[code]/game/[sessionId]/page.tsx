'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { socket } from '@/lib/socket';
import TicTacToeBoard from '@/components/games/TicTacToeBoard';
import QuizBoard from '@/components/games/QuizBoard';
import ScribbleBoard from '@/components/games/ScribbleBoard';
import UnoBoard from '@/components/games/UnoBoard';
import HaxballBoard from '@/components/games/HaxballBoard';
import MemoryBoard from '@/components/games/MemoryBoard';
import Connect4Board from '@/components/games/Connect4Board';
import ChessBoard from '@/components/games/ChessBoard';
import CodebreakerBoard from '@/components/games/CodebreakerBoard';
import LudoBoard from '@/components/games/LudoBoard';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GameRoom({ params }: { params: { code: string, sessionId: string } }) {
    const { code, sessionId } = params;
    const { user, isAuthLoaded } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    let gameType = searchParams.get('type');
    if (typeof window !== 'undefined') {
        gameType = new URLSearchParams(window.location.search).get('type') || gameType;
    }

    const [gameState, setGameState] = useState<any>(null);
    const [gameResult, setGameResult] = useState<any>(null);
    const [ownerId, setOwnerId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOwner = async () => {
            const { data } = await supabase.from('rooms').select('owner_id').eq('code', code.toUpperCase()).single();
            if (data) setOwnerId(data.owner_id);
        };
        fetchOwner();
    }, [code]);

    useEffect(() => {
        if (isAuthLoaded && !user) { router.push('/login'); return; }
        if (!isAuthLoaded || !user) return;
        if (!socket.connected) socket.connect();

        const handleState = ({ sessionId: sId, state }: any) => {
            if (sId === sessionId) setGameState(state);
        };

        const handleEnd = (result: any) => {
            if (result.sessionId === sessionId) setGameResult(result);
        };

        const handleError = (msg: string) => {
            // Only redirect if the error is fatal (session missing). Ignore action validation errors (like "Not your turn")
            if (msg.includes('Session not found') || msg.includes('ended') || msg.includes('Unknown')) {
                router.replace(`/room/${code.toUpperCase()}?game=${gameType || 'TicTacToe'}`);
            } else {
                console.warn("Game Action Warning:", msg);
            }
        };

        socket.on('game:state', handleState);
        socket.on('game:end', handleEnd);
        socket.on('error', handleError);

        // Fetch state when mounting
        socket.emit('game:join', { sessionId });

        return () => {
            socket.off('game:state', handleState);
            socket.off('game:end', handleEnd);
            socket.off('error', handleError);
        };
    }, [sessionId, user, router]);

    const handleAction = (action: any) => {
        socket.emit('game:action', { roomCode: code.toUpperCase(), sessionId, action, playerId: user?.id });
    };

    const handleLeaveGame = () => {
        if (window.confirm("Are you sure you want to leave? This will end the game for everyone.")) {
            socket.emit('game:leave', { sessionId, playerId: user?.id, roomCode: code.toUpperCase() });
            router.replace(`/room/${code.toUpperCase()}?game=${gameType || 'TicTacToe'}`);
        }
    };

    if (!isAuthLoaded || !user) return <div className="text-center mt-20 text-gray-400">Verifying session...</div>;

    if (gameResult) {
        const winnerNames = gameResult.winners?.map((id: string) => gameState?.players?.find((p: any) => p.id === id)?.username || id).join(', ');
        return (
            <div className="max-w-2xl mx-auto mt-10 sm:mt-20 p-6 sm:p-8 text-center bg-[#0a0f1e]/90 rounded-2xl border border-[#cd9a46]/30 shadow-2xl mx-4 sm:mx-auto">
                <Trophy size={60} className="mx-auto text-[#cd9a46] mb-6 animate-bounce" />
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tighter uppercase drop-shadow-md">Game Over</h2>
                <div className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white mb-8 p-3 bg-black/40 rounded-lg inline-block shadow-inner border border-gray-800">
                    Winner(s): <span className="text-[#cd9a46]">{winnerNames || 'None (Draw?)'}</span>
                </div>
                <div>
                    <button
                        onClick={() => router.replace(`/room/${code.toUpperCase()}?game=${gameType || 'TicTacToe'}`)}
                        className="bg-gradient-to-r from-[#cd9a46] to-yellow-600 text-[#05080f] px-6 sm:px-8 py-3 rounded-xl font-black hover:scale-105 hover:shadow-[0_0_20px_rgba(205,154,70,0.4)] transition-all uppercase tracking-widest w-full sm:w-auto"
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        );
    }

    if (!gameState) return <div className="text-center mt-20 text-gray-400">Chargement du jeu...</div>;

    return (
        <div className={`mx-auto mt-4 sm:mt-6 transition-all px-2 sm:px-4 ${gameType === 'Ludo' ? 'max-w-7xl' : 'max-w-4xl'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-white border-l-4 border-[#cd9a46] pl-3 uppercase tracking-wider drop-shadow-md w-full sm:w-auto">Match: <span className="text-[#cd9a46]">{gameType}</span></h2>
                <div className="flex gap-2 sm:gap-4 items-center w-full sm:w-auto justify-end">
                    <span className="hidden md:inline-block bg-[#0a0f1e]/80 px-4 py-1.5 rounded-full text-xs text-gray-400 border border-gray-800 cursor-default shadow-inner">ID: {sessionId.substring(0, 8)}</span>
                    <button onClick={handleLeaveGame} className="bg-gradient-to-r from-red-900/60 to-red-800/60 hover:from-red-600 hover:to-red-700 text-red-100 hover:text-white px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full font-bold border border-red-700/50 hover:border-red-500 shadow-md transition-all hover:scale-105">
                        Leave Game
                    </button>
                </div>
            </div>

            <div className="bg-[#0a0f1e] rounded-xl sm:rounded-2xl border border-gray-800/80 p-1 sm:p-2 md:p-6 min-h-[400px] sm:min-h-[600px] flex items-center justify-center shadow-2xl overflow-hidden relative">
                {gameType === 'TicTacToe' && <TicTacToeBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Quiz' && <QuizBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Scribble' && <ScribbleBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Uno' && <UnoBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Haxball' && <HaxballBoard state={gameState} onAction={handleAction} userId={user.id} ownerId={ownerId || ''} />}
                {gameType === 'Memory' && <MemoryBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Connect4' && <Connect4Board state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Chess' && <ChessBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Codebreaker' && <CodebreakerBoard state={gameState} onAction={handleAction} userId={user.id} />}
                {gameType === 'Ludo' && <LudoBoard state={gameState} onAction={handleAction} userId={user.id} />}
            </div>
        </div>
    );
}
