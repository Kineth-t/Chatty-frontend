import { useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const BASE_URL = process.env.SPRING_BOOT_BACKEND_URL;

export const useWebSocket = () => {
  const stompClient = useRef(null);

  const connectWebSocket = (currentUser, onUserUpdate, onNewMessage) => {
    try {
      const socket = new SockJS(`${BASE_URL}/ws`);
      const client = Stomp.over(socket);
      client.debug = () => {};

      client.connect(
        {},
        () => {
          console.log('WebSocket Connected');
          stompClient.current = client;

          client.subscribe('/topic/user', (message) => {
            const user = JSON.parse(message.body);
            onUserUpdate(user);
          });

          client.subscribe(
            `/user/${currentUser.username}/queue/messages`,
            (message) => {
              const notification = JSON.parse(message.body);
              onNewMessage(notification);
            }
          );

          client.send(
            '/app/user.addUser',
            {},
            JSON.stringify({ username: currentUser.username, status: 'ONLINE' })
          );
        },
        (error) => {
          console.error('WebSocket connection error:', error);
        }
      );
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = (currentUsername) => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(
        '/app/user.disconnectUser',
        {},
        JSON.stringify({ username: currentUsername })
      );
      stompClient.current.disconnect();
    }
  };

  const sendMessage = (chatMessage) => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send('/app/chat', {}, JSON.stringify(chatMessage));
    } else {
      throw new Error('WebSocket not connected');
    }
  };

  return { connectWebSocket, disconnect, sendMessage, stompClient };
};