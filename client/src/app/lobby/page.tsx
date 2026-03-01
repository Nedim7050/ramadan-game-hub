'use client';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { socket } from '@/lib/socket';
import BackButton from '@/components/BackButton';

export default function Lobby() {
    const { user } = useStore();
    const router = useRouter();
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        if (user === null) router.push('/login');
        if (!socket.connected) {
            socket.connect();
        }
    }, [user]);

    const createRoom = async (gameId: string) => {
        if (!user) return;
        const code = 'RAM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const { error } = await supabase.from('rooms').insert([{ code, owner_id: user.id }]);
        if (error) return alert("Error: " + error.message);

        // Force a hard navigation to bypass Next.js Vercel soft-router stripping the query params
        window.location.href = `/room/${code}?game=${gameId}`;
    };

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.trim()) {
            router.push(`/room/${joinCode.trim().toUpperCase()}`);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto mt-6 sm:mt-10 p-4 sm:p-8 text-center bg-[#0a0f1e]/90 rounded-2xl border border-[#cd9a46]/30 shadow-2xl mx-4 sm:mx-auto">
            <div className="flex justify-between items-start mb-6 sm:mb-8">
                <BackButton href="/login" />
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-widest mx-auto drop-shadow-md">Lobby</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-5 sm:p-6 bg-[#05080f]/80 rounded-xl border border-gray-800 hover:border-[#cd9a46]/50 transition-all shadow-inner">
                    <h3 className="text-lg sm:text-xl text-[#cd9a46] font-bold mb-3 sm:mb-4 drop-shadow">Join a Room</h3>
                    <p className="text-gray-400 text-sm mb-6">Got an invite code? Enter it below.</p>
                    <form onSubmit={joinRoom} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="RAM-XXXX"
                            className="flex-1 w-full bg-[#0a0f1e] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#cd9a46] uppercase"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                        />
                        <button type="submit" className="bg-gray-800 text-white font-bold px-6 py-2 rounded hover:bg-gray-700 transition-colors">
                            Go
                        </button>
                    </form>
                </div>

                {/* Secret or Dare Card */}
                <div className="p-5 sm:p-6 bg-[#1a0f1a]/80 rounded-xl border border-purple-900/50 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-inner">
                    <div>
                        <h3 className="text-lg sm:text-xl text-purple-400 font-bold mb-3 sm:mb-4 drop-shadow">🤫 Secret Box</h3>
                        <p className="text-gray-400 text-sm mb-6">Send an anonymous dare or secret message!</p>
                    </div>
                    <button onClick={() => router.push('/dare-gossip')} className="w-full bg-purple-900/50 border border-purple-500 text-purple-200 font-bold py-3 rounded hover:bg-purple-800/80 transition-opacity">
                        Enter Secret
                    </button>
                </div>
            </div>

            <div className="mt-10 mb-6 flex items-center gap-2 sm:gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[#cd9a46]/50 to-transparent flex-1"></div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase truncate drop-shadow-md">Select Game</h3>
                <div className="h-px bg-gradient-to-r from-transparent via-[#cd9a46]/50 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { id: 'TicTacToe', name: 'XO', color: 'bg-blue-900/40 border-blue-500/50 hover:border-blue-400 hover:bg-blue-900/60', icon: '❌⭕' },
                    { id: 'Quiz', name: 'Quiz', color: 'bg-purple-900/40 border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/60', icon: '🧠' },
                    { id: 'Scribble', name: 'Scribble', color: 'bg-orange-900/40 border-orange-500/50 hover:border-orange-400 hover:bg-orange-900/60', icon: '✏️' },
                    { id: 'Uno', name: 'UNO', color: 'bg-red-900/40 border-red-500/50 hover:border-red-400 hover:bg-red-900/60', icon: '🎴' },
                    { id: 'Haxball', name: 'Haxball', color: 'bg-teal-900/40 border-teal-500/50 hover:border-teal-400 hover:bg-teal-900/60', icon: '⚽' },
                    { id: 'Memory', name: 'Memory', color: 'bg-indigo-900/40 border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/60', icon: '🧩' },
                    { id: 'Connect4', name: 'Connect 4', color: 'bg-cyan-900/40 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-900/60', icon: '🔵' },
                    { id: 'Chess', name: 'Chess', color: 'bg-stone-900/40 border-stone-500/50 hover:border-stone-400 hover:bg-stone-900/60', icon: '♟️' },
                    { id: 'Codebreaker', name: 'Codebreaker', color: 'bg-green-900/40 border-green-500/50 hover:border-green-400 hover:bg-green-900/60', icon: '🕵️‍♂️' },
                    { id: 'Ludo', name: 'Ludo', color: 'bg-pink-900/40 border-pink-500/50 hover:border-pink-400 hover:bg-pink-900/60', icon: '🎲' }
                ].map((g) => (
                    <button
                        key={g.id}
                        onClick={() => createRoom(g.id)}
                        className={`group relative overflow-hidden rounded-xl border-2 transition-all p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 ${g.color} shadow-lg`}
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-4xl sm:text-5xl filter drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300">{g.icon}</span>
                        <span className="font-bold text-white text-sm sm:text-lg tracking-wide drop-shadow">{g.name}</span>
                        <div className="absolute bottom-0 left-0 w-full bg-black/80 py-1 sm:py-1.5 text-[10px] sm:text-xs text-[#cd9a46] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0 backdrop-blur-sm">
                            Host Match
                        </div>
                    </button>
                ))}
            </div>
        </div >
    );
}
