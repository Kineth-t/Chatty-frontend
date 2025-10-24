const BASE_URL = process.env.SPRING_BOOT_BACKEND_URL;

export const useAuth = () => {
  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Not authenticated');
    }
    return null;
  };

  const handleRegister = async (registerData) => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(registerData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return await response.json();
  };

  const handleLogin = async (loginData) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    return await response.json();
  };

  const handleLogout = async () => {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  };

  return { checkAuth, handleRegister, handleLogin, handleLogout };
};