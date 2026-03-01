import { Game, GameResult, Player } from './GameInterface';

export type UnoColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Special';
export type UnoValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
// 10 = Draw 2, 11 = Reverse, 12 = Skip, 13 = Wild, 14 = Wild Draw 4

export interface UnoCard {
    color: UnoColor;
    value: UnoValue;
    id: string; // Unique id for React rendering/key tracking
}

export type UnoState = {
    players: Player[];
    hands: Record<string, UnoCard[]>;
    drawPile: UnoCard[];
    discardPile: UnoCard[];
    currentTurnIndex: number;
    gameDirection: 1 | -1;
    drawStackPenalty: number; // Stacks +2 and +4
    activeColor: UnoColor; // The current enforceable color (especially after wilds)
    status: 'playing' | 'color_selection' | 'finished';
    unosAnnounced: string[]; // Players who successfully yelled UNO
    timeRemaining: number;
    winner: string | null;
    lastActionMsg?: { text: string; time: number };
};

// Pure Deck Generator
function createFullDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    const colors: UnoColor[] = ['Red', 'Blue', 'Green', 'Yellow'];
    let idCounter = 0;

    colors.forEach(color => {
        // 0 card
        deck.push({ color, value: 0, id: `c${idCounter++}` });

        // 1-9, Draw 2 (10), Reverse (11), Skip (12) - two of each
        for (let v = 1; v <= 12; v++) {
            deck.push({ color, value: v as UnoValue, id: `c${idCounter++}` });
            deck.push({ color, value: v as UnoValue, id: `c${idCounter++}` });
        }
    });

    // 4 Wild (13), 4 Wild Draw 4 (14)
    for (let i = 0; i < 4; i++) {
        deck.push({ color: 'Special', value: 13, id: `c${idCounter++}` });
        deck.push({ color: 'Special', value: 14, id: `c${idCounter++}` });
    }

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

export class Uno implements Game<UnoState, any> {
    init(players: Player[]): UnoState {
        const drawPile = createFullDeck();
        const hands: Record<string, UnoCard[]> = {};

        players.forEach(p => {
            hands[p.id] = drawPile.splice(0, 7); // Draw 7 cards each
        });

        // Ensure first card is not a special/action card to keep it simple initially
        let firstCardIndex = drawPile.findIndex(c => c.value < 10 && c.color !== 'Special');
        if (firstCardIndex === -1) firstCardIndex = 0;
        const firstCard = drawPile.splice(firstCardIndex, 1)[0];

        return {
            players,
            hands,
            drawPile,
            discardPile: [firstCard],
            currentTurnIndex: 0,
            gameDirection: 1,
            drawStackPenalty: 0,
            activeColor: firstCard.color,
            status: 'playing',
            unosAnnounced: [],
            timeRemaining: 30, // 30 seconds per turn
            winner: null
        };
    }

    applyAction(state: UnoState, action: any, playerId: string) {
        if (state.status === 'finished') throw new Error('Game is over');
        const isCurrentTurn = state.players[state.currentTurnIndex].id === playerId;

        if (state.status === 'color_selection') {
            if (!isCurrentTurn || action.type !== 'select_color') throw new Error('Waiting for color selection');
            state.activeColor = action.color;
            state.status = 'playing';
            this.rotateTurn(state);
            return { newState: state };
        }

        if (action.type === 'call_uno') {
            if (state.hands[playerId].length <= 2 && !state.unosAnnounced.includes(playerId)) {
                state.unosAnnounced.push(playerId);
                const pName = state.players.find(p => p.id === playerId)?.username || 'Someone';
                state.lastActionMsg = { text: `${pName} yelled UNO!`, time: Date.now() };
            }
            return { newState: state };
        }

        if (action.type === 'call_counter_uno') {
            let penalizedSomeone = false;
            for (const [pId, hand] of Object.entries(state.hands)) {
                if (pId !== playerId && hand.length === 1 && !state.unosAnnounced.includes(pId)) {
                    this.drawCard(state, pId);
                    this.drawCard(state, pId);
                    penalizedSomeone = true;

                    const pName = state.players.find(p => p.id === pId)?.username || 'Someone';
                    const callerName = state.players.find(p => p.id === playerId)?.username || 'Someone';
                    state.lastActionMsg = { text: `${callerName} COUNTER-UNO'd ${pName}! +2 Cards!`, time: Date.now() };
                }
            }
            if (!penalizedSomeone) {
                const callerName = state.players.find(p => p.id === playerId)?.username || 'Someone';
                state.lastActionMsg = { text: `${callerName} called Counter-UNO on nobody!`, time: Date.now() };
            }
            return { newState: state };
        }

        if (!isCurrentTurn) throw new Error('Not your turn');

        let nextState = { ...state };

        const topCard = state.discardPile[state.discardPile.length - 1];

        if (action.type === 'draw') {
            if (state.drawStackPenalty > 0) {
                // Must draw the penalty cards
                for (let i = 0; i < state.drawStackPenalty; i++) {
                    this.drawCard(nextState, playerId);
                }
                nextState.drawStackPenalty = 0;
                this.rotateTurn(nextState);
            } else {
                this.drawCard(nextState, playerId);
                this.rotateTurn(nextState);
            }
            // Reset Uno safety
            nextState.unosAnnounced = nextState.unosAnnounced.filter(id => id !== playerId);
            return { newState: nextState };
        }

        if (action.type === 'play') {
            const cardObj = nextState.hands[playerId].find(c => c.id === action.cardId);
            if (!cardObj) throw new Error('Card not found in hand');

            // Force draw penalty overrides normal plays unless stacking identical action
            if (nextState.drawStackPenalty > 0) {
                // Classic: can't stack +2 on +4, etc. We enforce MUST draw if penalty > 0, strict rules.
                throw new Error("You must draw the stacked penalty cards.");
            }

            // Validation
            const isValid =
                cardObj.color === 'Special' ||
                cardObj.color === nextState.activeColor ||
                cardObj.value === topCard.value;

            if (!isValid) throw new Error('Invalid move');

            // Move card from hand to discard pile
            nextState.hands[playerId] = nextState.hands[playerId].filter(c => c.id !== action.cardId);
            nextState.discardPile.push(cardObj);

            // Check for Uno Penalty Failure
            if (nextState.hands[playerId].length === 1 && !nextState.unosAnnounced.includes(playerId)) {
                // You didn't yell UNO! Automatic 2 card penalty
                this.drawCard(nextState, playerId);
                this.drawCard(nextState, playerId);
            }

            // Check Win Condition
            if (nextState.hands[playerId].length === 0) {
                nextState.status = 'finished';
                nextState.winner = playerId;
                return { newState: nextState };
            }

            // Process Actions
            if (cardObj.value === 10) { // Draw 2
                nextState.drawStackPenalty += 2;
                nextState.activeColor = cardObj.color;
            } else if (cardObj.value === 11) { // Reverse
                if (nextState.players.length === 2) {
                    this.rotateTurn(nextState); // In 2-p, reverse acts as a skip
                } else {
                    nextState.gameDirection *= -1;
                }
                nextState.activeColor = cardObj.color;
            } else if (cardObj.value === 12) { // Skip
                this.rotateTurn(nextState);
                nextState.activeColor = cardObj.color;
            } else if (cardObj.value === 13) { // Wild
                nextState.status = 'color_selection';
            } else if (cardObj.value === 14) { // Wild Draw 4
                nextState.drawStackPenalty += 4;
                nextState.status = 'color_selection';
            } else {
                nextState.activeColor = cardObj.color;
            }

            // If not awaiting color selection, advance turn
            if (nextState.status !== 'color_selection') {
                this.rotateTurn(nextState);
            }

            return { newState: nextState };
        }

        return { newState: state };
    }

    private drawCard(state: UnoState, playerId: string) {
        if (state.drawPile.length === 0) {
            // Reshuffle discard pile (leave top card)
            const top = state.discardPile.pop()!;
            state.drawPile = state.discardPile.sort(() => Math.random() - 0.5);
            state.drawPile.forEach(c => {
                if (c.value >= 13) c.color = 'Special'; // Reset wilds
            });
            state.discardPile = [top];
        }
        if (state.drawPile.length > 0) {
            state.hands[playerId].push(state.drawPile.pop()!);
        }
    }

    private rotateTurn(state: UnoState) {
        state.timeRemaining = 30; // reset timer
        let nextIdx = state.currentTurnIndex + state.gameDirection;
        if (nextIdx >= state.players.length) nextIdx = 0;
        if (nextIdx < 0) nextIdx = state.players.length - 1;
        state.currentTurnIndex = nextIdx;
    }

    tick(state: UnoState) {
        if (state.status === 'finished' || state.status === 'color_selection') return { newState: state };

        state.timeRemaining -= 1;

        if (state.timeRemaining <= 0) {
            // Auto-draw penalty and skip turn due to timeout
            const playerId = state.players[state.currentTurnIndex].id;
            const pd = state.drawStackPenalty > 0 ? state.drawStackPenalty : 1;
            for (let i = 0; i < pd; i++) {
                this.drawCard(state, playerId);
            }
            state.drawStackPenalty = 0;
            this.rotateTurn(state);
            return { newState: state };
        }
        return { newState: state };
    }

    isOver(state: UnoState): boolean {
        return state.status === 'finished';
    }

    getResult(state: UnoState): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: { hands: Object.fromEntries(Object.entries(state.hands).map(([k, v]) => [k, v.length])) }
        };
    }
}
