import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';

export default function ChatArea({ username, handleLogOut }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (username) {
      fetchConnectedUsers();
      connect();
    }

    return () => {
      disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (recipient && username) {
      loadPreviousMessages(username, recipient);
    } else {
      setMessages([]);
    }
  }, [recipient, username]);

  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/users');
      if (response.ok) {
        const users = await response.json();
        console.log('Fetched users:', users);
        setOnlineUsers(users.filter(user => user.username !== username));
      }
    } catch (error) {
      console.error('Error fetching connected users:', error);
    }
  };

  const loadPreviousMessages = async (sender, receiver) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/messages/${sender}/${receiver}`);
      if (response.ok) {
        const previousMessages = await response.json();
        console.log('Loaded messages:', previousMessages);
        setMessages(previousMessages);
      } else {
        console.error('Failed to load previous messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const connect = () => {
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect(
      {},
      (frame) => {
        console.log('Connected: ' + frame);
        setConnected(true);

        // Subscribe to private messages
        stompClient.subscribe(`/user/${username}/queue/messages`, (messageOutput) => {
          console.log('Received message:', messageOutput.body);
          const notification = JSON.parse(messageOutput.body);
          
          // Only add message if it's from the current chat
          if (notification.sender === recipient || notification.recipient === recipient) {
            setMessages((prev) => [...prev, {
              id: notification.id,
              sender: notification.sender,
              recipient: notification.recipient,
              content: notification.content,
              timestamp: new Date().toISOString()
            }]);
          }
        });

        // Subscribe to user status updates - FIXED SUBSCRIPTION PATH
        stompClient.subscribe('/topic/user', (userMessage) => {
          console.log('User status update:', userMessage.body);
          const user = JSON.parse(userMessage.body);
          console.log('User status:', user);
          
          // Refresh the connected users list
          fetchConnectedUsers();
        });

        // Register this user as online
        stompClient.send(
          '/app/user.addUser',
          {},
          JSON.stringify({ 
            username: username, 
            status: 'ONLINE' 
          })
        );
        
        console.log('User registered:', username);
      },
      (error) => {
        console.error('Connection error:', error);
        setConnected(false);
        setTimeout(connect, 5000);
      }
    );

    stompClientRef.current = stompClient;
  };

  const disconnect = () => {
    if (stompClientRef.current && connected) {
      stompClientRef.current.send(
        '/app/user.disconnectUser',
        {},
        JSON.stringify({ 
          username: username, 
          status: 'OFFLINE' 
        })
      );
      
      stompClientRef.current.disconnect(() => {
        console.log('Disconnected');
      });
      setConnected(false);
    }
  };

  const handleLogoutClick = () => {
    disconnect();
    handleLogOut();
  };

  const handleSendMessage = () => {
    if (message.trim() && recipient && stompClientRef.current && connected) {
      const chatMessage = {
        sender: username,
        recipient: recipient,
        content: message.trim(),
        timestamp: new Date()
      };

      console.log('Sending message:', chatMessage);

      stompClientRef.current.send(
        '/app/chat',
        {},
        JSON.stringify(chatMessage)
      );

      // Add sent message to local state
      setMessages((prev) => [...prev, {
        ...chatMessage,
        timestamp: chatMessage.timestamp.toISOString()
      }]);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.statusBar}>
          <span style={{
            ...styles.statusDot,
            backgroundColor: connected ? '#10b981' : '#ef4444'
          }}>
            ●
          </span>
          <span style={styles.statusText}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span style={styles.username}>• {username}</span>
          <button 
            onClick={handleLogoutClick}
            style={styles.logoutButton}
            title="Logout"
          >
            Logout
          </button>
        </div>

        <div style={styles.recipientSelector}>
          <label style={styles.label}>Chat with: </label>
          <select 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!connected}
            style={styles.select}
          >
            <option value="">Select a user...</option>
            {onlineUsers.map((user) => (
              <option key={user.username} value={user.username}>
                {user.username} {user.status === 'ONLINE' ? '🟢' : '⚫'}
              </option>
            ))}
          </select>
          <button 
            onClick={fetchConnectedUsers}
            style={styles.refreshButton}
            disabled={!connected}
            title="Refresh user list"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {!recipient ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>No chat selected</p>
            <p style={styles.emptyText}>
              {onlineUsers.length > 0 
                ? `${onlineUsers.length} user${onlineUsers.length > 1 ? 's' : ''} online. Choose one to start chatting!`
                : 'No other users online yet'}
            </p>
          </div>
        ) : loading ? (
          <div style={styles.emptyState}>
            <div style={styles.loadingSpinner}>⏳</div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👋</div>
            <p style={styles.emptyTitle}>No messages yet</p>
            <p style={styles.emptyText}>Start the conversation with {recipient}!</p>
          </div>
        ) : (
          <div style={styles.messagesList}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender === username;
              return (
                <div 
                  key={msg.id || index} 
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    ...styles.messageBubble,
                    backgroundColor: isOwnMessage ? '#3b82f6' : '#e5e7eb',
                    color: isOwnMessage ? 'white' : '#1f2937'
                  }}>
                    {!isOwnMessage && (
                      <div style={styles.senderName}>{msg.sender}</div>
                    )}
                    <div style={styles.messageContent}>{msg.content}</div>
                    {msg.timestamp && (
                      <div style={{
                        ...styles.timestamp,
                        color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#6b7280'
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={recipient ? `Message ${recipient}...` : "Select a user first..."}
          disabled={!connected || !recipient}
          style={styles.input}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!connected || !message.trim() || !recipient}
          style={{
            ...styles.button,
            opacity: (!connected || !message.trim() || !recipient) ? 0.5 : 1,
            cursor: (!connected || !message.trim() || !recipient) ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '90vw',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px'
  },
  statusDot: {
    fontSize: '12px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  statusText: {
    fontWeight: '500',
    color: '#374151'
  },
  username: {
    color: '#6b7280',
    flex: 1
  },
  logoutButton: {
    padding: '6px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  recipientSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    flex: 1,
    cursor: 'pointer',
    backgroundColor: 'white'
  },
  refreshButton: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f9fafb'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6b7280'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  loadingSpinner: {
    fontSize: '48px',
    marginBottom: '16px',
    animation: 'spin 2s linear infinite'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#374151'
  },
  emptyText: {
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    maxWidth: '300px'
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageWrapper: {
    display: 'flex',
    width: '100%'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  senderName: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  timestamp: {
    fontSize: '11px',
    marginTop: '4px'
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'white'
  },
  input: {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  }
};