import { create } from 'zustand';

export interface User {
    id: string;
    username: string;
    avatar_url?: string;
}

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    isAuthLoaded: boolean;
    setIsAuthLoaded: (loaded: boolean) => void;
    roomCode: string | null;
    setRoomCode: (code: string | null) => void;
    gameState: any;
    setGameState: (state: any) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    isAuthLoaded: false,
    setIsAuthLoaded: (loaded) => set({ isAuthLoaded: loaded }),
    roomCode: null,
    setRoomCode: (code) => set({ roomCode: code }),
    gameState: null,
    setGameState: (state) => set({ gameState: state }),
}));
