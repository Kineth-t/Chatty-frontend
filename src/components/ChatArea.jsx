import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';
import './ChatArea.css';

export default function ChatArea({ username }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    connect();

    // Cleanup on unmount
    return () => {
      if (stompClientRef.current && connected) {
        // Send LEAVE notification before disconnecting
        stompClientRef.current.send(
          '/app/chat.removeUser',
          {},
          JSON.stringify({ sender: username, type: 'LEAVE' })
        );
        stompClientRef.current.disconnect();
      }
    };
  }, [username]);

  const connect = () => {
    // Create SockJS connection (update URL to match your backend)
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);

    // Optional: disable debug logging
    stompClient.debug = null;

    // Connect to WebSocket
    stompClient.connect(
      {},
      (frame) => {
        console.log('Connected: ' + frame);
        setConnected(true);

        // Subscribe to public chat messages
        stompClient.subscribe('/topic/public', (messageOutput) => {
          const receivedMessage = JSON.parse(messageOutput.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });

        // Send JOIN notification
        stompClient.send(
          '/app/chat.addUser',
          {},
          JSON.stringify({ sender: username, type: 'JOIN' })
        );
      },
      (error) => {
        console.error('Connection error:', error);
        setConnected(false);
        // Retry connection after 5 seconds
        setTimeout(connect, 5000);
      }
    );

    stompClientRef.current = stompClient;
  };

  const handleSendMessage = () => {
    if (message.trim() && stompClientRef.current && connected) {
      const chatMessage = {
        sender: username,
        content: message,
        type: 'CHAT'
      };

      // Send message to server
      stompClientRef.current.send(
        '/app/chat.sendMessage',
        {},
        JSON.stringify(chatMessage)
      );

      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Connection status indicator */}
      <div className="connection-status">
        <span className={connected ? 'connected' : 'disconnected'}>
          {connected ? '● Connected' : '● Disconnected'}
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => {
          // Handle JOIN/LEAVE messages
          if (msg.type === 'JOIN' || msg.type === 'LEAVE') {
            return (
              <div key={index} className="chat-message system-message">
                {msg.sender} {msg.type === 'JOIN' ? 'joined' : 'left'} the chat
              </div>
            );
          }

          // Handle regular chat messages
          const isOwnMessage = msg.sender === username;
          return (
            <div key={index} className={`chat-message ${isOwnMessage ? 'sent' : 'received'}`}>
              <span className="sender">{msg.sender}: </span>
              {msg.content}
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={!connected}
        />
        <button onClick={handleSendMessage} disabled={!connected || !message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}