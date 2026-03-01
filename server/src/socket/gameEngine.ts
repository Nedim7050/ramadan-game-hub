import { Server, Socket } from 'socket.io';
import { Game } from '../games/GameInterface';
import { TicTacToe } from '../games/TicTacToe';
import { Quiz } from '../games/Quiz';
import { Scribble } from '../games/Scribble';
import { Uno } from '../games/Uno';
import { Haxball } from '../games/Haxball';
import { Memory } from '../games/Memory';
import { Connect4 } from '../games/Connect4';
import { Chess } from '../games/Chess';
import { Codebreaker } from '../games/Codebreaker';
import { Ludo } from '../games/Ludo';
import { supabaseAdmin } from '../lib/supabase';

const activeGames: Record<string, {
    game: Game;
    state: any;
    players: any[];
    roomCode: string;
}> = {};

const saveGamePoints = async (result: any, players: any[], gameType: string) => {
    if (!result || !players) return;

    const isDraw = result.winners.length === 0 || result.winners.length === players.length; // e.g all tied or none

    const records = players.map(p => {
        let pts = 0;
        if (isDraw) {
            pts = 1; // +1 point for draws
        } else {
            if (result.winners.includes(p.id)) {
                pts = 3; // +3 points for win
            } else {
                pts = 0; // Loss
            }
        }

        return {
            user_id: p.id,
            delta_points: pts,
            reason: `Result: ${gameType} (${pts} pts)`
        };
    }).filter(r => r.delta_points > 0); // Only insert positive points

    if (records.length > 0) {
        await supabaseAdmin.from('points_ledger').insert(records)
            .then(({ error }) => { if (error) console.error("Score Error:", error) });
    }
};

export const setupGameEngine = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        socket.on('game:start', ({ roomCode, gameType, players, settings }) => {
            let gameInstance: Game;
            if (gameType === 'TicTacToe') gameInstance = new TicTacToe();
            else if (gameType === 'Quiz') gameInstance = new Quiz();
            else if (gameType === 'Scribble') gameInstance = new Scribble();
            else if (gameType === 'Uno') gameInstance = new Uno();
            else if (gameType === 'Haxball') gameInstance = new Haxball();
            else if (gameType === 'Memory') gameInstance = new Memory();
            else if (gameType === 'Connect4') gameInstance = new Connect4();
            else if (gameType === 'Chess') gameInstance = new Chess();
            else if (gameType === 'Codebreaker') gameInstance = new Codebreaker();
            else if (gameType === 'Ludo') gameInstance = new Ludo();
            else return socket.emit('error', 'Unknown game type');

            const initialState = gameInstance.init(players, settings || {});
            const sessionId = crypto.randomUUID();

            activeGames[sessionId] = {
                game: gameInstance,
                state: initialState,
                players,
                roomCode
            };

            io.to(roomCode).emit('game:start', { sessionId, gameType });
            io.to(roomCode).emit('game:state', { sessionId, state: initialState });
        });

        socket.on('game:join', ({ sessionId }) => {
            const session = activeGames[sessionId];
            if (session) {
                // Also make sure they are in the Socket.IO room so they get future updates
                socket.emit('game:state', { sessionId, state: session.state });
            } else {
                socket.emit('error', 'Game session not found or already ended.');
            }
        });

        socket.on('game:action', ({ roomCode, sessionId, action, playerId }) => {
            const session = activeGames[sessionId];
            if (!session) return; // Silently ignore late packets from laggy clients or recently ended games

            try {
                const { newState, events } = session.game.applyAction(session.state, action, playerId);
                session.state = newState;
                io.to(roomCode).emit('game:state', { sessionId, state: newState });

                if (session.game.isOver(newState)) {
                    const result = session.game.getResult(newState);

                    // Convert Winner IDs to usernames
                    const winnerNames = result.winners.map((wId: string) => {
                        const player = session.players.find((p: any) => p.id === wId);
                        return player ? player.username : wId;
                    });

                    const gameName = session.game.constructor.name;
                    const players = session.players;

                    delete activeGames[sessionId];

                    // Delay end screen to allow visual animations
                    const delayMs = gameName === 'Chess' ? 3000 : 500;
                    setTimeout(() => {
                        saveGamePoints(result, players, gameName);
                        io.to(roomCode).emit('game:end', { sessionId, ...result, winners: winnerNames });
                    }, delayMs);
                }
            } catch (err: any) {
                socket.emit('error', err.message);
            }
        });

        socket.on('game:leave', ({ sessionId, playerId, roomCode }) => {
            const session = activeGames[sessionId];
            if (!session) return;

            // For MVP: if ANY player leaves, the session is aborted to prevent stuck game state
            const result = { winners: [], summary: { aborted: true, reason: 'A player left the game.' } };
            // Do not save points if the game was aborted
            io.to(roomCode).emit('game:end', { sessionId, ...result, winners: [] });
            delete activeGames[sessionId];
        });
    });

    // 1-second Tick Loop for timer-based games (like Quiz)
    setInterval(() => {
        for (const [sessionId, session] of Object.entries(activeGames)) {
            if (session.game.tick) {
                const { newState } = session.game.tick(session.state);
                session.state = newState;
                io.to(session.roomCode).emit('game:state', { sessionId, state: newState });

                if (session.game.isOver(newState)) {
                    const result = session.game.getResult(newState);
                    const winnerNames = result.winners.map((wId: string) => {
                        const player = session.players.find((p: any) => p.id === wId);
                        return player ? player.username : wId;
                    });

                    const gameName = session.game.constructor.name;
                    const players = session.players;
                    const roomCode = session.roomCode;

                    delete activeGames[sessionId];

                    const delayMs = gameName === 'Chess' ? 3000 : 500;
                    setTimeout(() => {
                        saveGamePoints(result, players, gameName);
                        io.to(roomCode).emit('game:end', { sessionId, ...result, winners: winnerNames });
                    }, delayMs);
                }
            }
        }
    }, 1000);

    // 30Hz Tick Loop for physics-based games (like Haxball)
    setInterval(() => {
        for (const [sessionId, session] of Object.entries(activeGames)) {
            if (session.game.tickPhysics) {
                const { newState } = session.game.tickPhysics(session.state, 1 / 30);
                session.state = newState;
                // Emit highly compressed state if possible, but for MVP standard state is fine
                io.to(session.roomCode).emit('game:state', { sessionId, state: newState });

                if (session.game.isOver(newState)) {
                    const result = session.game.getResult(newState);
                    const winnerNames = result.winners.map((wId: string) => {
                        const player = session.players.find((p: any) => p.id === wId);
                        return player ? player.username : wId;
                    });

                    const gameName = session.game.constructor.name;
                    const players = session.players;
                    const roomCode = session.roomCode;

                    delete activeGames[sessionId];

                    const delayMs = gameName === 'Chess' ? 3000 : 500;
                    setTimeout(() => {
                        saveGamePoints(result, players, gameName);
                        io.to(roomCode).emit('game:end', { sessionId, ...result, winners: winnerNames });
                    }, delayMs);
                }
            }
        }
    }, 1000 / 30);
};
