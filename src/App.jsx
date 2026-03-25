import { useState, useEffect, useRef } from 'react';
import LoadingScreen from './components/auth/LoadingScreen'
import AuthForm from './components/auth/AuthForm';
import ChatArea from './components/chat/ChatArea/ChatArea';
import Sidebar from './components/sidebar/SideBar';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useChat } from './hooks/useChat';
import './App.css';

const App = () => {
  // Auth & UI state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');

  // User & chat state
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Notification state (unread messages per user)
  const [notifications, setNotifications] = useState({});

  // Ref to always keep latest selected user
  const selectedUserRef = useRef(null);

  //Custom hooks
  const { checkAuth, handleRegister, handleLogin, handleLogout } = useAuth();
  const { connectWebSocket, disconnect, sendMessage } = useWebSocket();
  const { fetchConnectedUsers, fetchChatMessages } = useChat();

  // Check if user is already logged in
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

  // Setup WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      connectWebSocket(
        currentUser,
        (user) => fetchConnectedUsers(currentUser.username).then(setUsers), // Update user list
        (notification) => handleNewMessage(notification) // Handle incoming messages
      );
      fetchConnectedUsers(currentUser.username).then(setUsers); // Fetching of users

      return () => {
        disconnect(currentUser.username); // Cleanup on logout
      };
    }
  }, [isAuthenticated, currentUser]);
  // isAuthenticated ensures connection only happens after login
  // currentUser needed because WebSocket depends on user identity, if user changes it must reconnect

  // Fetch messages when selecting a user
  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (selectedUser && currentUser) {
      fetchChatMessages(currentUser.username, selectedUser.username).then(setMessages);
      clearNotifications(selectedUser.username);
    }
  }, [selectedUser, currentUser]);
  // selectedUser needed because when switch chats, it must fetch new messages
  // currentUser needed because messages depend on both users

  // Handle incoming message via WebSocket
  const handleNewMessage = (notification) => {
    // If chatting with sender, append message
    if (selectedUserRef.current && selectedUserRef.current.username === notification.sender) {
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
    }
    // else, increment notification count
    else {
      setNotifications((prev) => ({
        ...prev,
        [notification.sender]: (prev[notification.sender] || 0) + 1
      }));
    }
  };

  // Handle registration
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

  // Handle logging in
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

  // Handle send message
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUser) {
      const chatMessage = {
        sender: currentUser.username,
        recipient: selectedUser.username,
        content: messageInput.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        // Send via WebSocket
        sendMessage(chatMessage);
        // Update UI
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

  // Handle logout
  const handleLogoutClick = async () => {
    disconnect(currentUser.username);
    await handleLogout();

    // Reset all state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setSelectedUser(null);
    selectedUserRef.current = null;
    setMessages([]);
    setNotifications({});
  };

  // Select user to chat with
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    selectedUserRef.current = user;
    clearNotifications(user.username); // Clear notifications
  };

  // Clear notifications for a user
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