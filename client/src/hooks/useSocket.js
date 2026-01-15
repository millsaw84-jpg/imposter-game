import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Use same origin - Vite proxies /socket.io to the server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
      autoConnect: true
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
