"use client";

import { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';

interface ChatProps {
  socket: Socket | null;
  roomCode: string;
  username: string;
}

/**
 * Composant de chat texte pour les rooms.  Écoute les messages via le socket
 * et offre une zone de saisie pour envoyer des messages.  Les messages
 * envoyés sont émis avec l’évènement `room:chat`.
 */
export default function Chat({ socket, roomCode, username }: ChatProps) {
  const [messages, setMessages] = useState<{ user: string; message: string }[]>([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    function onMessage(payload: { user: string; message: string }) {
      setMessages((prev) => [...prev, payload]);
    }
    socket.on('room:chat', onMessage);
    return () => {
      socket.off('room:chat', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!socket || !message.trim()) return;
    socket.emit('room:chat', { roomCode, message });
    setMessage('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-secondary rounded">
        {messages.map((m, idx) => (
          <div key={idx} className="mb-1">
            <span className="font-semibold text-primary">{m.user}: </span>
            <span className="text-white">{m.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-2 flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          className="flex-1 p-2 rounded-l bg-gray-700 text-white"
          placeholder="Votre message..."
        />
        <button
          onClick={sendMessage}
          className="bg-accent text-white px-4 py-2 rounded-r hover:bg-primary"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}