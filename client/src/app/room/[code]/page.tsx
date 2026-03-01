'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { socket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import { Send, Play, Users, CheckCircle, Info } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default function Room({ params }: { params: { code: string } }) {
    const code = decodeURIComponent(params.code).trim().toUpperCase();
    const { user, isAuthLoaded } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameQueryParam = searchParams.get('game');

    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [playersInRoom, setPlayersInRoom] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [selectedGame, setSelectedGame] = useState('TicTacToe');
    const [quizThemeIndex, setQuizThemeIndex] = useState(0);

    useEffect(() => {
        if (isAuthLoaded && !user) {
            router.push('/login');
            return;
        }
        if (!isAuthLoaded || !user) return;

        const fetchOwner = async () => {
            const { data, error } = await supabase.from('rooms').select('owner_id').eq('code', code).single();
            if (data) {
                setOwnerId(data.owner_id);
            }
        };
        fetchOwner();

        if (!socket.connected) socket.connect();

        // Immediately pull directly from window to bypass Next.js Vercel static hydration stripping race conditions
        const actualGameIntent = new URLSearchParams(window.location.search).get('game') || gameQueryParam;

        // Rejoin the room if the component remounts, passing the URL intent
        socket.emit('room:join', { roomCode: code, user, gameId: actualGameIntent });

        const handleChat = (msg: any) => setMessages(prev => [...prev, msg]);
        const handleGameStart = ({ sessionId, gameType }: any) => {
            router.push(`/room/${code}/game/${sessionId}?type=${gameType}`);
        };

        const handleRoomState = ({ members, selectedGame: sGame }: any) => {
            setPlayersInRoom(members);
            if (sGame) setSelectedGame(sGame);
        };

        const handleDestroy = (msg: string) => {
            alert(msg);
            router.push('/lobby');
        };

        const handleError = (msg: string) => {
            alert(msg);
            router.push('/lobby');
        };

        const handleGameSelect = (gameId: string) => setSelectedGame(gameId);

        socket.on('room:chat', handleChat);
        socket.on('game:start', handleGameStart);
        socket.on('room:state', handleRoomState);
        socket.on('room:destroyed', handleDestroy);
        socket.on('room:error', handleError);
        socket.on('room:game:select', handleGameSelect);

        const currentUserId = user.id;

        return () => {
            socket.emit('room:leave', { roomCode: code, userId: currentUserId });
            socket.off('room:chat', handleChat);
            socket.off('game:start', handleGameStart);
            socket.off('room:state', handleRoomState);
            socket.off('room:destroyed', handleDestroy);
            socket.off('room:error', handleError);
            socket.off('room:game:select', handleGameSelect);
        };
    }, [user, code, router]);

    const isOwner = user?.id === ownerId;

    const gameDefinitions: Record<string, { name: string, icon: string, min: number, max: number, desc: string }> = {
        'TicTacToe': { name: 'XO', icon: '❌⭕', min: 2, max: 2, desc: "Classic: Align 3 identical symbols (horizontal, vertical, or diagonal) before your opponent to win." },
        'Quiz': { name: 'Quiz', icon: '🧠', min: 2, max: 99, desc: "Knowledge Test: Answer the questions as quickly as possible. A theme will be chosen randomly. The fastest wins maximum points." },
        'Scribble': { name: 'Scribble', icon: '✏️', min: 2, max: 99, desc: "Draw and Guess: Take turns drawing a word while others guess it in the chat as fast as possible!" },
        'Uno': { name: 'UNO', icon: '🎴', min: 2, max: 10, desc: "UNO: Match the color or number of the top card. Use action cards to disrupt your opponents. First to empty their hand wins!" },
        'Haxball': { name: 'Haxball', icon: '⚽', min: 2, max: 4, desc: "2D Physics Soccer: Use WASD/Arrows to move and Spacebar to kick the ball into the opponent's net!" },
        'Memory': { name: 'Memory', icon: '🧩', min: 2, max: 99, desc: "Memory Game: Flip cards to find matching pairs. Find consecutive pairs to earn points quickly. The player with the most pairs wins!" },
        'Connect4': { name: 'Connect 4', icon: '🔵', min: 2, max: 2, desc: "Connect 4: Drop your colored discs into the grid. The first player to form a horizontal, vertical, or diagonal line of 4 discs wins!" },
        'Chess': { name: 'Chess', icon: '♟️', min: 2, max: 2, desc: "Classic Chess: The ultimate game of strategy. Checkmate your opponent's king to win." },
        'Codebreaker': { name: 'Codebreaker', icon: '🕵️‍♂️', min: 2, max: 99, desc: "Codebreaker: Be the first to crack the randomly generated 4-digit code using logic and deductions!" },
        'Ludo': { name: 'Ludo', icon: '🎲', min: 2, max: 4, desc: "Ludo: Race your 4 tokens from start to finish according to die rolls. Capture opponents and secure your tokens in safe zones!" }
    };

    const currentGameDef = gameDefinitions[selectedGame] || gameDefinitions['TicTacToe'];
    const pCount = playersInRoom.length;
    const canStart = pCount >= currentGameDef.min && pCount <= currentGameDef.max;

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;
        socket.emit('room:chat:send', { roomCode: code, sender: user.username, message: input });
        setInput('');
    };

    const startGame = () => {
        if (!canStart) {
            alert(`This game requires between ${currentGameDef.min} and ${currentGameDef.max} players.`);
            return;
        }
        // Now pass the actual players in room to the engine
        socket.emit('game:start', {
            roomCode: code,
            gameType: selectedGame,
            players: playersInRoom,
            settings: { themeIndex: quizThemeIndex }
        });
    };

    if (!user) return null;

    // Prevent flashing UI if joining a full room and waiting for server rejection
    if (playersInRoom.length > 0 && !playersInRoom.some(p => p.id === user.id)) {
        return <div className="flex items-center justify-center min-h-[50vh] text-2xl font-bold text-gray-400 animate-pulse">Joining Room...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto mt-4 sm:mt-6 p-4 sm:p-6 grid lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Left Panel: Settings & Players */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <BackButton href="/lobby" />
                <div className="bg-[#0a0f1e] rounded-xl p-4 sm:p-6 border border-[#cd9a46]/30 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            Room <span className="text-[#cd9a46]">{code}</span>
                        </h2>
                        <button
                            onClick={() => setIsReady(!isReady)}
                            className={`px-4 py-2 rounded font-bold flex gap-2 items-center transition-colors ${isReady ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                        >
                            <CheckCircle size={18} /> {isReady ? 'Ready' : 'Not Ready'}
                        </button>
                    </div>

                    <h3 className="text-xl text-white font-semibold mb-4 border-b border-gray-800 pb-2">Players in Room</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {playersInRoom.length === 0 ? <span className="text-gray-500 italic">No one here yet...</span> : playersInRoom.map(p => (
                            <div key={p.id} className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
                                <span className={`w-2 h-2 rounded-full ${p.id === ownerId ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></span>
                                {p.username} {p.id === ownerId && <span className="text-yellow-500 text-xs ml-1">(Owner)</span>}
                            </div>
                        ))}
                    </div>

                    <h3 className="text-lg sm:text-xl text-white font-semibold mb-3 sm:mb-4 border-b border-gray-800 pb-2">Active Game</h3>
                    <div className="bg-[#05080f] rounded-xl border-2 border-[#cd9a46] p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col items-center justify-center gap-3 sm:gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(205,154,70,0.15)]">
                        <div className="absolute inset-0 bg-[#cd9a46]/5 pointer-events-none"></div>
                        <div className="text-5xl sm:text-6xl filter drop-shadow-md">{currentGameDef.icon}</div>
                        <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest uppercase text-center">{currentGameDef.name}</h4>

                        <div className="flex gap-4 mt-2">
                            <span className="bg-[#cd9a46]/20 border border-[#cd9a46]/50 text-[#cd9a46] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Users size={14} /> {currentGameDef.min} - {currentGameDef.max === 99 ? '∞' : currentGameDef.max} Players
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#05080f] border border-gray-800 rounded-xl p-4 mb-6 relative hover:border-gray-600 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Info size={100} />
                        </div>
                        <h4 className="text-[#cd9a46] font-bold mb-2 flex items-center gap-2 relative z-10">
                            <span className="text-xl">ℹ️</span> Instructions
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed relative z-10 font-medium">
                            {currentGameDef.desc}
                        </p>
                    </div>

                    {selectedGame === 'Quiz' && isOwner && (
                        <div className="bg-[#05080f] border border-purple-900/50 rounded-xl p-4 mb-6 flex flex-col gap-2">
                            <label className="text-purple-400 font-bold">🎯 Select a Theme:</label>
                            <select
                                value={quizThemeIndex}
                                onChange={e => setQuizThemeIndex(parseInt(e.target.value))}
                                className="w-full bg-[#0a0f1e] text-white border border-gray-700 rounded p-2 focus:border-purple-500 outline-none"
                            >
                                {[
                                    "African Countries starting with M", "Planets", "Colors of the Rainbow", "Islamic Months",
                                    "Continents", "World Cup Winners", "Chinese Zodiac", "Zodiac Signs",
                                    "Wonders of the Ancient World", "Maghreb Capitals", "World Oceans", "Countries bordering Tunisia",
                                    "The 5 Pillars of Islam", "Major Prophets", "Major Tunisian Cities", "Seasons of the Year",
                                    "Chess Pieces", "Fingers of the Hand", "Members of the Beatles", "Southern European Capitals",
                                    "Harry Potter Hogwarts Houses", "Primary Colors", "Types of Pasta", "Planets with Rings",
                                    "G7 Countries", "Noble Gases", "Months with 31 Days", "Fast Food Chains",
                                    "European Countries starting with S", "Largest Countries by Area"
                                ].map((t, i) => (
                                    <option key={i} value={i}>{t}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={startGame}
                        disabled={!canStart || !isOwner}
                        className={`w-full font-bold py-4 rounded-xl text-xl flex justify-center items-center gap-3 transition-all ${!canStart || !isOwner
                            ? 'bg-[#0a0f1e] text-gray-500 border-2 border-gray-800 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#cd9a46] to-yellow-600 text-[#05080f] hover:opacity-90 shadow-lg shadow-[#cd9a46]/20'
                            }`}
                    >
                        <Play fill="currentColor" />
                        {!isOwner
                            ? 'WAITING FOR OWNER...'
                            : !canStart
                                ? `WAITING FOR PLAYERS (${pCount}/${currentGameDef.min}-${currentGameDef.max === 99 ? '∞' : currentGameDef.max})`
                                : 'START GAME'
                        }
                    </button>
                </div>
            </div>
            {/* Right Panel: Chat */}
            <div className="bg-[#0a0f1e] rounded-xl border border-[#cd9a46]/30 flex flex-col h-[400px] lg:h-[600px] shadow-2xl">
                <div className="p-3 sm:p-4 border-b border-gray-800 bg-[#05080f] rounded-t-xl flex items-center gap-2">
                    <Users className="text-[#cd9a46]" />
                    <h3 className="text-white font-bold">Room Chat</h3>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.sender === user?.username ? 'items-end' : m.sender === 'System' ? 'items-center' : 'items-start'}`}>
                            {m.sender !== 'System' && <span className="text-xs text-gray-500 mb-1">{m.sender}</span>}
                            <div className={`px-4 py-2 max-w-[80%] ${m.sender === user?.username ? 'bg-[#cd9a46] text-[#05080f] rounded-2xl rounded-tr-sm' : m.sender === 'System' ? 'bg-transparent border border-gray-800 text-gray-400 text-sm rounded-full w-full text-center italic' : 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm'}`}>
                                {m.message}
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-2">
                    <input
                        type="text"
                        placeholder="Message..."
                        className="flex-1 bg-[#05080f] border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-[#cd9a46]"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button type="submit" className="bg-[#cd9a46] text-[#0a0f1e] p-2 rounded-full hover:bg-opacity-90">
                        <Send size={20} />
                    </button>
                </form>
            </div>

        </div >
    );
}
