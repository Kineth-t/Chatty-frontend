export default function Message({ msg, currentUserUsername }) {
    return (
        <div
            className={`message ${
            msg.sender === currentUserUsername ? 'sent' : 'received'
            }`}
        >
            <div className="message-bubble">
            <p className="message-content">{msg.content}</p>
            <p className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
                })}
            </p>
            </div>
        </div>
    )
};