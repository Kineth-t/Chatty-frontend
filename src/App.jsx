import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Users } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notifications, setNotifications] = useState({});
  const [connectionError, setConnectionError] = useState('');
  
  const stompClient = useRef(null);
  const BASE_URL = 'http://localhost:8088';

  useEffect(() => {
    if (isConnected) {
      connectWebSocket();
      fetchConnectedUsers();
    }
    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (selectedUser) {
      fetchChatMessages(username, selectedUser.username);
      clearNotifications(selectedUser.username);
    }
  }, [selectedUser, username]);

  const connectWebSocket = () => {
    try {
      const socket = new SockJS(`${BASE_URL}/ws`);
      const client = Stomp.over(socket);
      
      client.debug = () => {};
      
      client.connect(
        {},
        () => {
          console.log('WebSocket Connected');
          stompClient.current = client;
          setConnectionError('');
          
          client.subscribe('/topic/user', (message) => {
            const user = JSON.parse(message.body);
            console.log('User update:', user);
            fetchConnectedUsers();
          });

          client.subscribe(`/user/${username}/queue/messages`, (message) => {
            const notification = JSON.parse(message.body);
            console.log('Received message:', notification);
            
            if (selectedUser && selectedUser.username === notification.sender) {
              setMessages(prev => [...prev, {
                id: notification.id,
                sender: notification.sender,
                recipient: notification.recipient,
                content: notification.content,
                timestamp: notification.timestamp || new Date()
              }]);
            } else {
              setNotifications(prev => ({
                ...prev,
                [notification.sender]: (prev[notification.sender] || 0) + 1
              }));
            }
          });

          client.send('/app/user.addUser', {}, JSON.stringify({ username, status: 'ONLINE' }));
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          setConnectionError('Failed to connect to chat server. Make sure the backend is running on port 8088.');
        }
      );
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Error creating WebSocket connection. Please try again.');
    }
  };

  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.filter(u => u.username !== username));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChatMessages = async (sender, recipient) => {
    try {
      const response = await fetch(`${BASE_URL}/messages/${sender}/${recipient}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && selectedUser && stompClient.current && stompClient.current.connected) {
      const chatMessage = {
        sender: username,
        recipient: selectedUser.username,
        content: messageInput.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        stompClient.current.send('/app/chat', {}, JSON.stringify(chatMessage));
        
        setMessages(prev => [...prev, {
          ...chatMessage,
          timestamp: new Date()
        }]);
        setMessageInput('');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please check your connection.');
      }
    }
  };

  const handleLogin = () => {
    if (username.trim()) {
      setIsConnected(true);
    }
  };

  const handleLogout = () => {
    if (stompClient.current && stompClient.current.connected) {
      try {
        stompClient.current.send('/app/user.disconnectUser', {}, JSON.stringify({ username }));
        stompClient.current.disconnect(() => {
          console.log('Disconnected from WebSocket');
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    setIsConnected(false);
    setUsername('');
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
    setNotifications({});
    setConnectionError('');
  };

  const clearNotifications = (user) => {
    setNotifications(prev => {
      const updated = { ...prev };
      delete updated[user];
      return updated;
    });
  };

  if (!isConnected) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Chatty</h1>
          {connectionError && (
            <div className="error-message">
              {connectionError}
            </div>
          )}
          <div className="login-form">
            <label className="login-label">Enter your username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="login-input"
              placeholder="Username"
            />
            <button onClick={handleLogin} className="login-button">
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="avatar">{username[0].toUpperCase()}</div>
            <div>
              <h2 className="username">{username}</h2>
              <p className="status">Online</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={20} />
          </button>
        </div>

        <div className="users-container">
          <div className="users-header">
            <Users size={18} />
            <h3>Online Users ({users.length})</h3>
          </div>
          <div className="users-list">
            {users.map((user) => (
              <div
                key={user.username}
                onClick={() => setSelectedUser(user)}
                className={`user-item ${selectedUser?.username === user.username ? 'active' : ''}`}
              >
                <div className="user-item-content">
                  <div className="user-avatar-container">
                    <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                    <div className="online-indicator"></div>
                  </div>
                  <div>
                    <p className="user-name">{user.username}</p>
                    <p className="user-status">Online</p>
                  </div>
                </div>
                {notifications[user.username] > 0 && (
                  <div className="notification-badge">
                    {notifications[user.username]}
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="no-users">No users online</p>
            )}
          </div>
        </div>
      </div>

      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-avatar">{selectedUser.username[0].toUpperCase()}</div>
              <div>
                <h3 className="chat-username">{selectedUser.username}</h3>
                <p className="chat-status">Online</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.sender === username ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <p className="message-content">{msg.content}</p>
                    <p className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="send-button">
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;