import React, { useState } from 'react';
import './CreateSessionModal.css';

interface Character {
  id: string;
  name: string;
  genre: string[];
  background_template: string;
  scenario_template: string;
  user_role_template: string;
}

interface CreateSessionModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
  authToken: string;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  character,
  isOpen,
  onClose,
  onSessionCreated,
  authToken
}) => {
  const [background, setBackground] = useState(character.background_template);
  const [scenario, setScenario] = useState(character.scenario_template);
  const [userRole, setUserRole] = useState(character.user_role_template);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!background.trim() || !scenario.trim() || !userRole.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('https://api.fintalk.fan/sessions/create', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          character_id: character.id,
          background: background.trim(),
          scenario: scenario.trim(),
          user_role: userRole.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onSessionCreated(data.session_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Session with {character.name}</h2>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="background">Background:</label>
            <textarea
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Enter the background story..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scenario">Scenario:</label>
            <textarea
              id="scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Enter the scenario..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="userRole">Your Role:</label>
            <textarea
              id="userRole"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              placeholder="Enter your role..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
