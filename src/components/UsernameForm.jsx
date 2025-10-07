import { useState } from 'react';
import { Stomp } from 'stompjs';
import SockJS from 'sockjs-client';

const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

function UsernameForm({ onSubmit }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    stompClient.connect({}, () => {
      const user = {
        username: input,
        status: 'ONLINE'
      };

      stompClient.send('/app/user.addUser', {}, JSON.stringify(user));
      onSubmit(input);
    });
  };

  return (
    <div className="form-container">
        <form className="username-form" onSubmit={handleSubmit}>
            <h2>Enter a Username to Start Chatting</h2>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter username" />
            <button type="submit">Join</button>
        </form>
    </div>
  );
}

export default UsernameForm;
