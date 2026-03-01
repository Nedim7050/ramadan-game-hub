/**
 * Interface générique pour les modules de jeu.  Chaque jeu doit implémenter
 * ces méthodes afin d’être intégré à la plateforme.  L’état et les actions
 * sont génériques pour permettre la typage fort.
 */
export interface GameModule<State, Action, Settings = any> {
  init(players: string[], settings: Settings): State;
  applyAction(state: State, action: Action, playerId: string): { state: State; events?: any };
  isOver(state: State): boolean;
  getResult(state: State): { winners: string[]; summary: any };
}

/**
 * Structure représentant un joueur d’une room côté serveur.
 */
export interface Player {
  id: string;
  username: string;
  ready: boolean;
}