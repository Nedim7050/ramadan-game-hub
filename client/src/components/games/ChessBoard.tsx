'use client';
import { useState, useMemo } from 'react';
import { Chess } from 'chess.js';

export default function ChessBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const isWhitePlayer = state.whitePlayerId === userId;
    const isBlackPlayer = state.blackPlayerId === userId;
    const isSpectator = !isWhitePlayer && !isBlackPlayer;
    const playerColor = isBlackPlayer ? 'b' : 'w'; // Spectator defaults to viewing from white's perspective

    const isCurrentTurn = state.turn === playerColor && !isSpectator;

    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [validMoves, setValidMoves] = useState<any[]>([]);

    // Compute local chess engine synchronously with state FEN to prevent render desyncs
    const chess = useMemo(() => new Chess(state.fen), [state.fen]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(Math.max(0, seconds) / 60);
        const s = Math.floor(Math.max(0, seconds) % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSquareClick = (squareStr: string) => {
        if (!isCurrentTurn || state.status !== 'playing') return;

        const piece = chess.get(squareStr as any);

        if (selectedSquare) {
            // If clicking a valid move target
            const move = validMoves.find(m => m.to === squareStr);
            if (move) {
                onAction({ type: 'move', from: selectedSquare, to: squareStr, promotion: 'q' });
                setSelectedSquare(null);
                setValidMoves([]);
                return;
            }

            // If clicking another piece of the same color, select it instead
            if (piece && piece.color === playerColor) {
                setSelectedSquare(squareStr);
                setValidMoves(chess.moves({ square: squareStr as any, verbose: true }));
                return;
            }

            // Otherwise, click off to deselect
            setSelectedSquare(null);
            setValidMoves([]);
        } else {
            // No square selected yet
            if (piece && piece.color === playerColor) {
                setSelectedSquare(squareStr);
                setValidMoves(chess.moves({ square: squareStr as any, verbose: true }));
            }
        }
    };

    // Calculate grid rows & cols visually (flip if black)
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const visualRanks = isBlackPlayer ? [...ranks].reverse() : ranks;
    const visualFiles = isBlackPlayer ? [...files].reverse() : files;

    const renderPiece = (p: { type: string, color: string }) => {
        // Standard high quality unicode chess symbols
        const symbols: Record<string, Record<string, string>> = {
            'w': { 'p': '♙', 'n': '♘', 'b': '♗', 'r': '♖', 'q': '♕', 'k': '♔' },
            'b': { 'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚' }
        };
        const sym = symbols[p.color][p.type];

        // Ensure perfect contrast for pure text pieces
        if (p.color === 'w') {
            return <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none text-6xl select-none">{sym}</span>;
        } else {
            return <span className="text-[#1a1c23] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-none text-6xl select-none">{sym}</span>;
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center">

            {/* Header / Info Panel */}
            <div className="w-full bg-[#1e293b] p-4 flex justify-between items-center border-[3px] border-b-0 border-[#2a374a] rounded-t-xl max-w-2xl shadow-xl">
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2">White <span className="p-1 bg-gray-800 rounded text-mono font-mono">{formatTime(state.whiteTime)}</span></span>
                        <span className={`font-bold ${state.turn === 'w' ? 'text-yellow-400 animate-pulse' : 'text-gray-300'}`}>
                            {state.players.find((p: any) => p.id === state.whitePlayerId)?.username || 'Player 1'}
                        </span>
                    </div>
                    <span className="text-2xl font-black text-[#cd9a46]">VS</span>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2"><span className="p-1 bg-gray-800 rounded text-mono font-mono">{formatTime(state.blackTime)}</span> Black</span>
                        <span className={`font-bold ${state.turn === 'b' ? 'text-yellow-400 animate-pulse' : 'text-gray-300'}`}>
                            {state.players.find((p: any) => p.id === state.blackPlayerId)?.username || 'Player 2'}
                        </span>
                    </div>
                </div>
                {state.lastMove && (
                    <div className="text-sm border border-[#cd9a46]/30 bg-[#cd9a46]/10 text-white px-3 py-1 rounded font-mono shadow-inner tracking-widest">
                        Last Move: {state.lastMove}
                    </div>
                )}
            </div>

            {/* Turn Banner */}
            <div className={`w-full max-w-2xl py-2 text-center text-sm font-bold uppercase tracking-widest border-x-[3px] border-[#2a374a] transition-colors ${state.status === 'playing' ? (isCurrentTurn ? 'bg-green-600/20 text-green-400' : 'bg-[#0f172a] text-gray-500') : 'bg-yellow-600/20 text-yellow-500'}`}>
                {state.status === 'finished' ? (state.draw ? 'Draw!' : 'Checkmate!') : (isCurrentTurn ? "It's your turn!" : "Waiting for opponent...")}
            </div>

            {/* Chess Board */}
            <div className="w-full max-w-2xl aspect-[1/1] bg-[#2a374a] p-[10px] sm:p-4 rounded-b-xl border-[3px] border-[#2a374a] shadow-2xl relative">

                {/* Visual Check/Checkmate Overlay */}
                {chess.isCheckmate() && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm pointer-events-none rounded transition-all animate-pulse">
                        <span className="text-6xl md:text-8xl font-black text-red-500 transform rotate-[-15deg] drop-shadow-[0_10px_20px_rgba(0,0,0,1)] uppercase tracking-tighter shadow-black border-red-900 border-4 p-4 rounded-xl bg-black">
                            CHECKMATE
                        </span>
                    </div>
                )}
                {chess.inCheck() && !chess.isCheckmate() && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-8 py-2 rounded-full font-black text-2xl animate-bounce shadow-[0_0_20px_rgba(220,38,38,0.8)] pointer-events-none">
                        CHECK!
                    </div>
                )}

                <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-4 border-[#1e293b] shadow-inner rounded overflow-hidden">
                    {visualRanks.map((r, rankIdx) => (
                        visualFiles.map((f, fileIdx) => {
                            const sq = `${f}${r}`;
                            const piece = chess.get(sq as any);

                            // Chess.com classic colors: Green/Ivory
                            const isLight = (rankIdx + fileIdx) % 2 === 0;
                            const bgColorClass = isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]';

                            const isSelected = selectedSquare === sq;
                            const isValidMove = validMoves.some(m => m.to === sq);
                            const isLastMoveFocus = false; // Could add last move highlight parsing

                            return (
                                <div
                                    key={sq}
                                    onClick={() => handleSquareClick(sq)}
                                    className={`relative flex items-center justify-center transition-all ${bgColorClass} ${isCurrentTurn ? 'cursor-pointer hover:brightness-110' : 'cursor-default'} ${isSelected ? 'ring-inset ring-4 ring-yellow-400/80 bg-opacity-80' : ''} ${piece && piece.type === 'k' && piece.color === chess.turn() && chess.inCheck() ? 'shadow-[inset_0_0_40px_rgba(255,0,0,0.8)]' : ''}`}
                                >
                                    {/* Valid Move Indicator */}
                                    {isValidMove && !piece && (
                                        <div className="absolute w-[30%] h-[30%] bg-black/20 rounded-full z-10 pointer-events-none"></div>
                                    )}
                                    {isValidMove && piece && (
                                        <div className="absolute w-[80%] h-[80%] border-4 border-black/20 rounded-full z-10 pointer-events-none"></div>
                                    )}

                                    {/* Coordinates */}
                                    {fileIdx === 0 && <span className={`absolute top-1 left-1 text-[10px] font-bold select-none ${isLight ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>{r}</span>}
                                    {rankIdx === 7 && <span className={`absolute bottom-0 right-1 text-[10px] font-bold select-none ${isLight ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>{f}</span>}

                                    <div className="z-20 transform transition-transform duration-200">
                                        {piece && renderPiece(piece)}
                                    </div>
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>

        </div>
    );
}
