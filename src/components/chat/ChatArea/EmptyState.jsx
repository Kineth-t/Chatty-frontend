import { Users } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>Select a user to start chatting</p>
        </div>
    )
};