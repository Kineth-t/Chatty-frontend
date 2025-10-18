export default function UserItem({
    user,
    isSelected,
    notificationCount,
    onSelectUser
})
{
    return(
    <div
    onClick={onSelectUser}
    className={`user-item ${isSelected ? 'active' : ''}`}
    >
    <div className="user-item-content">
        <div className="user-avatar-container">
        <div className="user-avatar">{user.username[0].toUpperCase()}</div>
        <div className="online-indicator"></div>
        </div>
        <div>
        <p className="user-name">{user.username}</p>
        <p className="user-status">Online</p>
        </div>
    </div>
    {notificationCount > 0 && (
        <div className="notification-badge">{notificationCount}</div>
    )}
    </div>)
};