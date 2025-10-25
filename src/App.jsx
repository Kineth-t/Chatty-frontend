import { useState, useEffect } from 'react';
import LoadingScreen from './components/auth/LoadingScreen'
import AuthForm from './components/auth/AuthForm';
import ChatArea from './components/chat/ChatArea/ChatArea';
import Sidebar from './components/sidebar/SideBar';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useChat } from './hooks/useChat';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notifications, setNotifications] = useState({});

  const { checkAuth, handleRegister, handleLogin, handleLogout } = useAuth();
  const { connectWebSocket, disconnect, sendMessage } = useWebSocket();
  const { fetchConnectedUsers, fetchChatMessages } = useChat();

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const user = await checkAuth();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      connectWebSocket(
        currentUser,
        (user) => fetchConnectedUsers(currentUser.username).then(setUsers),
        (notification) => handleNewMessage(notification)
      );
      fetchConnectedUsers(currentUser.username).then(setUsers);

      return () => {
        disconnect(currentUser.username);
      };
    }
  }, [isAuthenticated, currentUser]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchChatMessages(currentUser.username, selectedUser.username).then(
        setMessages
      );
      clearNotifications(selectedUser.username);
    }
  }, [selectedUser, currentUser]);

  const handleNewMessage = (notification) => {
    if (selectedUser && selectedUser.username === notification.sender) {
      setMessages((prev) => [
        ...prev,
        {
          id: notification.id,
          sender: notification.sender,
          recipient: notification.recipient,
          content: notification.content,
          timestamp: notification.timestamp || new Date()
        }
      ]);
    } else {
      setNotifications((prev) => ({
        ...prev,
        [notification.sender]: (prev[notification.sender] || 0) + 1
      }));
    }
  };

  const handleRegisterSubmit = async (registerData) => {
    setAuthError('');
    try {
      const data = await handleRegister(registerData);
      setCurrentUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError(error.message || 'Registration failed');
    }
  };

  const handleLoginSubmit = async (loginData) => {
    setAuthError('');
    try {
      const data = await handleLogin(loginData);
      setCurrentUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError('Invalid username or password');
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUser) {
      const chatMessage = {
        sender: currentUser.username,
        recipient: selectedUser.username,
        content: messageInput.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        sendMessage(chatMessage);
        setMessages((prev) => [
          ...prev,
          { ...chatMessage, timestamp: new Date() }
        ]);
        setMessageInput('');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please check your connection.');
      }
    }
  };

  const handleLogoutClick = async () => {
    disconnect(currentUser.username);
    await handleLogout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
    setNotifications({});
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    clearNotifications(user.username);
  };

  const clearNotifications = (user) => {
    setNotifications((prev) => {
      const updated = { ...prev };
      delete updated[user];
      return updated;
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthForm
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        onLogin={handleLoginSubmit}
        onRegister={handleRegisterSubmit}
        authError={authError}
      />
    );
  }

  return (
    <div className="chat-container">
      <Sidebar
        currentUser={currentUser}
        users={users}
        selectedUser={selectedUser}
        notifications={notifications}
        onSelectUser={handleSelectUser}
        onLogout={handleLogoutClick}
      />
      <ChatArea
        selectedUser={selectedUser}
        messages={messages}
        messageInput={messageInput}
        currentUserUsername={currentUser.username}
        onMessageChange={(e) => setMessageInput(e.target.value)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default App;