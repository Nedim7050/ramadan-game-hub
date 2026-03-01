import { Game, GameResult, Player } from './GameInterface';

function getLevenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

type Line = { x0: number; y0: number; x1: number; y1: number; color: string; width: number };
export type ChatMessage = { senderId: string; senderName?: string; text: string; color: 'white' | 'green' | 'yellow' | 'red' | 'system' };

export type ScribbleState = {
    players: Player[];
    scores: Record<string, number>;
    currentDrawerIndex: number;
    wordChoices: string[];
    currentWord: string | null;
    hint: string;
    chat: ChatMessage[];
    lines: Line[];
    status: 'choosing' | 'drawing' | 'finished';
    timeRemaining: number;
    round: number;
    guessedPlayers: string[];
    usedWords: string[];
};

const WORDSList = [
    "Apple", "House", "Car", "Tree", "Computer", "Cat", "Dog", "Airplane", "Book", "Watch",
    "Sun", "Moon", "Star", "Cloud", "Rain", "Snow", "Mountain", "River", "Ocean", "Beach",
    "Guitar", "Piano", "Drum", "Music", "Dance", "Shoes", "Shirt", "Pants", "Hat", "Glasses",
    "Phone", "Television", "Camera", "Picture", "Movie", "Pizza", "Burger", "Salad", "Soup", "Bread",
    "Water", "Coffee", "Tea", "Juice", "Milk", "Smile", "Tear", "Eye", "Nose", "Mouth",
    "Hand", "Foot", "Arm", "Leg", "Heart", "Brain", "Blood", "Bone", "Skin", "Hair",
    "Friend", "Family", "Baby", "Man", "Woman", "Boy", "Girl", "Doctor", "Teacher", "Police",
    "Fire", "School", "Hospital", "Bank", "Store", "Restaurant", "Park", "Museum", "Zoo", "Farm",
    "Animal", "Bird", "Fish", "Insect", "Spider", "Snake", "Frog", "Turtle", "Rabbit", "Mouse",
    "Lion", "Tiger", "Bear", "Elephant", "Monkey", "Horse", "Cow", "Pig", "Sheep", "Chicken",
    "Window", "Door", "Wall", "Roof", "Floor", "Chair", "Table", "Bed", "Sofa", "Desk",
    "Pen", "Pencil", "Paper", "Notebook", "Eraser", "Scissor", "Glue", "Tape", "Ruler", "Paint",
    "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White",
    "Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval", "Line", "Dot",
    "Morning", "Afternoon", "Evening", "Night", "Today", "Tomorrow", "Yesterday", "Week", "Month", "Year",
    "Spring", "Summer", "Autumn", "Winter", "Hot", "Cold", "Warm", "Cool", "Dry", "Wet",
    "Fast", "Slow", "High", "Low", "Big", "Small", "Long", "Short", "Heavy", "Light",
    "Happy", "Sad", "Angry", "Scared", "Surprised", "Tired", "Sick", "Healthy", "Strong", "Weak"
];

export class Scribble implements Game<ScribbleState, any> {
    init(players: Player[]): ScribbleState {
        const scores: Record<string, number> = {};
        players.forEach(p => scores[p.id] = 0);
        return this.startTurn(players, scores, 0, 1, [], []);
    }

    private startTurn(players: Player[], scores: Record<string, number>, drawerIdx: number, round: number, usedWords: string[], previousChat: ChatMessage[] = []): ScribbleState {
        const availableWords = [...WORDSList].filter(w => !usedWords.includes(w));
        const choices = availableWords.sort(() => Math.random() - 0.5).slice(0, 3);
        const drawerName = players[drawerIdx]?.username || 'Someone';

        return {
            players,
            scores,
            currentDrawerIndex: drawerIdx,
            wordChoices: choices,
            currentWord: null,
            hint: "",
            chat: [...previousChat, { senderId: 'system', text: `Round ${round} has started! It is ${drawerName}'s turn to draw.`, color: 'system' as const }].slice(-50), // Keep last 50
            lines: [],
            status: 'choosing',
            timeRemaining: 20,
            round,
            guessedPlayers: [],
            usedWords
        };
    }

    applyAction(state: ScribbleState, action: any, playerId: string) {
        if (state.status === 'finished') throw new Error('Game over');

        const drawerId = state.players[state.currentDrawerIndex].id;
        const playerName = state.players.find(p => p.id === playerId)?.username || 'Joueur';

        if (action.type === 'choose_word') {
            if (playerId !== drawerId) throw new Error('Not your turn to choose');
            if (state.status !== 'choosing') throw new Error('Already chosen');
            if (!state.wordChoices.includes(action.word)) throw new Error('Invalid word');

            state.currentWord = action.word;
            state.hint = action.word.replace(/[a-zA-Z]/g, '_ ');
            state.status = 'drawing';
            state.timeRemaining = 60;
            state.usedWords.push(action.word);
            state.chat.push({ senderId: 'system', text: `A word has been chosen! Try to guess it!`, color: 'system' });
            return { newState: state };
        }

        if (action.type === 'draw' || action.type === 'clear') {
            if (playerId !== drawerId) throw new Error('Not the drawer');
            if (state.status !== 'drawing') return { newState: state };

            if (action.type === 'clear') {
                state.lines = [];
            } else if (action.type === 'draw') {
                state.lines.push(action.line);
            }
            return { newState: state };
        }

        if (action.type === 'guess') {
            if (playerId === drawerId) throw new Error('Drawer cannot guess');
            if (state.status !== 'drawing') return { newState: state };
            if (state.guessedPlayers.includes(playerId)) return { newState: state };

            const guessText = action.guess.trim();
            const guessNorm = guessText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const targetNorm = (state.currentWord || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (guessNorm === targetNorm) {
                // Correct
                const points = Math.max(10, state.timeRemaining * 10);
                state.scores[playerId] += points;
                state.scores[drawerId] += Math.floor(points / 2);
                state.guessedPlayers.push(playerId);

                state.chat.push({ senderId: 'system', text: `${playerName} has found the word!`, color: 'green' });

                if (state.guessedPlayers.length === state.players.length - 1) {
                    state.chat.push({ senderId: 'system', text: `Everyone found it! The word was: ${state.currentWord}`, color: 'system' });
                    return { newState: this.nextTurn(state) };
                }
            } else {
                const dist = getLevenshteinDistance(guessNorm, targetNorm);
                let color: 'white' | 'yellow' | 'red' = 'white';

                if (dist <= 2 && targetNorm.length > 3) color = 'yellow';
                else color = 'red';

                state.chat.push({ senderId: playerId, senderName: playerName, text: guessText, color });

                if (color === 'yellow') {
                    state.chat.push({ senderId: 'system', text: `${playerName} is very close!`, color: 'yellow' });
                }
            }
            // Keep chat from overflowing
            if (state.chat.length > 50) state.chat = state.chat.slice(state.chat.length - 50);
        }

        return { newState: state };
    }

    tick(state: ScribbleState) {
        if (state.status === 'finished') return { newState: state };

        state.timeRemaining -= 1;

        if (state.status === 'drawing' && state.currentWord) {
            const totalLen = state.currentWord.length;
            const revealCount = state.timeRemaining <= 15 ? Math.floor(totalLen / 1.5) :
                state.timeRemaining <= 30 ? Math.floor(totalLen / 2) :
                    state.timeRemaining <= 45 ? 1 : 0;

            let newHint = "";
            let revealed = 0;
            for (let i = 0; i < totalLen; i++) {
                if (state.currentWord[i] === ' ') {
                    newHint += '  ';
                } else if (revealed < revealCount) {
                    newHint += state.currentWord[i] + ' ';
                    revealed++;
                } else {
                    newHint += '_ ';
                }
            }
            state.hint = newHint.trim();
        }

        if (state.timeRemaining <= 0) {
            if (state.status === 'choosing') {
                state.currentWord = state.wordChoices[0];
                state.hint = state.currentWord.replace(/[a-zA-Z]/g, '_ ');
                state.status = 'drawing';
                state.timeRemaining = 60;
                state.usedWords.push(state.currentWord);
                state.chat.push({ senderId: 'system', text: `Time is up! A word was chosen randomly.`, color: 'system' });
            } else if (state.status === 'drawing') {
                state.chat.push({ senderId: 'system', text: `Time is up! The word was: ${state.currentWord}`, color: 'system' });
                return { newState: this.nextTurn(state) };
            }
        }
        return { newState: state };
    }

    private nextTurn(state: ScribbleState) {
        const nextIdx = state.currentDrawerIndex + 1;
        if (nextIdx >= state.players.length) {
            const nextRound = state.round + 1;
            if (nextRound > 3) { // 3 rounds max
                state.status = 'finished';
                return state;
            } else {
                return this.startTurn(state.players, state.scores, 0, nextRound, state.usedWords, state.chat);
            }
        } else {
            return this.startTurn(state.players, state.scores, nextIdx, state.round, state.usedWords, state.chat);
        }
    }

    isOver(state: ScribbleState): boolean {
        return state.status === 'finished';
    }

    getResult(state: ScribbleState): GameResult {
        let max = -1;
        let winners: string[] = [];
        for (const [id, score] of Object.entries(state.scores)) {
            if (score > max) { max = score; winners = [id]; }
            else if (score === max) { winners.push(id); }
        }
        return { winners, summary: { scores: state.scores } };
    }
}
