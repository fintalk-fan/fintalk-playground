import React, { useState, useEffect } from 'react';
import './CharacterList.css';
import CreateSessionModal from './CreateSessionModal';
import ChatSession from './ChatSession';

interface Character {
  id: string;
  name: string;
  genre: string[];
  background_template: string;
  scenario_template: string;
  user_role_template: string;
}

interface Session {
  id: string;
  account_id: string;
  character_id: string;
  background: string;
  scenario: string;
  user_role: string;
}

interface CharacterListProps {
  authToken: string;
  onLogout: () => void;
}

const CharacterList: React.FC<CharacterListProps> = ({ authToken, onLogout }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchData();
  }, [authToken]);

    const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch characters
      const charactersResponse = await fetch('https://api.fintalk.fan/characters/list', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!charactersResponse.ok) {
        throw new Error(`HTTP error! status: ${charactersResponse.status}`);
      }

      const charactersData = await charactersResponse.json();
      setCharacters(charactersData);

      // Fetch sessions
      const sessionsResponse = await fetch('https://api.fintalk.fan/sessions/list', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!sessionsResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionsResponse.status}`);
      }

      const sessionsData = await sessionsResponse.json();
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleSessionCreated = (sessionId: string) => {
    // Create a temporary session object to navigate immediately
    const newSession: Session = {
      id: sessionId,
      account_id: '', // Will be filled when data is fetched
      character_id: selectedCharacter?.id || '',
      background: selectedCharacter?.background_template || '',
      scenario: selectedCharacter?.scenario_template || '',
      user_role: selectedCharacter?.user_role_template || ''
    };

    // Navigate immediately to the new session
    setSelectedSession(newSession);

    // Refresh the sessions list in the background
    fetchData();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  const handleContinueSession = (session: Session) => {
    setSelectedSession(session);
  };

  const handleBackFromChat = () => {
    setSelectedSession(null);
  };

    if (selectedSession) {
    return (
      <ChatSession
        session={selectedSession}
        authToken={authToken}
        onBack={handleBackFromChat}
      />
    );
  }

  if (loading) {
    return (
      <div className="character-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading characters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-list-container">
        <div className="error-container">
          <h2>Error Loading Characters</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="character-list-container">
      <div className="character-list-header">
        <div className="header-top">
          <h1>FinTalk Dashboard</h1>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
        <p>Manage your characters and active sessions</p>
      </div>

      <div className="dashboard-content">
        {/* Active Sessions Section */}
        <div className="section-container">
          <h2 className="section-title">Active Sessions</h2>
          {sessions.length === 0 ? (
            <p className="no-data">No active sessions</p>
          ) : (
            <div className="sessions-grid">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <h3>Session {session.id.substring(0, 8)}...</h3>
                    <span className="session-status">Active</span>
                  </div>
                  <div className="session-content">
                    <div className="session-section">
                      <h4>Background</h4>
                      <p>{session.background}</p>
                    </div>
                    <div className="session-section">
                      <h4>Scenario</h4>
                      <p>{session.scenario}</p>
                    </div>
                    <div className="session-section">
                      <h4>Your Role</h4>
                      <p>{session.user_role}</p>
                    </div>
                  </div>
                  <button
                    className="continue-session-button"
                    onClick={() => handleContinueSession(session)}
                  >
                    Continue Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Characters Section */}
        <div className="section-container">
          <h2 className="section-title">Available Characters</h2>
          <div className="characters-grid">
            {characters.map((character) => (
              <div key={character.id} className="character-card">
                <div className="character-header">
                  <h3 className="character-name">{character.name}</h3>
                  <div className="character-genres">
                    {character.genre.map((genre, index) => (
                      <span key={index} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="character-content">
                  <div className="character-section">
                    <h4>Background</h4>
                    <p>{character.background_template}</p>
                  </div>

                  <div className="character-section">
                    <h4>Scenario</h4>
                    <p>{character.scenario_template}</p>
                  </div>

                  <div className="character-section">
                    <h4>Your Role</h4>
                    <p>{character.user_role_template}</p>
                  </div>
                </div>

                <button
                  className="select-character-button"
                  onClick={() => handleCreateSession(character)}
                >
                  Start Session with {character.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCharacter && (
        <CreateSessionModal
          character={selectedCharacter}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSessionCreated={handleSessionCreated}
          authToken={authToken}
        />
      )}
    </div>
  );
};

export default CharacterList;
