import { Send } from 'lucide-react';

export default function MessageInput({
  messageInput,
  onMessageChange,
  onSendMessage
}) {
    return (
        <div className="message-input-container">
            <input
            type="text"
            value={messageInput}
            onChange={onMessageChange}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            className="message-input"
            placeholder="Type a message..."
            />
            <button onClick={onSendMessage} className="send-button">
            <Send size={20} />
            </button>
        </div>
    )
};