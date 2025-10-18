import { SidebarHeader } from './SidebarHeader';
import { UsersList } from './UsersList';

export const Sidebar = ({
  currentUser,
  users,
  selectedUser,
  notifications,
  onSelectUser,
  onLogout
}) => (
  <div className="sidebar">
    <SidebarHeader currentUser={currentUser} onLogout={onLogout} />
    <UsersList
      users={users}
      selectedUser={selectedUser}
      notifications={notifications}
      onSelectUser={onSelectUser}
    />
  </div>
);