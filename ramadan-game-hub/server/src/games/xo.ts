import { GameModule } from '../types.js';

interface XOState {
  gameType: 'xo';
  board: (string | null)[];
  players: string[]; // tableau des IDs des joueurs (2 joueurs)
  symbols: Record<string, string>; // mapping joueur -> 'X' ou 'O'
  turn: string; // id du joueur dont c’est le tour
  status: string;
}

interface XOAction {
  index: number;
}

/**
 * Implémentation du jeu Tic‑Tac‑Toe.  Deux joueurs s’affrontent pour placer
 * trois symboles identiques horizontalement, verticalement ou en diagonale.
 */
export const xoGame: GameModule<XOState, XOAction> = {
  init(players: string[]) {
    const board = Array(9).fill(null);
    const symbols: Record<string, string> = {};
    // attribue X au premier joueur et O au second
    symbols[players[0]] = 'X';
    symbols[players[1]] = 'O';
    return {
      gameType: 'xo',
      board,
      players,
      symbols,
      turn: players[0],
      status: `Au tour de ${symbols[players[0]]}`,
    };
  },
  applyAction(state: XOState, action: XOAction, playerId: string) {
    const { index } = action;
    const symbol = state.symbols[playerId];
    if (state.turn !== playerId) {
      return { state, events: { error: 'Not your turn' } };
    }
    if (index < 0 || index >= state.board.length || state.board[index] !== null) {
      return { state, events: { error: 'Coup invalide' } };
    }
    const newBoard = [...state.board];
    newBoard[index] = symbol;
    // Vérifie victoire
    const winLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    let winner: string | null = null;
    for (const line of winLines) {
      const [a, b, c] = line;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        winner = playerId;
        break;
      }
    }
    const isDraw = newBoard.every((cell) => cell !== null);
    let status = '';
    let nextTurn = state.turn;
    if (winner) {
      status = `${state.symbols[playerId]} gagne`;
    } else if (isDraw) {
      status = 'Match nul';
    } else {
      const nextPlayerIndex = state.players.indexOf(playerId) === 0 ? 1 : 0;
      nextTurn = state.players[nextPlayerIndex];
      status = `Au tour de ${state.symbols[nextTurn]}`;
    }
    const newState: XOState = {
      ...state,
      board: newBoard,
      turn: nextTurn,
      status,
    };
    return { state: newState };
  },
  isOver(state: XOState) {
    // Terminé si status contient "gagne" ou "Match nul"
    return /gagne|Match nul/.test(state.status);
  },
  getResult(state: XOState) {
    let winners: string[] = [];
    if (state.status.includes('gagne')) {
      // déduire le symbole gagnant
      const symbol = state.status.charAt(0);
      const winnerId = state.players.find((p) => state.symbols[p] === symbol);
      if (winnerId) winners.push(winnerId);
    }
    return { winners, summary: { status: state.status } };
  },
};