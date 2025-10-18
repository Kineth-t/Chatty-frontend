import { useState } from 'react';

export default function AuthForm({
  showRegister,
  setShowRegister,
  onLogin,
  onRegister,
  authError
})
{
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    onRegister(registerData);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin(loginData);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Chatty</h1>

        {authError && <div className="error-message">{authError}</div>}

        {showRegister ? (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <h2 className="form-subtitle">Create Account</h2>

            <input
              type="text"
              value={registerData.username}
              onChange={(e) =>
                setRegisterData({ ...registerData, username: e.target.value })
              }
              className="login-input"
              placeholder="Username"
              required
            />

            <input
              type="email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
              className="login-input"
              placeholder="Email"
              required
            />

            <input
              type="password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
              className="login-input"
              placeholder="Password"
              required
              minLength="6"
            />

            <button type="submit" className="login-button">
              Register
            </button>

            <p className="toggle-form">
              Already have an account?{' '}
              <span onClick={() => setShowRegister(false)}>Login here</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <h2 className="form-subtitle">Welcome Back</h2>

            <input
              type="text"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({ ...loginData, username: e.target.value })
              }
              className="login-input"
              placeholder="Username"
              required
            />

            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              className="login-input"
              placeholder="Password"
              required
            />

            <button type="submit" className="login-button">
              Login
            </button>

            <p className="toggle-form">
              Don't have an account?{' '}
              <span onClick={() => setShowRegister(true)}>Register here</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};