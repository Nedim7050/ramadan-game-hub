import { io, Socket } from 'socket.io-client';

const NEXT_PUBLIC_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const socket: Socket = io(NEXT_PUBLIC_SOCKET_URL, {
    autoConnect: false,
});
