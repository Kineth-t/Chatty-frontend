import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Users } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Auth form fields
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  // User data
  const [currentUser, setCurrentUser] = useState(null);
  
  // Chat state
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notifications, setNotifications] = useState({});
  
  // Reference to track currently selected user
  const selectedUserRef = useRef(null);

  const stompClient = useRef(null);
  const BASE_URL = process.env.SPRING_BOOT_BACKEND_URL;

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      connectWebSocket();
      fetchConnectedUsers();
    }
    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      selectedUserRef.current = selectedUser; // Update ref
      fetchChatMessages(currentUser.username, selectedUser.username);
      clearNotifications(selectedUser.username);
    }
  }, [selectedUser, currentUser]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: 'include'  // Send cookies
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Important: Send/receive cookies
        body: JSON.stringify(registerData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      setCurrentUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError(error.message || 'Registration failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Important: Send/receive cookies
        body: JSON.stringify(loginData)
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setCurrentUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError('Invalid username or password');
    }
  };

  const connectWebSocket = () => {
    try {
      const socket = new SockJS(`${BASE_URL}/ws`);
      const client = Stomp.over(socket);
      
      client.debug = () => {};
      
      // SockJS automatically sends cookies
      client.connect(
        {},
        () => {
          console.log('WebSocket Connected');
          stompClient.current = client;
          
          client.subscribe('/topic/user', (message) => {
            const user = JSON.parse(message.body);
            console.log('User update:', user);
            fetchConnectedUsers();
          });

          client.subscribe(`/user/${currentUser.username}/queue/messages`, (message) => {
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

          client.send('/app/user.addUser', {}, JSON.stringify({ 
            username: currentUser.username, 
            status: 'ONLINE' 
          }));
        },
        (error) => {
          console.error('WebSocket connection error:', error);
        }
      );
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users`, {
        credentials: 'include'  // Send cookies
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.filter(u => u.username !== currentUser.username));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChatMessages = async (sender, recipient) => {
    try {
      const response = await fetch(`${BASE_URL}/messages/${sender}/${recipient}`, {
        credentials: 'include'  // Send cookies
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
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
        sender: currentUser.username,
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

  const handleLogout = async () => {
    if (stompClient.current && stompClient.current.connected) {
      try {
        stompClient.current.send('/app/user.disconnectUser', {}, JSON.stringify({ 
          username: currentUser.username 
        }));
        stompClient.current.disconnect();
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    // Call logout endpoint to clear cookie
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
    setNotifications({});
  };

  const clearNotifications = (user) => {
    setNotifications(prev => {
      const updated = { ...prev };
      delete updated[user];
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Chatty</h1>
          <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Chatty</h1>
          
          {authError && (
            <div className="error-message">{authError}</div>
          )}
          
          {showRegister ? (
            <form onSubmit={handleRegister} className="login-form">
              <h2 className="form-subtitle">Create Account</h2>
              
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="login-input"
                placeholder="Username"
                required
              />
              
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="login-input"
                placeholder="Email"
                required
              />
              
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                className="login-input"
                placeholder="Password"
                required
                minLength="6"
              />
              
              <button type="submit" className="login-button">
                Register
              </button>
              
              <p className="toggle-form">
                Already have an account?{' '}
                <span onClick={() => {
                  setShowRegister(false);
                  setAuthError('');
                }}>
                  Login here
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="login-form">
              <h2 className="form-subtitle">Welcome Back</h2>
              
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className="login-input"
                placeholder="Username"
                required
              />
              
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="login-input"
                placeholder="Password"
                required
              />
              
              <button type="submit" className="login-button">
                Login
              </button>
              
              <p className="toggle-form">
                Don't have an account?{' '}
                <span onClick={() => {
                  setShowRegister(true);
                  setAuthError('');
                }}>
                  Register here
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="avatar">{currentUser.username[0].toUpperCase()}</div>
            <div>
              <h2 className="username">{currentUser.username}</h2>
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
                onClick={() => {
                  setSelectedUser(user);
                  clearNotifications(user.username);
                  // Force refresh messages even if same user is clicked
                  if (selectedUser?.username === user.username) {
                    fetchChatMessages(currentUser.username, user.username);
                  }
                }}
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
                  className={`message ${msg.sender === currentUser.username ? 'sent' : 'received'}`}
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