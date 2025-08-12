import React, { useState } from 'react';
import './Login.css';
import { API_ENDPOINTS } from '../config/api';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenAuthWindow = () => {
    const authUrl = API_ENDPOINTS.AUTH_LOGIN;
    const authWindow = window.open(authUrl, '_blank', 'width=800,height=600');

    if (authWindow) {
      // Focus the new window
      authWindow.focus();
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      setIsLoading(true);
      // Simulate a brief loading state
      setTimeout(() => {
        onLogin(token.trim());
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to FinTalk</h1>
          <p>Please authenticate to continue</p>
        </div>

        <div className="login-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Get Your Token</h3>
              <p>Click the button below to open the authentication page</p>
              <button
                className="auth-button"
                onClick={handleOpenAuthWindow}
                type="button"
              >
                Open Authentication
              </button>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Paste Your Token</h3>
              <p>Copy the Bearer token from the authentication page and paste it below</p>
              <form onSubmit={handleTokenSubmit}>
                <div className="token-input-container">
                  <label htmlFor="token-input">Bearer Token:</label>
                  <input
                    id="token-input"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your Bearer token here..."
                    className="token-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={!token.trim() || isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
