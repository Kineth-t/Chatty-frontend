const BASE_URL = import.meta.env.VITE_SPRING_BOOT_BACKEND_URL;

// Encapsulates all authentication logic
export const useAuth = () => {
  // Checking if user is logged i
  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: 'include' // Sends cookies with requests
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Not authenticated');
    }
    return null;
  };

  // Registering new user
  const handleRegister = async (registerData) => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Sends cookies with requests
      body: JSON.stringify(registerData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return await response.json();
  };

  // Logging in
  const handleLogin = async (loginData) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Sends cookies with requests
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    return await response.json();
  };

  // Logging out
  const handleLogout = async () => {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include' // Sends cookies with requests
    });
  };

  return { checkAuth, handleRegister, handleLogin, handleLogout };
};