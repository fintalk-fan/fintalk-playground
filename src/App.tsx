import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import CharacterList from './components/CharacterList';

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

  return <CharacterList authToken={authToken} onLogout={handleLogout} />;
}

export default App;
