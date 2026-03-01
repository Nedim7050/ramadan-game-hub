import { Game, GameResult, Player } from './GameInterface';

export type QuizState = {
    players: Player[];
    themeName: string;
    prompt: string;
    targetAnswers: string[]; // Normalized lowercase
    displayAnswers: string[]; // Original case
    foundAnswers: Record<string, string[]>; // playerId -> list of found normalized answers
    timeRemaining: number;
    status: 'playing' | 'finished';
};

export const THEMES = [
    { name: "African Countries starting with M", prompt: "Find the 7 countries", answers: ["Madagascar", "Malawi", "Mali", "Morocco", "Mauritius", "Mauritania", "Mozambique"] },
    { name: "Planets", prompt: "Name the 8 planets", answers: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] },
    { name: "Colors of the Rainbow", prompt: "The 7 colors", answers: ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"] },
    { name: "Islamic Months", prompt: "The 12 Islamic months", answers: ["Muharram", "Safar", "Rabi al-awwal", "Rabi al-thani", "Jumada al-awwal", "Jumada al-thani", "Rajab", "Shaaban", "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah"] },
    { name: "Continents", prompt: "Name the 6 continents", answers: ["Africa", "America", "Antarctica", "Asia", "Europe", "Oceania"] },
    { name: "World Cup Winners", prompt: "The 8 champion countries", answers: ["Brazil", "Germany", "Italy", "Argentina", "France", "Uruguay", "England", "Spain"] },
    { name: "Chinese Zodiac", prompt: "The 12 animals", answers: ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] },
    { name: "Zodiac Signs", prompt: "The 12 signs", answers: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] },
    { name: "Wonders of the Ancient World", prompt: "The 7 wonders", answers: ["Great Pyramid", "Hanging Gardens", "Statue of Zeus", "Temple of Artemis", "Mausoleum at Halicarnassus", "Colossus of Rhodes", "Lighthouse of Alexandria"] },
    { name: "Maghreb Capitals", prompt: "AMU Capitals", answers: ["Tunis", "Algiers", "Rabat", "Nouakchott", "Tripoli"] },
    { name: "World Oceans", prompt: "The 5 oceans", answers: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"] },
    { name: "Countries bordering Tunisia", prompt: "The 2 neighbors", answers: ["Algeria", "Libya"] },
    { name: "The 5 Pillars of Islam", prompt: "The 5 pillars", answers: ["Shahada", "Salat", "Zakat", "Sawm", "Hajj"] },
    { name: "Major Prophets", prompt: "Ulu al-Azm (The 5 great ones)", answers: ["Nuh", "Ibrahim", "Musa", "Isa", "Muhammad"] },
    { name: "Major Tunisian Cities", prompt: "Top 6 by population", answers: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes"] },
    { name: "Seasons of the Year", prompt: "The 4 seasons", answers: ["Spring", "Summer", "Autumn", "Winter"] },
    { name: "Chess Pieces", prompt: "The 6 types of pieces", answers: ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"] },
    { name: "Fingers of the Hand", prompt: "The 5 fingers", answers: ["Thumb", "Index", "Middle", "Ring", "Little"] },
    { name: "Members of the Beatles", prompt: "The 4 members", answers: ["John", "Paul", "George", "Ringo"] },
    { name: "Southern European Capitals", prompt: "5 major capitals", answers: ["Paris", "Madrid", "Lisbon", "Rome", "Athens"] },
    { name: "Harry Potter Hogwarts Houses", prompt: "The 4 houses", answers: ["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin"] },
    { name: "Primary Colors", prompt: "The 3 primary colors", answers: ["Red", "Blue", "Yellow"] },
    { name: "Types of Pasta", prompt: "Name 6 famous types", answers: ["Spaghetti", "Macaroni", "Penne", "Ravioli", "Lasagna", "Linguine"] },
    { name: "Planets with Rings", prompt: "The 4 ringed giants", answers: ["Jupiter", "Saturn", "Uranus", "Neptune"] },
    { name: "G7 Countries", prompt: "The 7 members", answers: ["Canada", "France", "Germany", "Italy", "Japan", "United Kingdom", "United States"] },
    { name: "Noble Gases", prompt: "The 6 noble gases", answers: ["Helium", "Neon", "Argon", "Krypton", "Xenon", "Radon"] },
    { name: "Months with 31 Days", prompt: "Name the 7 months", answers: ["January", "March", "May", "July", "August", "October", "December"] },
    { name: "Fast Food Chains", prompt: "Name 6 global chains", answers: ["McDonalds", "Burger King", "KFC", "Subway", "Dominos", "Pizza Hut"] },
    { name: "European Countries starting with S", prompt: "Name 7 countries", answers: ["Spain", "Sweden", "Switzerland", "Serbia", "Slovakia", "Slovenia", "San Marino"] },
    { name: "Largest Countries by Area", prompt: "The top 6 largest", answers: ["Russia", "Canada", "China", "United States", "Brazil", "Australia"] }
];

function normalizeStr(str: string) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export class Quiz implements Game<QuizState, { guess: string }> {
    init(players: Player[], options?: { themeIndex?: number }): QuizState {
        let themeIndex = options?.themeIndex !== undefined ? options.themeIndex : -1;
        if (themeIndex < 0 || themeIndex >= THEMES.length) {
            themeIndex = Math.floor(Math.random() * THEMES.length);
        }
        const theme = THEMES[themeIndex];

        const foundAnswers: Record<string, string[]> = {};
        players.forEach(p => foundAnswers[p.id] = []);

        return {
            players,
            themeName: theme.name,
            prompt: theme.prompt,
            displayAnswers: theme.answers,
            targetAnswers: theme.answers.map(normalizeStr),
            foundAnswers,
            timeRemaining: 150, // 150 seconds (2:30 min)
            status: 'playing'
        };
    }

    applyAction(state: QuizState, action: { guess: string }, playerId: string) {
        if (state.status !== 'playing') throw new Error('Game is over');

        const guessNorm = normalizeStr(action.guess);
        let newState = { ...state };
        const pFound = [...newState.foundAnswers[playerId]];

        if (newState.targetAnswers.includes(guessNorm) && !pFound.includes(guessNorm)) {
            pFound.push(guessNorm);
            newState.foundAnswers = { ...newState.foundAnswers, [playerId]: pFound };

            // Check if player found ALL words
            if (pFound.length === newState.targetAnswers.length) {
                newState.status = 'finished';
            }
        }

        return { newState };
    }

    tick(state: QuizState) {
        if (state.status !== 'playing') return { newState: state };
        const newState = { ...state, timeRemaining: state.timeRemaining - 1 };
        if (newState.timeRemaining <= 0) {
            newState.status = 'finished';
        }
        return { newState };
    }

    isOver(state: QuizState): boolean {
        return state.status === 'finished';
    }

    getResult(state: QuizState): GameResult {
        let maxFound = -1;
        let winners: string[] = [];
        const scores: Record<string, number> = {};

        for (const [id, found] of Object.entries(state.foundAnswers)) {
            scores[id] = found.length;
            if (found.length > maxFound) {
                maxFound = found.length;
                winners = [id];
            } else if (found.length === maxFound) {
                winners.push(id);
            }
        }

        return { winners, summary: { scores, maxPossible: state.targetAnswers.length } };
    }
}
