import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';
import './ChatArea.css';

export default function ChatArea({ username }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [recipient, setRecipient] = useState(''); // Who to send messages to
  const [onlineUsers, setOnlineUsers] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    connect();

    // Cleanup on unmount
    return () => {
      if (stompClientRef.current && connected) {
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

        // Subscribe to private messages for this user
        stompClient.subscribe(`/user/${username}/queue/messages`, (messageOutput) => {
          const receivedMessage = JSON.parse(messageOutput.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });

        // Subscribe to broadcast
        stompClient.subscribe('/user/public', (messageOutput) => {
          const receivedMessage = JSON.parse(messageOutput.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });

        // Optional: Subscribe to online users list
        stompClient.subscribe('/topic/online-users', (userList) => {
          const users = JSON.parse(userList.body);
          setOnlineUsers(users.filter(user => user !== username));
        });

        // Register this user as online
        stompClient.send(
          '/app/user.addUser',
          {},
          JSON.stringify({ username: username, status: 'ONLINE' })
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
    if (message.trim() && recipient && stompClientRef.current && connected) {
      const chatMessage = {
        sender: username,
        recipient: recipient,
        content: message,
        timestamp: new Date().toISOString()
      };

      // Send private message to specific user
      stompClientRef.current.send(
        '/app/chat.sendPrivateMessage',
        {},
        JSON.stringify(chatMessage)
      );

      // Add message to local state (sent message)
      setMessages((prev) => [...prev, { ...chatMessage, type: 'SENT' }]);
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
      {/* Header with connection status */}
      <div className="chat-header">
        <div className="connection-status">
          <span className={connected ? 'connected' : 'disconnected'}>
            {connected ? '● Connected' : '● Disconnected'}
          </span>
          <span className="username">Logged in as: {username}</span>
        </div>

        {/* Recipient Selector */}
        <div className="recipient-selector">
          <label>Chat with: </label>
          <select 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!connected}
          >
            <option value="">Select a user...</option>
            {onlineUsers.map((user, index) => (
              <option key={index} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {!recipient ? (
          <div className="no-recipient">
            <p>👋 Select a user to start chatting</p>
          </div>
        ) : messages.filter(msg => 
          msg.sender === recipient || msg.recipient === recipient
        ).length === 0 ? (
          <div className="no-messages">
            <p>No messages yet with {recipient}</p>
            <p className="hint">Start the conversation!</p>
          </div>
        ) : (
          messages
            .filter(msg => msg.sender === recipient || msg.recipient === recipient)
            .map((msg, index) => {
              const isOwnMessage = msg.sender === username;
              return (
                <div key={index} className={`chat-message ${isOwnMessage ? 'sent' : 'received'}`}>
                  <div className="message-content">
                    <span className="sender">{isOwnMessage ? 'You' : msg.sender}: </span>
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={recipient ? `Message ${recipient}...` : "Select a user first..."}
          disabled={!connected || !recipient}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!connected || !message.trim() || !recipient}
        >
          Send
        </button>
      </div>
    </div>
  );
}