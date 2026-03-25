import { useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const BASE_URL = import.meta.env.VITE_SPRING_BOOT_BACKEND_URL;

// Encapsulates real-time chat connection logic
export const useWebSocket = () => {
  // These values should not trigger re-renders
  // They persist across renders
  const stompClient = useRef(null);
  const isConnecting = useRef(false);

  // Connect to WebSocket
  const connectWebSocket = (currentUser, onUserUpdate, onNewMessage) => {
    // Guard clause
    // Prevents duplicate connections and race conditions
    if (stompClient.current?.connected || isConnecting.current) {
      return;
    }

    isConnecting.current = true;

    try {
      const socket = new SockJS(`${BASE_URL}/ws`); // Create socket
      const client = Stomp.over(socket); // Wrap with STOMP
      client.debug = () => {};

      client.connect(
        {},
        () => {
          console.log('WebSocket Connected');
          stompClient.current = client;
          isConnecting.current = false;

          // Subscription
          client.subscribe('/topic/user', (message) => {
            const user = JSON.parse(message.body);
            onUserUpdate(user);
          });

          // Subscription
          client.subscribe(
            `/user/${currentUser.username}/queue/messages`,
            (message) => {
              const notification = JSON.parse(message.body);
              onNewMessage(notification);
            }
          );

          // Notify backend user is online
          client.send(
            '/app/user.addUser',
            {},
            JSON.stringify({ username: currentUser.username, status: 'ONLINE' })
          );
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          isConnecting.current = false;
        }
      );
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      isConnecting.current = false;
    }
  };

  // Disconnect
  const disconnect = (currentUsername) => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(
        '/app/user.disconnectUser',
        {},
        JSON.stringify({ username: currentUsername })
      ); // Notify backend user is offline
      stompClient.current.disconnect();
    }
    stompClient.current = null;
    isConnecting.current = false;
  };

  // Send messages
  const sendMessage = (chatMessage) => {
    // Prevents sending when disconnected
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send('/app/chat', {}, JSON.stringify(chatMessage));
    } else {
      throw new Error('WebSocket not connected');
    }
  };

  return { connectWebSocket, disconnect, sendMessage, stompClient };
};