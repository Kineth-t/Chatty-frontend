import { useState } from "react";

export default function ChatArea() {
    const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]); // Placeholder for messages

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: 'You' }]);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
            <span>{msg.sender}: </span>{msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Type your message..." 
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}