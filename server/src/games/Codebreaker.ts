import { Game, GameResult, Player } from './GameInterface';

export type GuessFeedback = { guess: string; bulls: number; cows: number };

export type CodebreakerState = {
    players: Player[];
    secretCode: string; // The 4 digit secret code
    histories: Record<string, GuessFeedback[]>;
    status: 'playing' | 'finished';
    winner: string | null;
    lastEvent: string | null;
};

export class Codebreaker implements Game<CodebreakerState, any> {
    init(players: Player[]): CodebreakerState {
        // Generate a 4-digit code with all unique digits
        let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        digits = digits.sort(() => Math.random() - 0.5);
        const secretCode = digits.slice(0, 4).join('');

        const histories: Record<string, GuessFeedback[]> = {};
        players.forEach(p => histories[p.id] = []);

        return {
            players,
            secretCode,
            histories,
            status: 'playing',
            winner: null,
            lastEvent: "Game started! Crack the 4-digit code."
        };
    }

    applyAction(state: CodebreakerState, action: any, playerId: string) {
        if (state.status !== 'playing') return { newState: state };

        const playerName = state.players.find(p => p.id === playerId)?.username || 'Unknown';

        if (action.type === 'guess') {
            const guess = action.guess;
            if (typeof guess !== 'string' || guess.length !== 4) {
                throw new Error("Guess must be exactly 4 digits");
            }

            // Calculate Bulls and Cows
            let bulls = 0;
            let cows = 0;
            const secretArr = state.secretCode.split('');
            const guessArr = guess.split('');

            for (let i = 0; i < 4; i++) {
                if (guessArr[i] === secretArr[i]) {
                    bulls++;
                } else if (secretArr.includes(guessArr[i])) {
                    cows++;
                }
            }

            const feedback: GuessFeedback = { guess, bulls, cows };
            if (!state.histories[playerId]) state.histories[playerId] = [];
            state.histories[playerId].push(feedback);

            state.lastEvent = `${playerName} scored ${bulls} Bulls and ${cows} Cows!`;

            if (bulls === 4) {
                state.status = 'finished';
                state.winner = playerId;
                state.lastEvent = `${playerName} cracked the code! The code was ${state.secretCode}.`;
            }
        }

        return { newState: state };
    }

    isOver(state: CodebreakerState): boolean {
        return state.status === 'finished';
    }

    getResult(state: CodebreakerState): GameResult {
        return {
            winners: state.winner ? [state.winner] : [],
            summary: {
                message: state.winner ? `The code was cracked!` : 'Game Over',
                code: state.secretCode
            }
        };
    }
}
