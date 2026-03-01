'use client';
import { useState } from 'react';

export default function CodebreakerBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const [guess, setGuess] = useState(['', '', '', '']); // 4 digits

    const myHistory = state.histories[userId] || [];

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return; // Only allow digits

        const newGuess = [...guess];
        newGuess[index] = value;
        setGuess(newGuess);

        // Auto focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`digit-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !guess[index] && index > 0) {
            const prevInput = document.getElementById(`digit-${index - 1}`);
            if (prevInput) prevInput.focus();
        } else if (e.key === 'Enter') {
            submitGuess();
        }
    };

    const submitGuess = () => {
        const fullGuess = guess.join('');
        if (fullGuess.length !== 4) return;

        // Prevent duplicate guesses if already in history (optional UI check)
        if (myHistory.some((h: any) => h.guess === fullGuess)) {
            alert('You already guessed that!');
            return;
        }

        onAction({ type: 'guess', guess: fullGuess });
        setGuess(['', '', '', '']);
        document.getElementById('digit-0')?.focus();
    };

    return (
        <div className="w-full flex flex-col md:flex-row gap-6 p-4">

            {/* Left: Input & Mechanics */}
            <div className="flex-1 bg-[#121c2c] rounded-xl border-2 border-green-500/30 p-8 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <div className="mb-8 text-center">
                    <h2 className="text-4xl font-black text-green-400 tracking-widest uppercase mb-2">Vault Terminal</h2>
                    <p className="text-gray-400 text-sm">Crack the 4-digit code. Digits do not repeat.</p>
                </div>

                {state.lastEvent && (
                    <div className="w-full bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-8 text-center animate-pulse">
                        {state.lastEvent}
                    </div>
                )}

                <div className="flex gap-4 mb-8">
                    {guess.map((digit, i) => (
                        <input
                            key={i}
                            id={`digit-${i}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-16 h-20 text-center text-4xl font-black bg-black border-2 border-green-500/40 text-green-400 rounded-lg focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all"
                            disabled={state.status !== 'playing'}
                        />
                    ))}
                </div>

                <button
                    onClick={submitGuess}
                    disabled={guess.join('').length !== 4 || state.status !== 'playing'}
                    className="w-full max-w-sm bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-xl py-4 rounded-xl uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:shadow-none"
                >
                    Submit Guess
                </button>

                {/* Competitor Progress */}
                {state.players.length > 1 && (
                    <div className="w-full max-w-sm mt-8 p-4 bg-black/40 rounded-xl border border-green-500/20">
                        <h3 className="text-sm text-green-500/80 font-bold uppercase tracking-widest mb-3 border-b border-green-500/20 pb-2 flex items-center gap-2">🌐 Live Competitor Tracking</h3>
                        {state.players.filter((p: any) => p.id !== userId).map((p: any) => {
                            const pHist = state.histories[p.id] || [];
                            const last = pHist[pHist.length - 1];
                            return (
                                <div key={p.id} className="flex justify-between items-center py-2 text-sm border-b border-gray-800 last:border-0">
                                    <span className="text-gray-300 font-bold">{p.username}</span>
                                    <div className="flex gap-3 text-gray-500">
                                        <span className="font-mono text-xs mt-0.5">{pHist.length} calls</span>
                                        {last && (
                                            <span className="flex gap-2 font-mono">
                                                <span className="text-red-400">🐂 {last.bulls}</span>
                                                <span className="text-yellow-500">🐄 {last.cows}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right: History Log */}
            <div className="w-full md:w-96 bg-[#0a0f1e] rounded-xl border border-gray-800 flex flex-col h-[600px]">
                <div className="p-4 bg-[#121c2c] border-b border-gray-800 rounded-t-xl text-center">
                    <h3 className="font-bold text-white uppercase tracking-wider">Your Hack Log</h3>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {myHistory.map((h: any, i: number) => (
                        <div key={i} className="bg-[#1e293b] p-3 rounded-lg flex justify-between items-center border border-gray-700">
                            <span className="text-2xl font-mono font-bold text-white tracking-widest">{h.guess}</span>
                            <div className="flex gap-2">
                                <span className="bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-1 rounded text-sm font-bold flex items-center gap-1" title="Bulls: Correct digit & Correct place">
                                    🐂 {h.bulls}
                                </span>
                                <span className="bg-yellow-900/50 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded text-sm font-bold flex items-center gap-1" title="Cows: Correct digit, Wrong place">
                                    🐄 {h.cows}
                                </span>
                            </div>
                        </div>
                    ))}

                    {myHistory.length === 0 && (
                        <div className="text-center text-gray-500 text-sm mt-10">
                            Initialing system...<br />Awaiting first input.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
