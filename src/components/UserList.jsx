import { Users } from 'lucide-react';
import { UserItem } from './UserItem';

export default function UsersList({
    users,
    selectedUser,
    notifications,
    onSelectUser
}) 
{
    return(
    <div className="users-container">
        <div className="users-header">
        <Users size={18} />
        <h3>Online Users ({users.length})</h3>
        </div>
        <div className="users-list">
        {users.map((user) => (
            <UserItem
            key={user.username}
            user={user}
            isSelected={selectedUser?.username === user.username}
            notificationCount={notifications[user.username] || 0}
            onSelectUser={() => onSelectUser(user)}
            />
        ))}
        {users.length === 0 && <p className="no-users">No users online</p>}
        </div>
    </div>)
};