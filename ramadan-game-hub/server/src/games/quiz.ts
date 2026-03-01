import { GameModule } from '../types.js';
import { randomUUID } from 'crypto';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index de la bonne réponse
}

interface QuizState {
  gameType: 'quiz';
  questions: QuizQuestion[];
  currentIndex: number;
  scoreboard: Record<string, number>;
  answered: Record<string, boolean>;
  gameId: string;
}

interface QuizAction {
  answer: number;
}

// Jeu de questions intégré par défaut pour développement local.  En production,
// vous pouvez charger les questions depuis Supabase via RPC ou API REST.
const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Quelle est la capitale de la Tunisie ?',
    options: ['Tunis', 'Sfax', 'Sousse', 'Bizerte'],
    answer: 0,
  },
  {
    question: 'Combien de jours dure le mois de Ramadan ?',
    options: ['29 ou 30', '28', '31', '27'],
    answer: 0,
  },
  {
    question: 'Qui a inventé le langage JavaScript ?',
    options: ['Brendan Eich', 'Linus Torvalds', 'Guido van Rossum', 'James Gosling'],
    answer: 0,
  },
];

export const quizGame: GameModule<QuizState, QuizAction, { nbQuestions?: number }> = {
  init(players: string[], settings) {
    const nbQuestions = settings.nbQuestions || DEFAULT_QUESTIONS.length;
    // Sélectionne aléatoirement des questions (on clone pour éviter mutation)
    const shuffled = [...DEFAULT_QUESTIONS].sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, nbQuestions);
    const scoreboard: Record<string, number> = {};
    players.forEach((id) => (scoreboard[id] = 0));
    return {
      gameType: 'quiz',
      questions,
      currentIndex: 0,
      scoreboard,
      answered: {},
      gameId: randomUUID(),
    };
  },
  applyAction(state: QuizState, action: QuizAction, playerId: string) {
    const { answer } = action;
    // ignore si déjà répondu
    if (state.answered[playerId]) {
      return { state };
    }
    state.answered[playerId] = true;
    const currentQuestion = state.questions[state.currentIndex];
    // récompense simple : +1 si réponse correcte
    if (answer === currentQuestion.answer) {
      state.scoreboard[playerId] += 1;
    }
    // si tout le monde a répondu, passe à la question suivante
    const allAnswered = Object.keys(state.scoreboard).every((pid) => state.answered[pid]);
    if (allAnswered) {
      state.currentIndex += 1;
      state.answered = {};
    }
    return { state };
  },
  isOver(state: QuizState) {
    return state.currentIndex >= state.questions.length;
  },
  getResult(state: QuizState) {
    // détermine les vainqueurs avec le score maximal
    const max = Math.max(...Object.values(state.scoreboard));
    const winners = Object.keys(state.scoreboard).filter((pid) => state.scoreboard[pid] === max);
    return {
      winners,
      summary: {
        scoreboard: state.scoreboard,
      },
    };
  },
};