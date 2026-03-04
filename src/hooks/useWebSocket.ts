// src/hooks/useWebSocket.ts
import { useEffect } from 'react';
import { websocketService, type WebSocketMessage } from '../services/websocket/socket.service';
import { useAuth } from './useAuth';

export const useWebSocket = (
  eventType: string,
  handler: (data: unknown) => void
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const wrappedHandler = (message: WebSocketMessage) => {
      // `message.data` is a string in our transport; most events send JSON.
      if (typeof message.data !== 'string') {
        handler(message.data);
        return;
      }

      try {
        handler(JSON.parse(message.data));
      } catch {
        handler(message.data);
      }
    };

    websocketService.on(eventType, wrappedHandler);

    return () => {
      websocketService.off(eventType, wrappedHandler);
    };
  }, [eventType, handler, user]);

  useEffect(() => {
    if (user) {
      websocketService.connect(user.clinic_id);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user]);
};
