'use client';
import { useState, useEffect } from 'react';
import { Clock, Trophy } from 'lucide-react';

export default function QuizBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const [input, setInput] = useState('');

    const myFound = state.foundAnswers[userId] || [];
    const totalAnswers = state.targetAnswers.length;

    // Auto-submit when the word matches a target
    useEffect(() => {
        const normInput = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        if (state.targetAnswers.includes(normInput) && !myFound.includes(normInput)) {
            onAction({ guess: input });
            setInput(''); // Clear input on success
        }
    }, [input, state.targetAnswers, myFound, onAction]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onAction({ guess: input });
            setInput('');
        }
    };

    return (
        <div className="w-full max-w-4xl text-center flex flex-col items-center p-4">

            <div className="flex flex-col md:flex-row w-full justify-between items-center mb-6 bg-[#05080f] p-4 rounded-xl border border-gray-800">
                <div className="text-left">
                    <h2 className="text-[#cd9a46] font-bold text-sm uppercase tracking-widest">{state.themeName}</h2>
                    <h3 className="text-white text-2xl font-extrabold">{state.prompt}</h3>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 text-2xl font-mono text-white bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                        <Clock className={state.timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-[#cd9a46]'} />
                        <span className={state.timeRemaining < 10 ? 'text-red-500' : ''}>
                            {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center gap-8 mb-8">
                {state.players.map((p: any) => {
                    const count = (state.foundAnswers[p.id] || []).length;
                    return (
                        <div key={p.id} className={`flex items-center gap-3 px-6 py-2 rounded-full border border-gray-800 bg-[#0a0f1e] shadow-lg ${p.id === userId ? 'ring-2 ring-[#cd9a46]' : ''}`}>
                            <div className="font-bold text-white">{p.username}</div>
                            <div className="text-[#cd9a46] font-extrabold text-xl">{count}/{totalAnswers}</div>
                        </div>
                    );
                })}
            </div>

            {state.status === 'playing' ? (
                <div className="w-full max-w-md mb-8">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Tapez votre réponse ici..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#05080f] border-2 border-gray-700 focus:border-[#cd9a46] text-white text-xl px-6 py-4 rounded-full text-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors outline-none"
                    />
                </div>
            ) : (
                <div className="text-2xl font-bold text-red-500 mb-8 animate-bounce">
                    TEMPS ÉCOULÉ !
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {state.displayAnswers.map((ans: string, i: number) => {
                    const normAns = state.targetAnswers[i];
                    const isFound = myFound.includes(normAns);

                    return (
                        <div
                            key={i}
                            className={`flex items-center justify-center p-4 rounded-xl font-bold border-2 transition-all ${isFound
                                    ? 'bg-green-900/40 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                    : state.status === 'finished'
                                        ? 'bg-red-900/40 border-red-500/50 text-red-200'
                                        : 'bg-gray-800/50 border-gray-700 text-transparent select-none'
                                }`}
                        >
                            {isFound || state.status === 'finished' ? ans : '????????'}
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
