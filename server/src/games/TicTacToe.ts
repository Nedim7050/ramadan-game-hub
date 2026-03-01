import { Game, GameResult, Player } from './GameInterface';

export type TicTacToeState = {
    players: Player[];
    board: (string | null)[];
    currentPlayerId: string;
    winner: string | null;
    isDraw: boolean;
};

export class TicTacToe implements Game<TicTacToeState, { index: number }> {
    init(players: Player[]): TicTacToeState {
        return {
            players,
            board: Array(9).fill(null),
            currentPlayerId: players[0]?.id || '',
            winner: null,
            isDraw: false
        };
    }

    applyAction(state: TicTacToeState, action: { index: number }, playerId: string) {
        if (state.winner || state.isDraw) throw new Error('Game is over');
        if (playerId !== state.currentPlayerId) throw new Error('Not your turn');
        if (state.board[action.index] !== null) throw new Error('Cell is not empty');

        const newBoard = [...state.board];
        newBoard[action.index] = playerId;

        const winner = this.checkWinner(newBoard);
        const isDraw = !winner && newBoard.every(cell => cell !== null);

        const nextPlayerId = state.players.find(p => p.id !== playerId)?.id || playerId;

        return {
            newState: {
                players: state.players,
                board: newBoard,
                currentPlayerId: nextPlayerId,
                winner,
                isDraw
            }
        };
    }

    private checkWinner(board: (string | null)[]) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
        }
        return null;
    }

    isOver(state: TicTacToeState): boolean {
        return state.winner !== null || state.isDraw;
    }

    getResult(state: TicTacToeState): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: { draw: state.isDraw }
        };
    }
}
