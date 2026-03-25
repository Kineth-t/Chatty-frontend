const BASE_URL = import.meta.env.VITE_SPRING_BOOT_BACKEND_URL;

// Encapsulates all data fetching logic for chats
export const useChat = () => {
  // Fetch connected users
  const fetchConnectedUsers = async (currentUsername) => {
    const response = await fetch(`${BASE_URL}/users`, {
      credentials: 'include' // Sends cookies with requests
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    const data = await response.json();
    return data.filter((u) => u.username !== currentUsername); // Ensure user don't see themselves in chat list
  };

  // Fetch messages between two users
  const fetchChatMessages = async (sender, recipient) => {
    const response = await fetch(`${BASE_URL}/messages/${sender}/${recipient}`, {
      credentials: 'include' // Sends cookies with requests
    });

    if (!response.ok) throw new Error('Failed to fetch messages');

    return await response.json();
  };

  return { fetchConnectedUsers, fetchChatMessages };
};