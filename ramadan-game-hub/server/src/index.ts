import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { xoGame } from './games/xo.js';
import { quizGame } from './games/quiz.js';
import { truthOrDareGame } from './games/truthOrDare.js';
import type { GameModule, Player } from './types.js';

// Chargement des variables d’environnement
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PORT = parseInt(process.env.PORT || '4000', 10);

// Initialise le client Supabase côté serveur (service role pour manipuler la DB)
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Crée l’app Express et le serveur HTTP
const app = express();
app.use(cors());
const httpServer = http.createServer(app);

// Initialise Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

/**
 * Structure d’une room en mémoire.  Les rooms sont éphémères et gérées
 * entièrement côté serveur.  Pour la persistance, vous pouvez stocker
 * l’état dans une base de données ou Redis.
 */
interface Room {
  code: string;
  ownerId: string;
  players: Record<string, Player>; // key: userId, value: player
  sockets: Set<string>; // socket ids
  selectedGame: string;
  currentSessionId?: string;
}

/**
 * Structure d’une session de jeu.  Contient le module de jeu, l’état courant et
 * la liste des joueurs.
 */
interface GameSession<State = any, Action = any> {
  sessionId: string;
  roomCode: string;
  gameType: string;
  module: GameModule<State, Action>;
  state: State;
  players: string[];
}

const rooms: Record<string, Room> = {};
const sessions: Record<string, GameSession> = {};

/**
 * Génère un code unique pour les rooms du type RAM-XXXX.  Cette fonction
 * vérifie que le code n’est pas déjà utilisé.
 */
function generateRoomCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    const suffix = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    code = `RAM-${suffix}`;
  } while (rooms[code]);
  return code;
}

/**
 * Récupère l’ID utilisateur à partir du token JWT fourni dans le handshake.
 * Si le token est invalide, la fonction renvoie null.
 */
async function getUserIdFromSocket(socket: Socket): Promise<string | null> {
  const token = (socket.handshake.auth as any)?.token;
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Broadcast l’état actuel de la room à tous les clients de cette room.
 */
function broadcastRoomState(room: Room) {
  const payload = {
    players: Object.values(room.players),
    ownerId: room.ownerId,
    selectedGame: room.selectedGame,
  };
  io.to(room.code).emit('room:state', payload);
}

/**
 * Initialisation Socket.io.  À chaque connexion, on vérifie le token et on
 * attache l’ID utilisateur au socket pour le reste de la session.
 */
io.use(async (socket, next) => {
  const userId = await getUserIdFromSocket(socket);
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  (socket.data as any).userId = userId;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket.data as any).userId as string;
  console.log('User connected:', userId);

  /**
   * Créer une nouvelle room et y ajouter l’utilisateur comme owner.  Émet
   * l’évènement `room:created` avec le code.  L’utilisateur est automatiquement
   * prêt et rejoindra la room.
   */
  socket.on('room:create', async () => {
    const code = generateRoomCode();
    const room: Room = {
      code,
      ownerId: userId,
      players: {},
      sockets: new Set(),
      selectedGame: 'xo',
    };
    rooms[code] = room;
    // ajoute le joueur
    const profile = await getProfile(userId);
    room.players[userId] = { id: userId, username: profile?.username || userId.substring(0, 8), ready: false };
    room.sockets.add(socket.id);
    socket.join(code);
    socket.emit('room:created', { roomCode: code });
    broadcastRoomState(room);
  });

  /**
   * Joindre une room existante.  Si la room n’existe pas ou est pleine, on
   * renvoie une erreur.  Sinon l’utilisateur est ajouté et l’état est diffusé.
   */
  socket.on('room:join', async ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', { message: 'Room introuvable' });
      return;
    }
    // ajoute le joueur s’il n’est pas déjà présent
    if (!room.players[userId]) {
      const profile = await getProfile(userId);
      room.players[userId] = { id: userId, username: profile?.username || userId.substring(0, 8), ready: false };
    }
    room.sockets.add(socket.id);
    socket.join(room.code);
    socket.emit('room:joined', { roomCode: room.code });
    broadcastRoomState(room);
  });

  /**
   * Quitter une room.  Supprime le joueur et ferme la room si plus personne.
   */
  socket.on('room:leave', ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room) return;
    delete room.players[userId];
    room.sockets.delete(socket.id);
    socket.leave(roomCode);
    // si plus personne dans la room, on supprime
    if (Object.keys(room.players).length === 0) {
      delete rooms[roomCode];
    } else {
      broadcastRoomState(room);
    }
  });

  /**
   * Message de chat dans une room.
   */
  socket.on('room:chat', ({ roomCode, message }: { roomCode: string; message: string }) => {
    const room = rooms[roomCode];
    if (!room || !room.players[userId]) return;
    const username = room.players[userId].username;
    io.to(roomCode).emit('room:chat', { user: username, message });
  });

  /**
   * Marquer le joueur comme prêt ou non prêt.
   */
  socket.on('room:ready', ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
    const room = rooms[roomCode];
    if (!room || !room.players[userId]) return;
    room.players[userId].ready = isReady;
    broadcastRoomState(room);
  });

  /**
   * Sélectionner un jeu dans la room (seul l’owner peut le faire).
   */
  socket.on('game:select', ({ roomCode, gameType }: { roomCode: string; gameType: string }) => {
    const room = rooms[roomCode];
    if (!room || room.ownerId !== userId) return;
    room.selectedGame = gameType;
    broadcastRoomState(room);
  });

  /**
   * Démarrer une partie.  Seul l’owner peut démarrer si tous les joueurs sont prêts.
   */
  socket.on('game:start', ({ roomCode, gameType }: { roomCode: string; gameType: string }) => {
    const room = rooms[roomCode];
    if (!room || room.ownerId !== userId) return;
    // vérifie que tout le monde est prêt (ou si jeu truthOrDare on peut ignorer)
    const allReady = Object.values(room.players).every((p) => p.ready);
    if (!allReady) {
      socket.emit('error', { message: 'Tous les joueurs ne sont pas prêts' });
      return;
    }
    const players = Object.keys(room.players);
    let module: GameModule<any, any> | undefined;
    if (gameType === 'xo') module = xoGame;
    if (gameType === 'quiz') module = quizGame;
    if (gameType === 'truthOrDare') module = truthOrDareGame;
    if (!module) {
      socket.emit('error', { message: 'Jeu non supporté' });
      return;
    }
    const sessionId = randomUUID();
    const state = module.init(players, {});
    const session: GameSession = {
      sessionId,
      roomCode,
      gameType,
      module,
      state,
      players,
    };
    sessions[sessionId] = session;
    room.currentSessionId = sessionId;
    // réinitialise ready
    Object.values(room.players).forEach((p) => (p.ready = false));
    // notifie le client
    io.to(room.code).emit('game:started', { sessionId, gameType });
  });

  /**
   * Un joueur rejoint une session de jeu.  On renvoie l’état courant.
   */
  socket.on('game:join', ({ roomCode, sessionId }: { roomCode: string; sessionId: string }) => {
    const session = sessions[sessionId];
    if (!session) return;
    if (!session.players.includes(userId)) return;
    socket.join(sessionId);
    const payload = { state: { ...session.state, gameType: session.gameType } };
    socket.emit('game:state', payload);
  });

  /**
   * Traitement d’une action d’un joueur pendant une partie.
   */
  socket.on('game:action', ({ roomCode, sessionId, action }: { roomCode: string; sessionId: string; action: any }) => {
    const session = sessions[sessionId];
    if (!session) return;
    if (!session.players.includes(userId)) return;
    const { state: newState, events } = session.module.applyAction(session.state, action, userId);
    session.state = newState;
    // diffuse le nouvel état aux joueurs de la session
    io.to(roomCode).emit('game:state', { state: { ...session.state, gameType: session.gameType } });
    // si la partie est terminée, calcule le résultat, attribue les points et informe les joueurs
    if (session.module.isOver(session.state)) {
      const result = session.module.getResult(session.state);
      io.to(roomCode).emit('game:end', { sessionId, winners: result.winners, pointsDelta: {} });
      // enregistre dans la DB et attribue des points
      handleGameEnd(session, result.winners).catch((err) => console.error(err));
      // supprime la session
      delete sessions[sessionId];
    }
  });

  /**
   * Lorsque le socket se déconnecte, on retire l’utilisateur de toutes les rooms.
   */
  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      if (room.players[userId]) {
        delete room.players[userId];
        room.sockets.delete(socket.id);
        if (Object.keys(room.players).length === 0) {
          delete rooms[code];
        } else {
          broadcastRoomState(room);
        }
      }
    }
    console.log('User disconnected', userId);
  });
});

/**
 * Récupère le profil de l’utilisateur depuis Supabase.  Utilisé pour obtenir le
 * username lors de l’ajout à une room.
 */
async function getProfile(userId: string): Promise<{ username: string } | null> {
  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).single();
  if (error || !data) return null;
  return data;
}

/**
 * Gère la fin d’une partie : enregistre le résultat dans la table
 * `match_results`, crédite les points et actualise le ledger.  Pour simplifier,
 * nous utilisons un barème fixe : victoire = +10, participation = +1.
 */
async function handleGameEnd(session: GameSession, winners: string[]) {
  const { sessionId, gameType, players } = session;
  // On insère un enregistrement de résultat
  await supabase.from('match_results').insert({
    id: sessionId,
    session_id: sessionId,
    winner_user_id: winners[0] || null,
    points_awarded: winners.length > 0 ? 10 : 0,
    summary_json: session.module.getResult(session.state).summary,
  });
  // Crédite les points dans le ledger
  const updates = players.map((uid) => {
    const delta = winners.includes(uid) ? 10 : 1;
    return {
      id: randomUUID(),
      user_id: uid,
      delta_points: delta,
      reason: `Partie ${gameType}`,
      session_id: sessionId,
    };
  });
  await supabase.from('points_ledger').insert(updates);
}

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});