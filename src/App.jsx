import { useState } from 'react';
import UsernameForm from './components/UsernameForm';
import ChatArea from './components/ChatArea';
import './App.css';

function App() {
  const [username, setUsername] = useState('');

  const handleLogin = (inputUsername) => {
    setUsername(inputUsername);
  };

  const handleLogOut = () => {
    setUsername('');
  };

  return (
    <div className='background-cover'>
      {username ? (
        <ChatArea username={username} handleLogOut={handleLogOut} />
      ) : (
        <UsernameForm onSubmit={handleLogin} />
      )}
    </div>
  );
}

export default App;