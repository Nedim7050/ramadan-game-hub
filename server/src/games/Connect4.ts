import { Game, GameResult, Player } from './GameInterface';

export type Connect4State = {
    players: Player[];
    grid: (string | null)[][]; // 6 rows, 7 cols
    currentPlayerIndex: number;
    status: 'playing' | 'finished';
    winner: string | null;
    winningCells: { r: number, c: number }[];
};

const ROWS = 6;
const COLS = 7;

export class Connect4 implements Game<Connect4State, any> {
    init(players: Player[]): Connect4State {
        const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

        return {
            players,
            grid,
            currentPlayerIndex: 0,
            status: 'playing',
            winner: null,
            winningCells: []
        };
    }

    applyAction(state: Connect4State, action: any, playerId: string) {
        if (state.status !== 'playing') return { newState: state };

        const currentPlayerId = state.players[state.currentPlayerIndex].id;
        if (playerId !== currentPlayerId) throw new Error("Not your turn");

        if (action.type === 'drop') {
            const col = action.colIndex;
            if (col < 0 || col >= COLS) return { newState: state };

            // Find lowest empty row
            let dropRow = -1;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (state.grid[r][col] === null) {
                    dropRow = r;
                    break;
                }
            }

            if (dropRow === -1) return { newState: state }; // Column full

            state.grid[dropRow][col] = playerId;

            const winMatch = this.checkWin(state.grid, playerId);
            if (winMatch) {
                state.status = 'finished';
                state.winner = playerId;
                state.winningCells = winMatch;
            } else if (this.checkDraw(state.grid)) {
                state.status = 'finished';
                state.winner = null; // Draw
            } else {
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            }
        }

        return { newState: state };
    }

    private checkWin(grid: (string | null)[][], player: string): { r: number, c: number }[] | null {
        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                if (grid[r][c] === player && grid[r][c + 1] === player && grid[r][c + 2] === player && grid[r][c + 3] === player) {
                    return [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }];
                }
            }
        }
        // Vertical
        for (let r = 0; r < ROWS - 3; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] === player && grid[r + 1][c] === player && grid[r + 2][c] === player && grid[r + 3][c] === player) {
                    return [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }];
                }
            }
        }
        // Diagonal Right
        for (let r = 0; r < ROWS - 3; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                if (grid[r][c] === player && grid[r + 1][c + 1] === player && grid[r + 2][c + 2] === player && grid[r + 3][c + 3] === player) {
                    return [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }];
                }
            }
        }
        // Diagonal Left
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                if (grid[r][c] === player && grid[r - 1][c + 1] === player && grid[r - 2][c + 2] === player && grid[r - 3][c + 3] === player) {
                    return [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }];
                }
            }
        }
        return null;
    }

    private checkDraw(grid: (string | null)[][]): boolean {
        return grid[0].every(cell => cell !== null);
    }

    isOver(state: Connect4State): boolean {
        return state.status === 'finished';
    }

    getResult(state: Connect4State): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: { msg: state.winner ? 'Victoire !' : 'Égalité' }
        };
    }
}
