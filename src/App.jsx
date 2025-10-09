import React, { useState, useEffect, useRef } from 'react';
// import { Send, LogOut, Users } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';

const App = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notifications, setNotifications] = useState({});
  
  const stompClient = useRef(null);
  const BASE_URL = 'http://localhost:8080';

  useEffect(() => {
    if (isConnected) {
      connectWebSocket();
      fetchConnectedUsers();
    }
    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect();
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (selectedUser) {
      fetchChatMessages(username, selectedUser.username);
      clearNotifications(selectedUser.username);
    }
  }, [selectedUser]);

  const connectWebSocket = () => {
    const socket = new SockJS(`${BASE_URL}/ws`);
    const client = Stomp.over(socket);
    
    client.connect({}, () => {
      stompClient.current = client;
      
      client.subscribe('/topic/user', (message) => {
        const user = JSON.parse(message.body);
        fetchConnectedUsers();
      });

      client.subscribe(`/user/${username}/queue/messages`, (message) => {
        const notification = JSON.parse(message.body);
        
        if (selectedUser && selectedUser.username === notification.sender) {
          setMessages(prev => [...prev, {
            id: notification.id,
            sender: notification.sender,
            recipient: notification.recipient,
            content: notification.content,
            timestamp: new Date()
          }]);
        } else {
          setNotifications(prev => ({
            ...prev,
            [notification.sender]: (prev[notification.sender] || 0) + 1
          }));
        }
      });

      client.send('/app/user.addUser', {}, JSON.stringify({ username, status: 'ONLINE' }));
    });
  };

  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users`);
      const data = await response.json();
      setUsers(data.filter(u => u.username !== username));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChatMessages = async (sender, recipient) => {
    try {
      const response = await fetch(`${BASE_URL}/messages/${sender}/${recipient}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && selectedUser && stompClient.current) {
      const chatMessage = {
        sender: username,
        recipient: selectedUser.username,
        content: messageInput,
        timestamp: new Date()
      };

      stompClient.current.send('/app/chat', {}, JSON.stringify(chatMessage));
      
      setMessages(prev => [...prev, chatMessage]);
      setMessageInput('');
    }
  };

  const handleLogin = () => {
    if (username.trim()) {
      setIsConnected(true);
    }
  };

  const handleLogout = () => {
    if (stompClient.current) {
      stompClient.current.send('/app/user.disconnectUser', {}, JSON.stringify({ username }));
      stompClient.current.disconnect();
    }
    setIsConnected(false);
    setUsername('');
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Chatty</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Username"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-blue-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white text-blue-500 rounded-full flex items-center justify-center font-bold">
                {username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold">{username}</h2>
                <p className="text-xs text-blue-100">Online</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-blue-600 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center space-x-2 text-gray-600 mb-3">
              <Users size={18} />
              <h3 className="font-semibold">Online Users ({users.length})</h3>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.username}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedUser?.username === user.username
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </div>
                    {notifications[user.username] > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {notifications[user.username]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 text-center py-8">No users online</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedUser.username}</h3>
                  <p className="text-sm text-green-500">Online</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === username
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === username ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;