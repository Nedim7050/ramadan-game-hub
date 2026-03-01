import { GameModule } from '../types.js';

interface TODState {
  gameType: 'truthOrDare';
  queue: string[];
  currentPlayer: string;
  currentCard: string | null;
  deck: {
    truth: string[];
    dare: string[];
  };
}

interface TODAction {
  draw?: 'truth' | 'dare';
  done?: true;
}

/**
 * Petites cartes d’exemples pour Action/Vérité.  En production, remplacez ces
 * données par un chargement depuis la base de données.
 */
const DEFAULT_DECK = {
  truth: [
    'Quelle est ta plus grande peur ?',
    'Quel est ton secret inavoué ?',
    'As-tu déjà menti à un ami proche ?'
  ],
  dare: [
    'Fais 10 pompes',
    'Chante le refrain de ta chanson préférée',
    'Danse sans musique pendant 30 secondes'
  ],
};

export const truthOrDareGame: GameModule<TODState, TODAction> = {
  init(players: string[]) {
    const queue = [...players];
    return {
      gameType: 'truthOrDare',
      queue,
      currentPlayer: queue[0],
      currentCard: null,
      deck: {
        truth: [...DEFAULT_DECK.truth],
        dare: [...DEFAULT_DECK.dare],
      },
    };
  },
  applyAction(state: TODState, action: TODAction, playerId: string) {
    // seul le joueur courant peut agir
    if (state.currentPlayer !== playerId) {
      return { state };
    }
    if (action.draw) {
      const type = action.draw;
      const deck = state.deck[type];
      if (deck.length === 0) {
        state.currentCard = 'Plus de cartes disponibles.';
      } else {
        // tire une carte aléatoire
        const idx = Math.floor(Math.random() * deck.length);
        state.currentCard = deck.splice(idx, 1)[0];
      }
    } else if (action.done) {
      // termine le tour
      state.currentCard = null;
      // avance la queue
      state.queue.push(state.queue.shift() as string);
      state.currentPlayer = state.queue[0];
    }
    return { state };
  },
  isOver() {
    // Le jeu Action/Vérité ne se termine pas automatiquement.
    return false;
  },
  getResult() {
    return { winners: [], summary: {} };
  },
};