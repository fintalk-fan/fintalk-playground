import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');

  const handleLogin = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    // You can store the token in localStorage for persistence
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setAuthToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  // Check for existing token on component mount
  React.useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Welcome to FinTalk</h1>
          <p>You are now authenticated!</p>
          <div className="token-info">
            <p><strong>Token:</strong> {authToken.substring(0, 20)}...</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
