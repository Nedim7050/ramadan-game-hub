import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const socket: Socket = io(SERVER_URL, {
    autoConnect: false,
});
