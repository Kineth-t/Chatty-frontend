export default function ChatHeader({ selectedUser })
{
    return (
        <div className="chat-header">
        <div className="chat-user-avatar">
        {selectedUser.username[0].toUpperCase()}
        </div>
        <div>
        <h3 className="chat-username">{selectedUser.username}</h3>
        <p className="chat-status">Online</p>
        </div>
    </div>
    )
};