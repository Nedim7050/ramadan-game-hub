import { Game, GameResult, Player } from './GameInterface';

type MemoryCard = {
    id: number;
    symbol: string;
    isFlipped: boolean;
    isMatched: boolean;
};

export type MemoryState = {
    players: Player[];
    scores: Record<string, number>;
    currentPlayerIndex: number;
    cards: MemoryCard[];
    openedIndices: number[];
    status: 'playing' | 'waiting' | 'finished';
    waitTicks: number;
    winner: string | null;
};

const THEMES = [
    ['🐶', '🐱', '🐭', '🐹', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'], // Animals
    ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🥑'], // Fruits
    ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐'], // Vehicles
    ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓'], // Sports
    ['🌍', '🌕', '🔥', '💧', '⚡', '❄️', '🌪️', '🌈', '☀️', '⭐']  // Elements
];

export class Memory implements Game<MemoryState, any> {
    init(players: Player[]): MemoryState {
        const scores: Record<string, number> = {};
        players.forEach(p => scores[p.id] = 0);

        const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

        // Create 20 cards (10 pairs)
        let cards: MemoryCard[] = [];
        theme.forEach(sym => {
            cards.push({ id: 0, symbol: sym, isFlipped: false, isMatched: false });
            cards.push({ id: 0, symbol: sym, isFlipped: false, isMatched: false });
        });

        cards = cards.sort(() => Math.random() - 0.5);
        cards.forEach((c, idx) => c.id = idx);

        return {
            players,
            scores,
            currentPlayerIndex: 0,
            cards,
            openedIndices: [],
            status: 'playing',
            waitTicks: 0,
            winner: null
        };
    }

    applyAction(state: MemoryState, action: any, playerId: string) {
        if (state.status !== 'playing') return { newState: state };

        const currentPlayerId = state.players[state.currentPlayerIndex].id;
        if (playerId !== currentPlayerId) throw new Error("Not your turn");

        if (action.type === 'flip') {
            const cardIdx = action.cardIndex;
            const card = state.cards[cardIdx];

            if (card.isFlipped || card.isMatched) return { newState: state };
            if (state.openedIndices.length >= 2) return { newState: state };

            card.isFlipped = true;
            state.openedIndices.push(cardIdx);

            if (state.openedIndices.length === 2) {
                const [idx1, idx2] = state.openedIndices;
                if (state.cards[idx1].symbol === state.cards[idx2].symbol) {
                    // Match!
                    state.cards[idx1].isMatched = true;
                    state.cards[idx2].isMatched = true;
                    state.scores[playerId] += 1;
                    state.openedIndices = [];
                    // Player gets to go again!

                    // Check win
                    if (state.cards.every(c => c.isMatched)) {
                        state.status = 'finished';
                    }
                } else {
                    // No match, wait and then flip back
                    state.status = 'waiting';
                    state.waitTicks = 2; // ~2 seconds if ticked by Engine
                }
            }
        }
        return { newState: state };
    }

    tick(state: MemoryState) {
        if (state.status === 'waiting') {
            state.waitTicks -= 1;
            if (state.waitTicks <= 0) {
                // Flip back
                state.openedIndices.forEach(idx => {
                    state.cards[idx].isFlipped = false;
                });
                state.openedIndices = [];
                state.status = 'playing';

                // Next player
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            }
        }
        return { newState: state };
    }

    isOver(state: MemoryState): boolean {
        return state.status === 'finished';
    }

    getResult(state: MemoryState): GameResult {
        let max = -1;
        let winners: string[] = [];
        for (const [id, score] of Object.entries(state.scores)) {
            if (score > max) { max = score; winners = [id]; }
            else if (score === max) { winners.push(id); }
        }
        return { winners, summary: { scores: state.scores } };
    }
}
