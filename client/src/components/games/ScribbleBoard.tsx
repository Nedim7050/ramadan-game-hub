'use client';
import { useState, useEffect, useRef } from 'react';
import { Clock, Send } from 'lucide-react';

export default function ScribbleBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawingUI, setIsDrawingUI] = useState(false);
    const [guessInput, setGuessInput] = useState('');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const isDrawer = state.players[state.currentDrawerIndex]?.id === userId;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw all lines from state
        ctx.fillStyle = '#1e293b'; // Slate 800
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        state.lines.forEach((line: any) => {
            ctx.beginPath();
            ctx.moveTo(line.x0, line.y0);
            ctx.lineTo(line.x1, line.y1);
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        });
    }, [state.lines]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isDrawer || state.status !== 'drawing') return;
        setIsDrawingUI(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawingUI || !isDrawer || !lastPos.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const newPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            onAction({ type: 'draw', line: { x0: lastPos.current.x, y0: lastPos.current.y, x1: newPos.x, y1: newPos.y, color, width: brushSize } });
            lastPos.current = newPos;
        }
    };

    const handleMouseUp = () => {
        setIsDrawingUI(false);
        lastPos.current = null;
    };

    const submitGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guessInput.trim()) return;
        onAction({ type: 'guess', guess: guessInput });
        setGuessInput('');
    };

    const hiddenWord = state.hint || '???';

    return (
        <div className="w-full h-[550px] flex gap-4">

            {/* Left Main Field: Canvas & Tools */}
            <div className="flex-1 flex flex-col relative">

                {/* Header */}
                <div className="w-full flex justify-between bg-[#05080f] border border-gray-800 p-4 rounded-xl mb-4 text-white font-bold items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-[#cd9a46]">Round {state.round}/3</span>
                        {isDrawer ? (
                            <span className="text-xl">Draw: <span className="text-yellow-400 font-extrabold">{state.currentWord || '???'}</span></span>
                        ) : (
                            <span className="text-xl tracking-widest">{hiddenWord}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xl">
                        <Clock className={state.timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-[#cd9a46]'} />
                        <span className={state.timeRemaining < 10 ? 'text-red-500' : ''}>{state.timeRemaining}s</span>
                    </div>
                </div>

                {/* Scores */}
                <div className="w-full flex justify-center gap-2 mb-4 shrink-0 overflow-x-auto pb-2">
                    {state.players.map((p: any) => (
                        <div key={p.id} className={`px-4 py-2 rounded-full font-bold border flex gap-2 text-sm whitespace-nowrap ${p.id === state.players[state.currentDrawerIndex]?.id ? 'border-[#cd9a46] bg-[#cd9a46]/20 text-[#cd9a46]' : 'border-gray-700 bg-gray-800 text-white'}`}>
                            {p.id === state.players[state.currentDrawerIndex]?.id && '✏️'} {p.username}: {state.scores[p.id] || 0}
                        </div>
                    ))}
                </div>

                {/* Canvas Container */}
                <div className="flex-1 relative flex flex-col min-h-0">

                    {state.status === 'choosing' && (
                        <div className="absolute z-10 bg-[#0a0f1e]/90 w-full h-full flex flex-col items-center justify-center top-0 left-0 rounded-xl backdrop-blur-sm shadow-inner overflow-hidden">
                            {isDrawer ? (
                                <>
                                    <h2 className="text-3xl text-white font-bold mb-8">Choose a word</h2>
                                    <div className="flex gap-4">
                                        {state.wordChoices.map((w: string) => (
                                            <button key={w} onClick={() => onAction({ type: 'choose_word', word: w })} className="bg-[#cd9a46] text-[#05080f] font-bold text-xl px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                                                {w}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <h2 className="text-2xl text-white font-bold text-center px-4">{state.players[state.currentDrawerIndex]?.username} is choosing a word...</h2>
                            )}
                        </div>
                    )}

                    {state.status === 'finished' && (
                        <div className="absolute z-20 bg-[#05080f]/95 w-full h-full flex flex-col items-center justify-center top-0 left-0 rounded-xl backdrop-blur-md">
                            <h2 className="text-4xl text-[#cd9a46] font-extrabold mb-8 tracking-widest uppercase">Final Rankings</h2>
                            <div className="flex flex-col gap-4 w-full max-w-md">
                                {Object.entries(state.scores)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([id, score], i) => {
                                        const p = state.players.find((p: any) => p.id === id);
                                        return (
                                            <div key={id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-[#cd9a46]/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-bold text-gray-400">#{i + 1}</span>
                                                    <span className="text-xl text-white font-bold">{p?.username}</span>
                                                </div>
                                                <span className="text-2xl text-[#cd9a46] font-extrabold">{String(score)} pts</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    <div className={`w-full h-full flex flex-col items-center border-2 border-gray-700 rounded-xl bg-slate-800 overflow-hidden ${isDrawer && state.status === 'drawing' ? 'cursor-crosshair shadow-[#cd9a46]/20 shadow-[0_0_15px]' : ''}`}>
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={400}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="w-full h-full object-contain pointer-events-auto"
                        />
                    </div>

                    {/* Tools for drawer */}
                    {isDrawer && state.status === 'drawing' && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-[#05080f] p-3 rounded-lg border border-gray-800 shadow-xl z-20">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none bg-transparent" />
                            <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="cursor-pointer" />
                            <button onClick={() => onAction({ type: 'clear' })} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-500">Clear</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Chat Panel */}
            <div className="w-80 bg-[#0a0f1e] border border-gray-800 rounded-xl flex flex-col h-full shadow-2xl shrink-0 overflow-hidden">
                <div className="p-4 border-b border-gray-800 font-bold text-[#cd9a46]">Chat & Guesses</div>

                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
                    {state.chat?.map((msg: any, i: number) => (
                        <div key={i} className={`p-2 rounded text-sm break-words ${msg.color === 'system' ? 'bg-[#cd9a46]/10 text-[#cd9a46] italic text-center text-xs my-1' :
                            msg.color === 'green' ? 'bg-green-900/40 text-green-400 font-bold' :
                                msg.color === 'yellow' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-900/50' :
                                    msg.color === 'red' ? 'text-gray-400 line-through' : 'text-gray-300'
                            }`}>
                            {msg.senderId !== 'system' && <span className="font-bold mr-2 opacity-60 text-xs">{msg.senderName}:</span>}
                            <span>{msg.text}</span>
                        </div>
                    ))}
                    {(!state.chat || state.chat.length === 0) && (
                        <div className="text-gray-600 text-sm text-center italic mt-10">Game chat...</div>
                    )}
                </div>

                {!isDrawer && state.status === 'drawing' && !state.guessedPlayers?.includes(userId) && (
                    <form onSubmit={submitGuess} className="p-3 border-t border-gray-800 flex gap-2 bg-[#05080f]">
                        <input
                            type="text"
                            placeholder="Guess..."
                            value={guessInput}
                            onChange={e => setGuessInput(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#cd9a46] text-sm"
                        />
                        <button type="submit" className="bg-[#cd9a46] text-[#05080f] px-3 py-2 rounded-lg hover:bg-opacity-90"><Send size={18} /></button>
                    </form>
                )}
                {!isDrawer && state.guessedPlayers?.includes(userId) && (
                    <div className="p-3 border-t border-gray-800 bg-green-900/20 text-green-500 font-bold text-center text-sm">
                        You got it!
                    </div>
                )}
            </div>

        </div>
    );
}
