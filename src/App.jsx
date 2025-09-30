import { useState, useEffect } from 'react';
import UsernameForm from './components/UsernameForm'
import ChatArea from './components/ChatArea'
import './App.css'

function App() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('chatty-username');
    if (stored) setUsername(stored);
  }, []);

  const handleLogin = (inputUsername) => {
    localStorage.setItem("chatty-username", inputUsername)
    setUsername(inputUsername)
  }

  const handleLogOut = () => {
    localStorage.removeItem("chatty-username")
    setUsername('')
  };

  return (
    <>
      {username ? <ChatArea /> : <UsernameForm onSubmit={handleLogin} />}
      <button onClick={handleLogOut}>Logout</button>
    </>
  )
}

export default App
