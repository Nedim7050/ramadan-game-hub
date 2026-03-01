'use client';
import { Circle, X } from 'lucide-react';

export default function TicTacToeBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const isMyTurn = state.currentPlayerId === userId;

    return (
        <div className="flex flex-col items-center">
            <div className="mb-8 text-xl font-bold">
                {isMyTurn ? <span className="text-[#cd9a46]">C'est à TON tour !</span> :
                    <span className="text-gray-500">Au tour de l'adversaire...</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-lg">
                {state.board.map((cell: any, index: number) => (
                    <button
                        key={index}
                        onClick={() => onAction({ index })}
                        disabled={cell !== null || !isMyTurn}
                        className={`w-24 h-24 md:w-32 md:h-32 bg-[#05080f] flex items-center justify-center text-4xl rounded hover:bg-[#0a0f1e] transition-colors ${!cell && isMyTurn ? 'cursor-pointer hover:border border-[#cd9a46]/30' : 'cursor-default'}`}
                    >
                        {cell ? (cell === state.players[0]?.id ? <X size={60} className="text-blue-500" /> : <Circle size={50} className="text-red-500" />) : null}
                    </button>
                ))}
            </div>
        </div>
    );
}
