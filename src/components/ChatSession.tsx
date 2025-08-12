import React, { useState, useEffect, useRef } from 'react';
import './ChatSession.css';
import { API_ENDPOINTS } from '../config/api';

interface Arc {
  arc_id: number;
  scenario: string;
  dialogs: string[];
}

interface ChatItem {
  item_id: number;
  arcs: Arc[];
  user_input: string | null;
  story_progression: string;
  suggested_actions: string[];
  suggested_dialogs: string[];
}

interface StreamingResponse {
  type: 'scenario' | 'dialog' | 'complete';
  content: any;
}

interface Session {
  id: string;
  account_id: string;
  character_id: string;
  background: string;
  scenario: string;
  user_role: string;
}

interface ChatSessionProps {
  session: Session;
  authToken: string;
  onBack: () => void;
}

const ChatSession: React.FC<ChatSessionProps> = ({ session, authToken, onBack }) => {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingArc, setCurrentStreamingArc] = useState<Arc | null>(null);
  const [suggestedDialogs, setSuggestedDialogs] = useState<string[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [hasInitialResponse, setHasInitialResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [session.id, authToken]);

  useEffect(() => {
    // Auto-start conversation if no chat history exists and we haven't started yet
    if (!loading && chatItems.length === 0 && !isStreaming && !hasInitialResponse) {
      handleAutoStart();
    }
  }, [loading, chatItems.length, isStreaming, hasInitialResponse]);

  useEffect(() => {
    // Update suggested dialogs and actions from the latest chat item
    if (chatItems.length > 0) {
      const latestItem = chatItems[chatItems.length - 1];
      // Only show suggestions if the item has arcs (completed response)
      if (latestItem.arcs && latestItem.arcs.length > 0) {
        setSuggestedDialogs(latestItem.suggested_dialogs);
        setSuggestedActions(latestItem.suggested_actions);
        setHasInitialResponse(true);
      }
    }
  }, [chatItems]);

  useEffect(() => {
    scrollToBottom();
  }, [chatItems]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.SESSIONS_QUERY(session.id, 5), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Reverse the array so oldest items come first (for proper chat display)
      setChatItems(data.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

    const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return;

    const userMessage = message.trim();
    setUserInput('');
    setIsStreaming(true);

    // Add user message immediately to chat
    const tempUserMessage = {
      item_id: Date.now(),
      user_input: userMessage,
      arcs: [],
      story_progression: '',
      suggested_actions: [],
      suggested_dialogs: []
    };
    setChatItems(prev => [...prev, tempUserMessage]);

    // Initialize streaming arc
    setCurrentStreamingArc({ arc_id: Date.now(), scenario: '', dialogs: [] });

    try {
      const response = await fetch(API_ENDPOINTS.SESSIONS_CHAT(session.id), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_input: userMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let currentScenario = '';
      let currentDialogs: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingResponse;

              if (data.type === 'scenario') {
                currentScenario = data.content;
                setCurrentStreamingArc(prev => prev ? { ...prev, scenario: currentScenario } : null);
              } else if (data.type === 'dialog') {
                currentDialogs.push(data.content);
                setCurrentStreamingArc(prev => prev ? { ...prev, dialogs: [...currentDialogs] } : null);
              } else if (data.type === 'complete') {
                // Replace the temporary user message with the complete chat item
                const newChatItem: ChatItem = {
                  ...data.content,
                  user_input: userMessage
                };
                setChatItems(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = newChatItem;
                  return updated;
                });
                setCurrentStreamingArc(null);
                break;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the temporary user message on error
      setChatItems(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setCurrentStreamingArc(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };

  const handleSuggestedClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleAutoStart = async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setCurrentStreamingArc({ arc_id: Date.now(), scenario: '', dialogs: [] });

    try {
      const response = await fetch(API_ENDPOINTS.SESSIONS_CHAT(session.id), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_input: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let currentScenario = '';
      let currentDialogs: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingResponse;

              if (data.type === 'scenario') {
                currentScenario = data.content;
                setCurrentStreamingArc(prev => prev ? { ...prev, scenario: currentScenario } : null);
              } else if (data.type === 'dialog') {
                currentDialogs.push(data.content);
                setCurrentStreamingArc(prev => prev ? { ...prev, dialogs: [...currentDialogs] } : null);
              } else if (data.type === 'complete') {
                // Add the completed chat item to the list
                const newChatItem: ChatItem = {
                  ...data.content,
                  user_input: null
                };
                setChatItems(prev => [...prev, newChatItem]);
                setCurrentStreamingArc(null);
                break;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsStreaming(false);
      setCurrentStreamingArc(null);
    }
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <button onClick={onBack} className="back-button">
            ← Back to Sessions
          </button>
          <h2>Loading chat...</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <button onClick={onBack} className="back-button">
            ← Back to Sessions
          </button>
          <h2>Error</h2>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchChatHistory} className="retry-button">
              Try Again
            </button>
            <button onClick={onBack} className="logout-button">
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={onBack} className="back-button">
          ← Back to Sessions
        </button>
        <h2>Session {session.id.substring(0, 8)}...</h2>
      </div>

      <div className="chat-messages">
        {chatItems.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatItems.map((item) => (
            <div key={item.item_id} className="chat-item">
              {/* User Input */}
              {item.user_input && (
                <div className="message user-message">
                  <div className="message-content">
                    <p>{item.user_input}</p>
                  </div>
                  <div className="message-avatar user-avatar">
                    You
                  </div>
                </div>
              )}

              {/* Character Response (Arcs) */}
              {item.arcs.map((arc) => (
                <div key={arc.arc_id} className="message character-message">
                  <div className="message-avatar character-avatar">
                    Character
                  </div>
                  <div className="message-content">
                    <div className="scenario-text">
                      <p>{arc.scenario}</p>
                    </div>
                    <div className="dialogs">
                      {arc.dialogs.map((dialog, index) => (
                        <div key={index} className="dialog-bubble">
                          <p>{dialog}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show streaming response for the last item if it's the current user message */}
              {isStreaming && item.item_id === chatItems[chatItems.length - 1]?.item_id && currentStreamingArc && (
                <div className="message character-message">
                  <div className="message-avatar character-avatar">
                    Character
                  </div>
                  <div className="message-content">
                    {currentStreamingArc.scenario && (
                      <div className="scenario-text">
                        <p>{currentStreamingArc.scenario}</p>
                      </div>
                    )}
                    <div className="dialogs">
                      {currentStreamingArc.dialogs.map((dialog, index) => (
                        <div key={index} className="dialog-bubble">
                          <p>{dialog}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && !isStreaming && hasInitialResponse && (
        <div className="suggested-actions">
          <h4>Suggested Actions:</h4>
          <div className="suggestions-container">
            {suggestedActions.map((action, index) => (
              <button
                key={index}
                className="action-button"
                onClick={() => handleSuggestedClick(`*${action}*`)}
                disabled={isStreaming}
              >
                *{action}*
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Dialogs */}
      {suggestedDialogs.length > 0 && !isStreaming && hasInitialResponse && (
        <div className="suggested-dialogs">
          <h4>Suggested Responses:</h4>
          <div className="suggestions-container">
            {suggestedDialogs.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-button"
                onClick={() => handleSuggestedClick(suggestion)}
                disabled={isStreaming}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={hasInitialResponse ? "Type your message..." : "Waiting for character to start..."}
            className="chat-input"
            disabled={isStreaming || !hasInitialResponse}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!userInput.trim() || isStreaming || !hasInitialResponse}
          >
            {isStreaming ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSession;
