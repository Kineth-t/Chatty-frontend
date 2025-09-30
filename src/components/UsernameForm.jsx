import { useState } from "react"

export default function UsernameForm({ onSubmit }) {
    const [inputUsername, setInputUsername] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = inputUsername.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Enter a Username to Start Chatting</h2>
            <form onSubmit={handleSubmit}>
                <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Enter username"
                />
                <button type="submit">Start Chat</button>
            </form>
        </div>
    );
}