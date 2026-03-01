import { Game, GameResult, Player } from './GameInterface';

export class Chess implements Game {
    init(players: Player[]) { return {}; }
    applyAction(state: any, action: any, playerId: string) { return { newState: state }; }
    isOver(state: any) { return false; }
    getResult(state: any) { return { winners: [], summary: {} }; }
}

export class Werewolf implements Game {
    init(players: Player[]) { return {}; }
    applyAction(state: any, action: any, playerId: string) { return { newState: state }; }
    isOver(state: any) { return false; }
    getResult(state: any) { return { winners: [], summary: {} }; }
}
