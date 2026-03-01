export interface Player {
    id: string; // auth.users.id
    username: string;
}

export interface GameResult {
    winners: string[]; // player ids
    summary: any;
}

export interface Game<State = any, Action = any, Settings = any> {
    init(players: Player[], settings?: Settings): State;
    applyAction(state: State, action: Action, playerId: string): { newState: State; events?: any[] };
    tick?(state: State): { newState: State };
    tickPhysics?(state: State, dt: number): { newState: State };
    isOver(state: State): boolean;
    getResult(state: State): GameResult;
}
