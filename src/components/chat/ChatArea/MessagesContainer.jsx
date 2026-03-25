import { useRef, useEffect } from 'react';
import Message from './Message';

export default function MessagesContainer({ messages, currentUserUsername }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // Runs every time messages changes

    return (
        <div className="messages-container">
            {messages.map((msg, index) => (
            <Message
                key={msg.id || index}
                msg={msg}
                currentUserUsername={currentUserUsername}
            />
            ))}
            <div ref={bottomRef} /> {/* invisible anchor at the bottom */}
        </div>
    )
}