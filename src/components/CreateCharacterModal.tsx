import React, { useState } from 'react';
import './CreateCharacterModal.css';
import { API_ENDPOINTS } from '../config/api';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (characterId: string) => void;
  authToken: string;
}

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  authToken
}) => {
  const [formData, setFormData] = useState({
    name: '',
    background_template: '',
    scenario_template: '',
    user_role_template: '',
    genre: ['']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenreChange = (index: number, value: string) => {
    const newGenres = [...formData.genre];
    newGenres[index] = value;
    setFormData(prev => ({
      ...prev,
      genre: newGenres
    }));
  };

  const addGenre = () => {
    setFormData(prev => ({
      ...prev,
      genre: [...prev.genre, '']
    }));
  };

  const removeGenre = (index: number) => {
    if (formData.genre.length > 1) {
      setFormData(prev => ({
        ...prev,
        genre: prev.genre.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim() || !formData.background_template.trim() ||
        !formData.scenario_template.trim() || !formData.user_role_template.trim()) {
      setError('All fields are required');
      return;
    }

    // Filter out empty genres
    const validGenres = formData.genre.filter(genre => genre.trim() !== '');
    if (validGenres.length === 0) {
      setError('At least one genre is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.CHARACTERS_CREATE, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          background_template: formData.background_template.trim(),
          scenario_template: formData.scenario_template.trim(),
          user_role_template: formData.user_role_template.trim(),
          genre: validGenres
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onCharacterCreated(data.character_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
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
          <h2>Create New Character</h2>
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
            <label htmlFor="name">Character Name:</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter character name..."
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="background">Background:</label>
            <textarea
              id="background"
              value={formData.background_template}
              onChange={(e) => handleInputChange('background_template', e.target.value)}
              placeholder="Enter character background..."
              rows={4}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="scenario">Scenario:</label>
            <textarea
              id="scenario"
              value={formData.scenario_template}
              onChange={(e) => handleInputChange('scenario_template', e.target.value)}
              placeholder="Enter scenario description..."
              rows={4}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userRole">User Role:</label>
            <textarea
              id="userRole"
              value={formData.user_role_template}
              onChange={(e) => handleInputChange('user_role_template', e.target.value)}
              placeholder="Enter user role description..."
              rows={4}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label>Genres:</label>
            <div className="genres-container">
              {formData.genre.map((genre, index) => (
                <div key={index} className="genre-input-group">
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => handleGenreChange(index, e.target.value)}
                    placeholder="Enter genre..."
                    disabled={isLoading}
                  />
                  {formData.genre.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGenre(index)}
                      className="remove-genre-button"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addGenre}
                className="add-genre-button"
                disabled={isLoading}
              >
                + Add Genre
              </button>
            </div>
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
              {isLoading ? 'Creating...' : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCharacterModal;
