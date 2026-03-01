'use client';
import { useState, useEffect, useRef } from 'react';

const STEP_LENGTH = 6.66;
const PIECE_COLORS = { P1: '#2eafff', P2: '#00b550', P3: '#ff4757', P4: '#ffa502' };

const BASE_POSITIONS: Record<string, number[]> = {
    P1: [500, 501, 502, 503], P2: [600, 601, 602, 603], P3: [700, 701, 702, 703], P4: [800, 801, 802, 803],
};
const HOME_ENTRANCE: Record<string, number[]> = {
    P1: [100, 101, 102, 103, 104], P2: [200, 201, 202, 203, 204], P3: [300, 301, 302, 303, 304], P4: [400, 401, 402, 403, 404]
};
const HOME_POSITIONS: Record<string, number> = { P1: 105, P2: 205, P3: 305, P4: 405 };
const START_POSITIONS: Record<string, number> = { P1: 0, P2: 13, P3: 26, P4: 39 };

const FRONTEND_COORD_MAP: Record<number, number[]> = {
    0: [6, 13], 1: [6, 12], 2: [6, 11], 3: [6, 10], 4: [6, 9], 5: [5, 8], 6: [4, 8], 7: [3, 8], 8: [2, 8], 9: [1, 8], 10: [0, 8], 11: [0, 7], 12: [0, 6], 13: [1, 6], 14: [2, 6], 15: [3, 6], 16: [4, 6], 17: [5, 6], 18: [6, 5], 19: [6, 4], 20: [6, 3], 21: [6, 2], 22: [6, 1], 23: [6, 0], 24: [7, 0], 25: [8, 0], 26: [8, 1], 27: [8, 2], 28: [8, 3], 29: [8, 4], 30: [8, 5], 31: [9, 6], 32: [10, 6], 33: [11, 6], 34: [12, 6], 35: [13, 6], 36: [14, 6], 37: [14, 7], 38: [14, 8], 39: [13, 8], 40: [12, 8], 41: [11, 8], 42: [10, 8], 43: [9, 8], 44: [8, 9], 45: [8, 10], 46: [8, 11], 47: [8, 12], 48: [8, 13], 49: [8, 14], 50: [7, 14], 51: [6, 14],
    100: [7, 13], 101: [7, 12], 102: [7, 11], 103: [7, 10], 104: [7, 9], 105: [7, 8],
    200: [7, 1], 201: [7, 2], 202: [7, 3], 203: [7, 4], 204: [7, 5], 205: [7, 6],
    300: [13, 7], 301: [12, 7], 302: [11, 7], 303: [10, 7], 304: [9, 7], 305: [8, 7],
    400: [1, 7], 401: [2, 7], 402: [3, 7], 403: [4, 7], 404: [5, 7], 405: [6, 7],
    500: [1.5, 10.58], 501: [3.57, 10.58], 502: [1.5, 12.43], 503: [3.57, 12.43],
    600: [10.5, 1.58], 601: [12.54, 1.58], 602: [10.5, 3.45], 603: [12.54, 3.45],
    700: [10.5, 10.58], 701: [12.57, 10.58], 702: [10.5, 12.43], 703: [12.57, 12.43],
    800: [1.5, 1.58], 801: [3.57, 1.58], 802: [1.5, 3.45], 803: [3.55, 3.45],
};

const LUDO_CSS = `
.ludo-dice-container { perspective: 1000px; width: 100px; height: 100px; margin: 0 auto; }
.ludo-dice { position: relative; width: 100px; height: 100px; transform-style: preserve-3d; transition: 0.8s ease-out; }
@keyframes rolling { 50% { transform: rotateX(455deg) rotateY(455deg); } }
.ludo-face { position: absolute; width: 100%; height: 100%; border-radius: 20px; border: 5px solid #f6f3f0; 
    transform-style: preserve-3d; background: linear-gradient(145deg, #dddbd8, #fff); }
.ludo-face::before { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 20px; 
    background: #f6f3f0; transform: translateZ(-1px); }
.ludo-face::after { content: ''; position: absolute; top: 50%; left: 50%; width: 18px; height: 18px; 
    border-radius: 50%; background: #131210; color: #131210; }
.ludo-front { transform: translateZ(50px); }
.ludo-back { transform: rotateX(180deg) translateZ(50px); }
.ludo-top { transform: rotateX(90deg) translateZ(50px); }
.ludo-bottom { transform: rotateX(-90deg) translateZ(50px); }
.ludo-right { transform: rotateY(90deg) translateZ(50px); }
.ludo-left { transform: rotateY(-90deg) translateZ(50px); }
.ludo-front::after { width: 30px; height: 30px; background: #f63330; margin: -15px 0 0 -15px; }
.ludo-back::after { margin: -35px 0 0 -30px; box-shadow: 40px 0, 0 25px, 40px 25px, 0 50px, 40px 50px; }
.ludo-top::after { margin: -30px 0 0 -30px; box-shadow: 40px 40px; }
.ludo-bottom::after { margin: -36px 0 0 -36px; box-shadow: 26px 26px, 52px 52px, 52px 0, 0 52px; }
.ludo-right::after { margin: -30px 0 0 -30px; box-shadow: 40px 0, 0 40px, 40px 40px; }
.ludo-left::after { margin: -35px 0 0 -35px; box-shadow: 25px 25px, 50px 50px; }
`;

export default function LudoBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const isCurrentPlayer = state.players[state.turnIndex]?.id === userId;
    const currentPid = state.pids[state.turnIndex];

    const [isRolling, setIsRolling] = useState(false);
    const [localDiceValue, setLocalDiceValue] = useState<number | null>(state.diceValue);
    const prevRollTimeRef = useRef(state.lastDiceRoll?.timestamp);

    // To prevent token teleportation, we maintain an independent visual state for piece positions.
    const [visualPositions, setVisualPositions] = useState<Record<string, number[]>>(() => JSON.parse(JSON.stringify(state.positions)));
    const visualPositionsRef = useRef<Record<string, number[]>>(visualPositions);

    const animationQueueRef = useRef<{ pid: string, pieceIndex: number, path: number[] }[]>([]);
    const [isAnimatingPieces, setIsAnimatingPieces] = useState(false);

    // Sync remote rolls to trigger the animation uniformly for spectators AND the current player
    useEffect(() => {
        if (state.lastDiceRoll && state.lastDiceRoll.timestamp !== prevRollTimeRef.current) {
            animateDice(state.lastDiceRoll.value);
            prevRollTimeRef.current = state.lastDiceRoll.timestamp;
        }
    }, [state.lastDiceRoll?.timestamp]);

    // Fast sync to clear local UI on new turns where dice resets to null
    useEffect(() => {
        if (!state.diceValue && localDiceValue && !state.diceRolled) {
            setLocalDiceValue(null);
            const diceElement = document.getElementById('ludo-dice-mesh');
            if (diceElement) diceElement.style.transform = 'rotateX(0deg) rotateY(0deg)'; // reset visibly to default face
        }
    }, [state.diceValue, state.diceRolled]);

    // Synchronize piece positions and calculate intermediate path frames
    useEffect(() => {
        if (isAnimatingPieces) return; // Prevent interference if already animating

        const nextQueue: { pid: string, pieceIndex: number, path: number[] }[] = [];

        state.pids.forEach((pid: string) => {
            for (let i = 0; i < 4; i++) {
                const startNode = visualPositionsRef.current[pid][i];
                const endNode = state.positions[pid][i];

                if (startNode !== endNode) {
                    // Moving from Base to Start (direct hop) or Killed (back to base directly)
                    if (BASE_POSITIONS[pid].includes(startNode) || BASE_POSITIONS[pid].includes(endNode)) {
                        nextQueue.push({ pid, pieceIndex: i, path: [endNode] });
                    }
                    else {
                        // Generate the step-by-step sequential path across the board
                        let current = startNode;
                        const path = [];
                        let safetyBreak = 0;
                        while (current !== endNode && safetyBreak < 60) {
                            safetyBreak++;

                            // Handle entering the Home Runway
                            const homeEntranceTrigger = ({ P1: 50, P2: 11, P3: 24, P4: 37 } as Record<string, number>)[pid];
                            const homeStartNode = ({ P1: 100, P2: 200, P3: 300, P4: 400 } as Record<string, number>)[pid];

                            if (current === homeEntranceTrigger && endNode >= homeStartNode) {
                                current = homeStartNode; // Slide into home path
                            }
                            // Standard loop around the 0-51 loop
                            else if (current < 100) {
                                current = (current + 1) % 52;
                            }
                            // Moving up the home path (e.g. 100 -> 101)
                            else if (current >= 100) {
                                current++;
                            }

                            path.push(current);
                        }
                        if (path.length > 0) nextQueue.push({ pid, pieceIndex: i, path });
                    }
                }
            }
        });

        if (nextQueue.length > 0) {
            animationQueueRef.current = nextQueue;
            consumeAnimationQueue();
        } else {
            // Force strict sync just in case
            setVisualPositions(state.positions);
            visualPositionsRef.current = state.positions;
        }

    }, [state.positions]);

    const consumeAnimationQueue = () => {
        if (animationQueueRef.current.length === 0) {
            setIsAnimatingPieces(false);
            return;
        }
        setIsAnimatingPieces(true);

        const frameRateMs = 200; // time between jumping squares
        const applyStep = () => {
            let active = false;
            const updates: { pid: string, pieceIndex: number, stepNode: number }[] = [];

            // Mutate the queue array safely OUTSIDE of the React setState lifecycle 
            // to bypass React 18 StrictMode double-invocations breaking the shift() logic.
            animationQueueRef.current.forEach(anim => {
                if (anim.path.length > 0) {
                    active = true;
                    const stepNode = anim.path.shift() as number;
                    updates.push({ pid: anim.pid, pieceIndex: anim.pieceIndex, stepNode });
                }
            });

            if (active) {
                setVisualPositions(prev => {
                    const nextVisual = { ...prev };
                    updates.forEach(up => {
                        nextVisual[up.pid] = [...nextVisual[up.pid]];
                        nextVisual[up.pid][up.pieceIndex] = up.stepNode;
                    });
                    visualPositionsRef.current = nextVisual;
                    return nextVisual;
                });

                setTimeout(applyStep, frameRateMs);
            } else {
                animationQueueRef.current = [];
                setIsAnimatingPieces(false);
            }
        };

        applyStep();
    }


    const animateDice = (finalValue: number) => {
        setIsRolling(true);
        // Do NOT reveal the dice value text until animation is completely done.
        setLocalDiceValue(null);

        const diceElement = document.getElementById('ludo-dice-mesh');
        if (diceElement) {
            // Force CSS reflow so the browser is GUARANTEED to restart the animation for spectators even if the element state is cached.
            diceElement.style.animation = 'none';
            void diceElement.offsetWidth;
            diceElement.style.animation = 'rolling 0.8s';

            setTimeout(() => {
                switch (finalValue) {
                    case 1: diceElement.style.transform = 'rotateX(0deg) rotateY(0deg)'; break;
                    case 2: diceElement.style.transform = 'rotateX(-90deg) rotateY(0deg)'; break;
                    case 3: diceElement.style.transform = 'rotateX(0deg) rotateY(90deg)'; break;
                    case 4: diceElement.style.transform = 'rotateX(0deg) rotateY(-90deg)'; break;
                    case 5: diceElement.style.transform = 'rotateX(90deg) rotateY(0deg)'; break;
                    case 6: diceElement.style.transform = 'rotateX(180deg) rotateY(0deg)'; break;
                }
                diceElement.style.animation = 'none';

                // Show result exactly as animation maps to the correct face
                setLocalDiceValue(finalValue);
                setIsRolling(false);
            }, 850);
        } else {
            setIsRolling(false);
            setLocalDiceValue(finalValue);
        }
    };

    const handleRoll = () => {
        if (!isCurrentPlayer || state.diceRolled || isRolling || isAnimatingPieces) return;
        const random = Math.floor(Math.random() * 6) + 1;

        // Push to server immediately. The server broadcast will trigger animateDice synchronously for ALL clients!
        setIsRolling(true);
        onAction({ type: 'roll', diceValue: random });
    };

    const handleTokenClick = (pid: string, pieceIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isCurrentPlayer || pid !== currentPid || !state.diceRolled || isAnimatingPieces) return;
        onAction({ type: 'move', pieceIndex });
    };

    const getEligiblePiecesLocal = (player: string, roll: number): number[] => {
        if (!roll) return [];
        return [0, 1, 2, 3].filter(piece => {
            const currentPosition = state.positions[player][piece];
            // @ts-ignore
            if (currentPosition === HOME_POSITIONS[player]) return false;
            // @ts-ignore
            if (BASE_POSITIONS[player].includes(currentPosition)) return roll === 6;
            // @ts-ignore
            if (HOME_ENTRANCE[player].includes(currentPosition)) return roll <= (HOME_POSITIONS[player] - currentPosition);
            return true;
        });
    };

    const eligiblePieces = (isCurrentPlayer && state.diceRolled && localDiceValue && !isRolling && !isAnimatingPieces)
        ? getEligiblePiecesLocal(currentPid, localDiceValue)
        : [];

    // Map overlaps to offset them slightly (Token Superposition)
    const positionCounts: Record<number, { pid: string, pieceIndex: number }[]> = {};
    state.pids.forEach((pid: string) => {
        for (let i = 0; i < 4; i++) {
            const pos = visualPositions[pid][i];
            if (!positionCounts[pos]) positionCounts[pos] = [];
            positionCounts[pos].push({ pid, pieceIndex: i });
        }
    });

    return (
        <div className="w-full flex-1 flex flex-col z-40 relative px-2">
            <style dangerouslySetInnerHTML={{ __html: LUDO_CSS }} />

            <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-6 max-w-[95%] xl:max-w-7xl mx-auto w-full">

                {/* Ludo Board Area */}
                <div className="relative w-full max-w-[500px] xl:max-w-[700px] aspect-square rounded-2xl shadow-[0_0_50px_rgba(205,154,70,0.3)] bg-[#0c1421] box-border shrink-0">
                    <div className="absolute inset-0 bg-[url('/ludo/ludo-bggg.png')] bg-contain bg-center bg-no-repeat pointer-events-none z-0"></div>

                    {/* Render Tokens Container */}
                    <div className="absolute inset-0 z-20">
                        {state.pids.map((pid: string) => {
                            return [0, 1, 2, 3].map(pieceIndex => {
                                const position = visualPositions[pid][pieceIndex];
                                const coords = FRONTEND_COORD_MAP[position];
                                if (!coords) return null;

                                const [x, y] = coords;
                                const isEligible = pid === currentPid && eligiblePieces.includes(pieceIndex);

                                // Token Offset computation for stacked pieces
                                const overlappingGroup = positionCounts[position] || [];
                                const totalOverlapping = overlappingGroup.length;
                                const myOverlapIndex = overlappingGroup.findIndex(o => o.pid === pid && o.pieceIndex === pieceIndex);

                                // Only offset if we are on the main playing board tracks (Not in the BASE)
                                const isBasePosition = BASE_POSITIONS[pid].includes(position);
                                let offsetX = 0;
                                let offsetY = 0;
                                let scale = 1;

                                if (!isBasePosition && totalOverlapping > 1) {
                                    scale = 0.8;
                                    const spread = 12; // pixels to spread
                                    if (totalOverlapping === 2) {
                                        offsetX = myOverlapIndex === 0 ? -spread : spread;
                                    } else if (totalOverlapping === 3) {
                                        offsetX = myOverlapIndex === 0 ? -spread : (myOverlapIndex === 2 ? spread : 0);
                                        offsetY = myOverlapIndex === 1 ? -spread : spread;
                                    } else {
                                        offsetX = myOverlapIndex % 2 === 0 ? -spread : spread;
                                        offsetY = myOverlapIndex < 2 ? -spread : spread;
                                    }
                                }

                                return (
                                    <div
                                        key={`${pid}-${pieceIndex}`}
                                        onClick={(e) => handleTokenClick(pid, pieceIndex, e)}
                                        className={`absolute z-10 w-[7%] h-[7%] flex items-center justify-center overflow-visible drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]
                                            ${isEligible ? 'animate-pulse hover:scale-125 z-50 cursor-pointer drop-shadow-[0_0_10px_yellow]' : ''}
                                            ${isAnimatingPieces ? 'transition-all duration-[200ms] ease-linear' : 'transition-transform duration-300'}
                                        `}
                                        data-player-id={pid}
                                        data-piece={pieceIndex}
                                        style={{
                                            top: `calc(${y * STEP_LENGTH}% + 3.33%)`,
                                            left: `calc(${x * STEP_LENGTH}% + 3.33%)`,
                                            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`,
                                            color: PIECE_COLORS[pid as keyof typeof PIECE_COLORS]
                                        }}
                                    >
                                        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                                            {/* Outer Premium Ring */}
                                            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
                                            <circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.6)" />

                                            {/* TANIT SYMBOL */}
                                            <circle cx="50" cy="28" r="10" fill="white" />
                                            <rect x="30" y="42" width="40" height="6" fill="white" rx="2" />
                                            <path d="M 50 48 L 75 80 L 25 80 Z" fill="white" />
                                            <path d="M 50 48 L 75 80 L 25 80 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                                        </svg>
                                    </div>
                                );
                            });
                        })}
                    </div>
                </div>

                {/* Mechanics / Roll Area */}
                <div className="w-full max-w-sm flex flex-col gap-6 bg-[#0f172a]/95 backdrop-blur rounded-2xl p-6 border border-[#cd9a46]/30 shadow-2xl shrink-0 mt-4 xl:mt-0">
                    <h2 className="text-4xl font-black text-center text-[#cd9a46] tracking-widest drop-shadow">LUDO</h2>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-center flex flex-col items-center">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2 block">Active Player</span>
                        <div className={`text-2xl font-bold rounded-lg px-8 py-3 transition-colors ${isCurrentPlayer ? 'bg-[#cd9a46]/20 text-[#cd9a46] border border-[#cd9a46] animate-pulse shadow-[0_0_15px_rgba(205,154,70,0.4)]' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                            {state.players[state.turnIndex]?.username || '---'}
                        </div>
                    </div>

                    {/* True 3D Dice Wrapper */}
                    <div className="bg-[#1e293b] rounded-xl py-12 flex justify-center items-center shadow-inner relative border border-gray-800 overflow-hidden">
                        <div className="ludo-dice-container transform scale-75">
                            <div id="ludo-dice-mesh" className="ludo-dice">
                                <div className="ludo-face ludo-front"></div>
                                <div className="ludo-face ludo-back"></div>
                                <div className="ludo-face ludo-top"></div>
                                <div className="ludo-face ludo-bottom"></div>
                                <div className="ludo-face ludo-right"></div>
                                <div className="ludo-face ludo-left"></div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRoll}
                        disabled={!isCurrentPlayer || state.diceRolled || isRolling || state.status !== 'playing' || isAnimatingPieces}
                        className={`w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg 
                            ${(!isCurrentPlayer || state.diceRolled || isRolling || state.status !== 'playing' || isAnimatingPieces)
                                ? 'bg-gray-800 text-gray-500 opacity-80 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-600 to-[#b33951] hover:from-red-500 hover:to-red-600 text-white hover:scale-[1.02] cursor-pointer shadow-red-900/50'}`}
                    >
                        {isCurrentPlayer ? (state.diceRolled ? 'MOVE TOKEN' : (isRolling ? 'ROLLING...' : 'ROLL DICE')) : 'WAITING...'}
                    </button>

                    <div className="text-center font-bold text-gray-400 min-h-[30px] flex items-center justify-center">
                        {localDiceValue && !isRolling ? (
                            <>Result: <span className="text-white text-3xl ml-2 ml-3 bg-red-900/40 px-3 py-1 rounded">{localDiceValue}</span></>
                        ) : (
                            isRolling ? <span className="animate-pulse">Waiting for dice...</span> : <span></span>
                        )}
                    </div>

                    <div className="mt-auto pt-4 relative">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">Recent Activity</h4>
                        <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto text-xs pr-2">
                            {state.log.map((l: string, i: number) => (
                                <div key={i} className={`p-1.5 rounded bg-black/20 text-gray-300 shadow-sm border ${i === 0 ? 'border-[#cd9a46]/30 text-white bg-[#cd9a46]/10' : 'border-transparent'}`}>{l}</div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
