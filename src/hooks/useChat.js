const BASE_URL = process.env.SPRING_BOOT_BACKEND_URL;

export const useChat = () => {
  const fetchConnectedUsers = async (currentUsername) => {
    const response = await fetch(`${BASE_URL}/users`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    const data = await response.json();
    return data.filter((u) => u.username !== currentUsername);
  };

  const fetchChatMessages = async (sender, recipient) => {
    const response = await fetch(`${BASE_URL}/messages/${sender}/${recipient}`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to fetch messages');

    return await response.json();
  };

  return { fetchConnectedUsers, fetchChatMessages };
};