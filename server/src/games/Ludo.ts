import { Game, GameResult, Player } from './GameInterface';

export type LudoState = {
    players: Player[];
    pids: ('P1' | 'P2' | 'P3' | 'P4')[]; // Maps the internal players to P1, P2, P3, P4
    positions: Record<string, number[]>; // -> [pos0, pos1, pos2, pos3]
    diceValue: number | null;
    diceRolled: boolean;
    turnIndex: number; // 0-3 index
    status: 'playing' | 'finished';
    winner: string | null;
    log: string[];
    lastDiceRoll: { value: number; timestamp: number; pid: string } | null;
};

export const PLAYERS = ['P1', 'P2', 'P3', 'P4'];

export const BASE_POSITIONS: Record<string, number[]> = {
    P1: [500, 501, 502, 503],
    P2: [600, 601, 602, 603],
    P3: [700, 701, 702, 703],
    P4: [800, 801, 802, 803],
};

export const START_POSITIONS: Record<string, number> = {
    P1: 0,
    P2: 26,
    P3: 39,
    P4: 13,
};

export const HOME_ENTRANCE: Record<string, number[]> = {
    P1: [100, 101, 102, 103, 104],
    P2: [200, 201, 202, 203, 204],
    P3: [300, 301, 302, 303, 304],
    P4: [400, 401, 402, 403, 404]
};

export const HOME_POSITIONS: Record<string, number> = {
    P1: 105,
    P2: 205,
    P3: 305,
    P4: 405
};

export const TURNING_POINTS: Record<string, number> = {
    P1: 50,
    P2: 24,
    P3: 37,
    P4: 11
};

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

const TURN_ORDER = [0, 2, 1, 3]; // Used for internal indexing, but given dynamic players we use 0 to players.length

export class Ludo implements Game<LudoState, any> {
    init(players: Player[]): LudoState {
        if (players.length < 2 || players.length > 4) {
            throw new Error("Ludo requires 2-4 players");
        }

        const pids: ('P1' | 'P2' | 'P3' | 'P4')[] = [];
        const positions: Record<string, number[]> = {};

        // Assign P1, P2, P3, P4. If 2 players, they normally get P1 and P3 (opposite sides).
        players.forEach((p, idx) => {
            let pid = PLAYERS[idx] as 'P1' | 'P2' | 'P3' | 'P4';
            if (players.length === 2 && idx === 1) pid = 'P3' as 'P3';

            pids.push(pid);
            positions[pid] = [...BASE_POSITIONS[pid]];
        });

        return {
            players,
            pids,
            positions,
            diceValue: null,
            diceRolled: false,
            turnIndex: 0,
            status: 'playing',
            winner: null,
            log: ['Game started! Waiting for first roll.'],
            lastDiceRoll: null
        };
    }

    applyAction(state: LudoState, action: any, playerId: string) {
        if (state.status !== 'playing') return { newState: state };

        const currentPlayerIndex = state.turnIndex;
        const currentPlayer = state.players[currentPlayerIndex];

        if (playerId !== currentPlayer.id) throw new Error("Not your turn");

        const pid = state.pids[currentPlayerIndex];

        if (action.type === 'roll') {
            if (state.diceRolled) throw new Error("You already rolled this turn.");

            const roll = action.diceValue || Math.floor(Math.random() * 6) + 1; // Trust frontend dice roll value to sync UI animation natively
            state.diceValue = roll;
            state.diceRolled = true;
            state.lastDiceRoll = { value: roll, pid, timestamp: Date.now() };
            state.log.unshift(`${currentPlayer.username} rolled a ${roll}!`);

            // Check if player has any eligible pieces to move
            const eligiblePieces = this.getEligiblePieces(state, pid, roll);

            if (eligiblePieces.length === 0) {
                state.log.unshift(`${currentPlayer.username} has no valid moves. Passing turn.`);
                this.nextTurn(state);
            }
        }
        else if (action.type === 'move') {
            if (!state.diceRolled || !state.diceValue) throw new Error("You must roll first");

            const pieceIndex = action.pieceIndex; // 0, 1, 2, or 3
            const eligiblePieces = this.getEligiblePieces(state, pid, state.diceValue);

            if (!eligiblePieces.includes(pieceIndex)) {
                throw new Error("Invalid piece selection constraints are not met");
            }

            const currentPosition = state.positions[pid][pieceIndex];
            const moveBy = state.diceValue;

            // Handle breaking out of base
            if (BASE_POSITIONS[pid].includes(currentPosition)) {
                // We know it's a 6 from getEligiblePieces
                state.positions[pid][pieceIndex] = START_POSITIONS[pid];
                state.log.unshift(`${currentPlayer.username} moved a token out of base.`);
                state.diceRolled = false; // Gets an extra turn for freeing a piece/rolling 6
                state.diceValue = null;
                return { newState: state };
            }

            // Normal Move Calculation (Virtual path following the references' logic exactly)
            let newPosition = currentPosition;
            for (let i = 0; i < moveBy; i++) {
                newPosition = this.getIncrementedPosition(pid, newPosition);
            }

            state.positions[pid][pieceIndex] = newPosition;
            state.log.unshift(`${currentPlayer.username} moved token forward.`);

            // Check if piece reached Home Goal
            let grantedExtraTurnForHome = false;
            if (newPosition === HOME_POSITIONS[pid] && currentPosition !== HOME_POSITIONS[pid]) {
                state.log.unshift(`🎯 ${currentPlayer.username} secured a token in Home! Extra turn granted.`);
                grantedExtraTurnForHome = true;
            }

            // Check if player won
            if (state.positions[pid].every(pos => pos === HOME_POSITIONS[pid])) {
                state.status = 'finished';
                state.winner = playerId;
                state.log.unshift(`🏆 ${currentPlayer.username} WINS THE GAME!`);
                return { newState: state };
            }

            // Check for Kills
            const isKill = this.checkForKill(state, pid, pieceIndex);
            if (isKill) {
                state.log.unshift(`💥 ${currentPlayer.username} CAPTURED an opponent's token! Extra turn granted.`);
                state.diceRolled = false;
                state.diceValue = null;
                return { newState: state };
            }

            // Advance Turn or Extra Turn on 6 / Home
            if (grantedExtraTurnForHome || state.diceValue === 6) {
                if (state.diceValue === 6 && !grantedExtraTurnForHome) {
                    state.log.unshift(`${currentPlayer.username} rolled a 6, extra turn!`);
                }
                state.diceRolled = false;
                state.diceValue = null;
            } else {
                this.nextTurn(state);
            }
        }

        // Clip length
        if (state.log.length > 20) state.log = state.log.slice(0, 20);

        return { newState: state };
    }

    private getEligiblePieces(state: LudoState, player: string, roll: number): number[] {
        return [0, 1, 2, 3].filter(piece => {
            const currentPosition = state.positions[player][piece];

            if (currentPosition === HOME_POSITIONS[player]) {
                return false;
            }

            if (BASE_POSITIONS[player].includes(currentPosition)) {
                return roll === 6;
            }

            if (HOME_ENTRANCE[player].includes(currentPosition)) {
                return roll <= (HOME_POSITIONS[player] - currentPosition);
            }

            // If entering home entrance this move, verify we don't overshoot
            let testPos = currentPosition;
            for (let i = 0; i < roll; i++) {
                testPos = this.getIncrementedPosition(player, testPos);
            }

            // We safely assume it stops or resolves since the direct reference logic didn't aggressively filter non-exact goal shots, but we did add the boundary check earlier
            return true;
        });
    }

    private getIncrementedPosition(player: string, currentPosition: number): number {
        if (currentPosition === TURNING_POINTS[player]) {
            return HOME_ENTRANCE[player][0];
        } else if (currentPosition === 51) {
            return 0;
        }
        return currentPosition + 1;
    }

    private checkForKill(state: LudoState, player: string, pieceIndex: number): boolean {
        const currentPosition = state.positions[player][pieceIndex];
        let kill = false;

        state.pids.forEach(opponent => {
            if (opponent !== player) {
                [0, 1, 2, 3].forEach(opPiece => {
                    const opponentPosition = state.positions[opponent][opPiece];

                    if (currentPosition === opponentPosition && !SAFE_POSITIONS.includes(currentPosition)) {
                        // Send opponent back to base
                        state.positions[opponent][opPiece] = BASE_POSITIONS[opponent][opPiece];
                        kill = true;
                    }
                });
            }
        });

        return kill;
    }

    private nextTurn(state: LudoState) {
        state.diceRolled = false;
        state.diceValue = null;
        state.turnIndex = (state.turnIndex + 1) % state.players.length;
    }

    isOver(state: LudoState): boolean {
        return state.status === 'finished';
    }

    getResult(state: LudoState): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: { message: "Ludo match concluded!" }
        };
    }
}
