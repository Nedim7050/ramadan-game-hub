'use client';
import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function HaxballBoard({ state, onAction, userId, ownerId }: { state: any, onAction: (a: any) => void, userId: string, ownerId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const keys = useRef({ up: false, down: false, left: false, right: false, kick: false });

    // Handle inputs
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            const k = keys.current;
            let changed = false;
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': if (!k.up) { k.up = true; changed = true; } break;
                case 'ArrowDown': case 'KeyS': if (!k.down) { k.down = true; changed = true; } break;
                case 'ArrowLeft': case 'KeyA': if (!k.left) { k.left = true; changed = true; } break;
                case 'ArrowRight': case 'KeyD': if (!k.right) { k.right = true; changed = true; } break;
                case 'Space': if (!k.kick) { k.kick = true; changed = true; } break;
            }
            if (changed) sendInput();
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = keys.current;
            let changed = false;
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': if (k.up) { k.up = false; changed = true; } break;
                case 'ArrowDown': case 'KeyS': if (k.down) { k.down = false; changed = true; } break;
                case 'ArrowLeft': case 'KeyA': if (k.left) { k.left = false; changed = true; } break;
                case 'ArrowRight': case 'KeyD': if (k.right) { k.right = false; changed = true; } break;
                case 'Space': if (k.kick) { k.kick = false; changed = true; } break;
            }
            if (changed) sendInput();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const sendInput = () => {
        const k = keys.current;
        let x = 0; let y = 0;
        if (k.up) y -= 1;
        if (k.down) y += 1;
        if (k.left) x -= 1;
        if (k.right) x += 1;

        // normalize
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        onAction({ input: { x, y, kick: k.kick } });
    };

    // Render Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Field Grass
        ctx.fillStyle = '#166534'; // green-800
        ctx.fillRect(0, 0, 800, 400);

        // Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;

        // Field Borders
        ctx.strokeRect(0, 0, 800, 400);

        // Center circle
        ctx.beginPath();
        ctx.arc(400, 200, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Center line
        ctx.beginPath();
        ctx.moveTo(400, 0); ctx.lineTo(400, 400);
        ctx.stroke();

        // Penalty Boxes
        ctx.strokeRect(0, 80, 120, 240); // Left box
        ctx.strokeRect(680, 80, 120, 240); // Right box

        // Blue Goal (Left)
        ctx.fillStyle = '#1e3a8a'; // dark blue net
        ctx.fillRect(-20, 130, 24, 140);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.strokeRect(-20, 130, 24, 140);

        // Red Goal (Right)
        ctx.fillStyle = '#7f1d1d'; // dark red net
        ctx.fillRect(796, 130, 24, 140);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(796, 130, 24, 140);

        // Players
        Object.values(state.haxPlayers).forEach((hp: any) => {
            ctx.beginPath();
            ctx.arc(hp.pos.x, hp.pos.y, hp.r + (hp.input.kick ? 3 : 0), 0, Math.PI * 2);
            ctx.fillStyle = hp.color;
            ctx.fill();

            // outline
            ctx.lineWidth = hp.input.kick ? 4 : 2;
            ctx.strokeStyle = hp.input.kick ? '#ffffff' : '#000000';
            ctx.stroke();

            // Name
            const pData = state.players.find((p: any) => p.id === hp.id);
            if (pData) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pData.username, hp.pos.x, hp.pos.y - hp.r - 8);
            }
        });

        // Ball
        ctx.beginPath();
        ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (state.status === 'goal') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, 800, 400);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GOAL !', 400, 200);
        }

    }, [state]);

    if (state.status === 'lobby') {
        const bluePlayers = state.players.filter((p: any) => state.teams?.[p.id] === 'blue');
        const redPlayers = state.players.filter((p: any) => state.teams?.[p.id] === 'red');
        const isReady = state.players.every((p: any) => state.teams?.[p.id]);
        const isOwner = userId === ownerId;

        return (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-[#0a0f1e] rounded-xl border border-gray-800 shadow-2xl p-8">
                <h2 className="text-4xl text-white font-black mb-12 uppercase tracking-widest">Team Selection</h2>

                <div className="w-full max-w-4xl grid grid-cols-2 gap-8 mb-12">
                    {/* Blue Team */}
                    <div className="flex flex-col items-center bg-blue-900/20 border-2 border-blue-500 rounded-xl p-6">
                        <h3 className="text-2xl text-blue-400 font-bold mb-6">Blue Team</h3>
                        <div className="w-full flex-1 min-h-[150px] flex flex-col gap-3">
                            {bluePlayers.map((p: any) => (
                                <div key={p.id} className="bg-blue-800/50 text-white font-bold px-4 py-2 rounded text-center border border-blue-500/30">{p.username}</div>
                            ))}
                        </div>
                        <button
                            onClick={() => onAction({ type: 'join_team', team: 'blue' })}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                        >
                            Join Blue
                        </button>
                    </div>

                    {/* Red Team */}
                    <div className="flex flex-col items-center bg-red-900/20 border-2 border-red-500 rounded-xl p-6">
                        <h3 className="text-2xl text-red-500 font-bold mb-6">Red Team</h3>
                        <div className="w-full flex-1 min-h-[150px] flex flex-col gap-3">
                            {redPlayers.map((p: any) => (
                                <div key={p.id} className="bg-red-800/50 text-white font-bold px-4 py-2 rounded text-center border border-red-500/30">{p.username}</div>
                            ))}
                        </div>
                        <button
                            onClick={() => onAction({ type: 'join_team', team: 'red' })}
                            className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                        >
                            Join Red
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => onAction({ type: 'start_game' })}
                        disabled={!isReady || !isOwner}
                        className={`px-12 py-4 rounded-full font-black text-2xl tracking-widest uppercase transition-all ${isReady && isOwner ? 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] cursor-pointer' : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}
                    >
                        {isReady ? (isOwner ? 'Start Match' : 'Waiting for owner...') : 'Waiting for players...'}
                    </button>
                    {!isReady && <div className="text-gray-400 text-sm">All players must select a team to begin.</div>}
                    {isReady && !isOwner && <div className="text-yellow-400 text-sm font-bold">Only the room owner can start the match.</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-[800px] flex justify-between bg-[#05080f] p-4 rounded-t-xl border border-gray-800 border-b-0 text-white font-bold items-center">
                <div className="flex gap-4 text-2xl">
                    <span className="text-blue-500">{state.scores.blue}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-red-500">{state.scores.red}</span>
                </div>
                <div className="flex items-center gap-2 text-xl font-mono">
                    <Clock className={state.timeRemaining < 30 ? 'text-red-500 animate-pulse' : 'text-[#cd9a46]'} />
                    <span className={state.timeRemaining < 30 ? 'text-red-500' : ''}>
                        {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Field UI */}
            <div className="relative border-4 border-gray-800 rounded-b-xl overflow-hidden shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="block"
                />
            </div>

            <div className="mt-4 text-gray-400 text-sm">
                Use <kbd className="bg-gray-800 px-2 py-1 rounded border-b-2 border-gray-700">W A S D</kbd> or <kbd className="bg-gray-800 px-2 py-1 rounded border-b-2 border-gray-700">Arrows</kbd> to move, and <kbd className="bg-gray-800 px-2 py-1 rounded border-b-2 border-gray-700 text-[#cd9a46]">SPACE</kbd> to kick.
            </div>

        </div>
    );
}
