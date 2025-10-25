import Message from './Message';

export default function MessagesContainer({ messages, currentUserUsername }) {
    return (
        <div className="messages-container">
            {messages.map((msg, index) => (
            <Message
                key={msg.id || index}
                msg={msg}
                currentUserUsername={currentUserUsername}
            />
            ))}
        </div>
    )
}