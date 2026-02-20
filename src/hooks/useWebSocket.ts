// src/hooks/useWebSocket.ts
import { useEffect } from 'react';
import { websocketService } from '../services/websocket/socket.service';
import { useAuth } from './useAuth';

export const useWebSocket = (
  eventType: string,
  handler: (data: unknown) => void
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const wrappedHandler = (message: MessageEventInit) => {
      handler(message.data);
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
