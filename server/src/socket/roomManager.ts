import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
    const roomStates: Record<string, { ownerId: string, members: { id: string, username: string }[], selectedGame?: string }> = {};
    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on('room:join', ({ roomCode, user, gameId }) => {
            console.log(`[DEBUG] room:join -> code: ${roomCode}, gameId: ${gameId}, user: ${user?.username}`);
            socket.join(roomCode);

            // Validate user object
            const roomUser = user && user.id ? user : { id: socket.id, username: 'Invité_' + socket.id.substring(0, 4) };

            if (!roomStates[roomCode]) {
                roomStates[roomCode] = { ownerId: roomUser.id, members: [], selectedGame: gameId || 'TicTacToe' };
            } else if (gameId && roomStates[roomCode].ownerId === roomUser.id) {
                // If owner rejoins with a specific game, update the lock.
                roomStates[roomCode].selectedGame = gameId;
            }

            const roomData = roomStates[roomCode];
            const isAlreadyMember = roomData.members.find((u: any) => u.id === roomUser.id);

            // Check capacity before adding new member
            if (!isAlreadyMember) {
                const currentGame = roomData.selectedGame || 'TicTacToe';
                let maxPlayers = 99;
                if (currentGame === 'TicTacToe' || currentGame === 'Connect4' || currentGame === 'Chess') maxPlayers = 2;
                else if (currentGame === 'Haxball' || currentGame === 'Ludo') maxPlayers = 4;
                else if (currentGame === 'UNO') maxPlayers = 10;

                if (roomData.members.length >= maxPlayers) {
                    socket.emit('room:error', 'Room is full for this game type.');
                    socket.leave(roomCode);
                    return;
                }
                roomData.members.push(roomUser);
            }

            console.log(`${roomUser.username} joined room ${roomCode} with Game ${roomData.selectedGame}`);

            io.to(roomCode).emit('room:state', { ownerId: roomData.ownerId, members: roomData.members, selectedGame: roomData.selectedGame });
            io.to(roomCode).emit('room:chat', {
                id: crypto.randomUUID(),
                sender: 'System',
                message: `User joined the room!`,
                timestamp: Date.now()
            });
        });

        socket.on('room:chat:send', ({ roomCode, sender, message }) => {
            io.to(roomCode).emit('room:chat', {
                id: crypto.randomUUID(),
                sender,
                message,
                timestamp: Date.now()
            });
        });

        socket.on('room:game:select', ({ roomCode, gameId }) => {
            io.to(roomCode).emit('room:game:select', gameId);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
            for (const [code, data] of Object.entries(roomStates)) {
                data.members = data.members.filter(u => u.id !== socket.id);
                io.to(code).emit('room:state', { ownerId: data.ownerId, members: data.members, selectedGame: data.selectedGame });

                // Cleanup empty rooms to prevent memory leaks
                if (data.members.length === 0) {
                    delete roomStates[code];
                }
            }
        });

        // Explicit leave event
        socket.on('room:leave', ({ roomCode, userId }) => {
            const data = roomStates[roomCode];
            if (!data) return;

            data.members = data.members.filter(u => u.id !== userId && u.id !== socket.id);
            io.to(roomCode).emit('room:state', { ownerId: data.ownerId, members: data.members, selectedGame: data.selectedGame });

            if (data.members.length === 0) {
                delete roomStates[roomCode];
            }
        });
    });
};
