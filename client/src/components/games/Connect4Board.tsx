'use client';

export default function Connect4Board({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const isCurrentPlayer = state.players[state.currentPlayerIndex]?.id === userId;

    const dropToken = (colIndex: number) => {
        if (!isCurrentPlayer || state.status !== 'playing') return;
        onAction({ type: 'drop', colIndex });
    };

    const getPlayerColor = (pId: string | null) => {
        if (!pId) return 'bg-[#05080f] shadow-inner border-t-2 border-blue-900/50';
        const idx = state.players.findIndex((p: any) => p.id === pId);
        return idx === 0 ? 'bg-red-500 shadow-[inset_0_-8px_15px_rgba(153,27,27,0.8)]' : 'bg-yellow-400 shadow-[inset_0_-8px_15px_rgba(161,98,7,0.8)]';
    };

    const isWinningCell = (r: number, c: number) => {
        return state.winningCells?.some((cell: any) => cell.r === r && cell.c === c);
    };

    if (state.status === 'finished') {
        const winnerName = state.winner ? state.players.find((p: any) => p.id === state.winner)?.username : null;
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-900 rounded-xl">
                <h2 className="text-4xl text-yellow-400 font-bold mb-4">{winnerName ? 'Victoire !' : 'Égalité !'}</h2>
                <p className="text-xl text-white">{winnerName ? `Vainqueur: ${winnerName}` : 'Aucun vainqueur'}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] flex flex-col bg-[#0f172a] rounded-xl border border-gray-800 p-4 md:p-8 relative shadow-2xl items-center">

            <div className="w-full flex justify-between items-center mb-8 px-4 max-w-2xl bg-slate-800/50 rounded-full p-2 border border-slate-700">
                <div className="flex gap-4 items-center">
                    <div className="w-6 h-6 rounded-full bg-red-500 shadow-inner"></div>
                    <span className={`font-bold ${state.currentPlayerIndex === 0 ? 'text-white' : 'text-gray-500'}`}>{state.players[0]?.username}</span>
                </div>

                <div className={`text-lg font-bold px-4 py-1 rounded-full ${isCurrentPlayer ? 'bg-[#cd9a46] text-[#05080f] shadow-[0_0_15px_rgba(205,154,70,0.5)]' : 'text-gray-400 bg-gray-800'}`}>
                    {isCurrentPlayer ? "À vous de jouer !" : `Au tour de ${state.players[state.currentPlayerIndex]?.username}`}
                </div>

                <div className="flex gap-4 items-center">
                    <span className={`font-bold ${state.currentPlayerIndex === 1 ? 'text-white' : 'text-gray-500'}`}>{state.players[1]?.username}</span>
                    <div className="w-6 h-6 rounded-full bg-yellow-400 shadow-inner"></div>
                </div>
            </div>

            {/* Board 7 cols x 6 rows */}
            <div className="bg-blue-600 p-3 md:p-4 rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] border-b-8 border-blue-800 flex gap-2 w-full max-w-[600px] aspect-[7/6]">
                {state.grid[0].map((_: any, colIndex: number) => (
                    <div
                        key={colIndex}
                        className={`flex-1 flex flex-col gap-2 ${isCurrentPlayer ? 'cursor-pointer hover:bg-blue-500/50 rounded-lg transition-colors group' : ''}`}
                        onClick={() => dropToken(colIndex)}
                    >
                        {/* Hover indicator space above board */}
                        <div className="h-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isCurrentPlayer && <div className={`w-8 h-8 -mt-6 rounded-full ${state.currentPlayerIndex === 0 ? 'bg-red-500/50' : 'bg-yellow-400/50'}`}></div>}
                        </div>

                        {state.grid.map((row: any[], rowIndex: number) => (
                            <div
                                key={rowIndex}
                                className={`flex-1 rounded-full w-full aspect-square relative ${getPlayerColor(state.grid[rowIndex][colIndex])} transition-all duration-300`}
                            >
                                {isWinningCell(rowIndex, colIndex) && (
                                    <div className="absolute inset-0 bg-white/40 border-4 border-white rounded-full animate-pulse"></div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

        </div>
    );
}
