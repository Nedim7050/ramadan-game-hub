import { Game, GameResult, Player } from './GameInterface';
import { Chess as ChessJS } from 'chess.js';

export type ChessState = {
    players: Player[];
    fen: string;
    turn: 'w' | 'b';
    status: 'playing' | 'finished';
    winner: string | null;
    draw: boolean;
    lastMove: string | null;
    whitePlayerId: string;
    blackPlayerId: string;
    whiteTime: number; // in seconds
    blackTime: number;
};

export class Chess implements Game<ChessState, any> {
    init(players: Player[]): ChessState {
        if (players.length !== 2) throw new Error("Chess requires exactly 2 players");

        const chess = new ChessJS();

        // Randomly assign colors
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const whitePlayerId = shuffled[0].id;
        const blackPlayerId = shuffled[1].id;

        return {
            players,
            fen: chess.fen(),
            turn: 'w',
            status: 'playing',
            winner: null,
            draw: false,
            lastMove: null,
            whitePlayerId,
            blackPlayerId,
            whiteTime: 600, // 10 minutes
            blackTime: 600
        };
    }

    applyAction(state: ChessState, action: any, playerId: string) {
        if (state.status !== 'playing') return { newState: state };

        const isWhite = playerId === state.whitePlayerId;
        const isBlack = playerId === state.blackPlayerId;

        if (state.turn === 'w' && !isWhite) throw new Error("Not your turn (White's turn)");
        if (state.turn === 'b' && !isBlack) throw new Error("Not your turn (Black's turn)");

        if (action.type === 'move') {
            const chess = new ChessJS(state.fen);

            try {
                const moveResult = chess.move({
                    from: action.from,
                    to: action.to,
                    promotion: action.promotion || 'q'
                });

                if (moveResult) {
                    state.fen = chess.fen();
                    state.turn = chess.turn(); // 'w' or 'b'
                    state.lastMove = moveResult.san;

                    if (chess.isGameOver()) {
                        state.status = 'finished';
                        if (chess.isCheckmate()) {
                            state.winner = playerId; // The one who just moved wins
                        } else {
                            state.draw = true;
                        }
                    }
                }
            } catch (e) {
                console.error("Invalid move:", e);
                throw new Error("Invalid move");
            }
        }

        return { newState: state };
    }

    tick(state: ChessState) {
        if (state.status !== 'playing') return { newState: state };

        if (state.turn === 'w') {
            state.whiteTime -= 1;
            if (state.whiteTime <= 0) {
                state.status = 'finished';
                state.winner = state.blackPlayerId;
            }
        } else {
            state.blackTime -= 1;
            if (state.blackTime <= 0) {
                state.status = 'finished';
                state.winner = state.whitePlayerId;
            }
        }

        return { newState: state };
    }

    isOver(state: ChessState): boolean {
        return state.status === 'finished';
    }

    getResult(state: ChessState): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: {
                draw: state.draw,
                message: state.winner ? 'Checkmate!' : (state.draw ? 'Draw!' : 'Game Over')
            }
        };
    }
}
