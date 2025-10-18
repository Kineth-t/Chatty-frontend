import { LogOut } from 'lucide-react';

export default function SidebarHeadef({ currentUser, onLogout }) {
    return (
        <div className="sidebar-header">
            <div className="user-info">
            <div className="avatar">{currentUser.username[0].toUpperCase()}</div>
            <div>
                <h2 className="username">{currentUser.username}</h2>
                <p className="status">Online</p>
            </div>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Logout">
            <LogOut size={20} />
            </button>
        </div>)
};