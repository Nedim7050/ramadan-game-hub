'use client';

export default function MemoryBoard({ state, onAction, userId }: { state: any, onAction: (a: any) => void, userId: string }) {
    const isCurrentPlayer = state.players[state.currentPlayerIndex]?.id === userId;

    const flipCard = (index: number) => {
        if (!isCurrentPlayer || state.status !== 'playing') return;
        onAction({ type: 'flip', cardIndex: index });
    };

    if (state.status === 'finished') {
        const winnerId = state.winner || state.players.reduce((a: any, b: any) => state.scores[a.id] > state.scores[b.id] ? a : b).id;
        const winnerName = state.players.find((p: any) => p.id === winnerId)?.username;
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-900 rounded-xl h-[600px] border border-blue-500 shadow-2xl">
                <h2 className="text-6xl text-blue-400 font-extrabold mb-8 uppercase tracking-widest drop-shadow-lg">Game Over!</h2>
                <p className="text-3xl text-white font-bold">Winner: <span className="text-green-400">{winnerName}</span></p>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] flex flex-col bg-[#0f172a] rounded-xl border border-gray-800 overflow-hidden shadow-2xl">

            {/* Header / Scores */}
            <div className="w-full bg-[#1e293b] p-4 flex justify-between items-center border-b border-gray-800 shadow">
                <div className="flex gap-4">
                    {state.players.map((p: any) => (
                        <div key={p.id} className={`px-4 py-2 rounded-xl font-bold border-2 transition-all ${state.players[state.currentPlayerIndex].id === p.id ? 'border-[#cd9a46] bg-[#cd9a46]/20 text-[#cd9a46] shadow-[0_0_10px_rgba(205,154,70,0.5)]' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
                            {p.username}: {state.scores[p.id]} pairs
                        </div>
                    ))}
                </div>
                <div className={`text-lg font-bold px-4 py-2 rounded-full uppercase tracking-wider ${isCurrentPlayer ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'text-gray-500'}`}>
                    {isCurrentPlayer ? "It's your turn!" : `${state.players[state.currentPlayerIndex]?.username}'s turn`}
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0b1120] p-6 relative w-full h-full">

                {/* 5x4 Grid expanded */}
                <div className="grid grid-cols-5 grid-rows-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-5xl h-full pb-4 perspective-[1000px]">
                    {state.cards.map((card: any, index: number) => {
                        const isVisible = card.isFlipped || card.isMatched || state.openedIndices.includes(index);
                        const isClickable = isCurrentPlayer && state.status === 'playing' && !isVisible;

                        return (
                            <div
                                key={index}
                                onClick={() => flipCard(index)}
                                className={`relative w-full h-full cursor-${isClickable ? 'pointer hover:scale-105' : 'default'} transition-transform duration-300`}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Flipping Container */}
                                <div className={`w-full h-full duration-500 relative ${isVisible ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>

                                    {/* Front (Hidden, Back of the Card visually) */}
                                    <div className="absolute inset-0 bg-blue-900 border-4 border-blue-400 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center [backface-visibility:hidden]">
                                        <div className="w-1/2 h-1/2 rounded-full bg-blue-800 opacity-50 flex items-center justify-center">
                                            <span className="text-white font-bold opacity-30 text-2xl">?</span>
                                        </div>
                                    </div>

                                    {/* Back (Revealed, Face of the Card visually) */}
                                    <div className={`absolute inset-0 bg-white border-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] ${card.isMatched ? 'border-green-500 bg-green-50 scale-95 opacity-70' : 'border-gray-200'}`}>
                                        <span className="text-6xl md:text-7xl lg:text-8xl xl:text-8xl drop-shadow-lg scale-[1.2]">{card.symbol}</span>
                                        {card.isMatched && <div className="absolute inset-0 bg-green-500/10 rounded-lg"></div>}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {state.status === 'waiting' && <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-8 py-3 rounded-full text-lg font-bold border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] backdrop-blur-md animate-pulse z-10 tracking-widest uppercase">Memorize these cards!</div>}
            </div>

        </div>
    );
}
