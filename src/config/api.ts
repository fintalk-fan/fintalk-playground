// API Configuration
export const API_BASE_URL = 'https://api.fintalk.fan';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: `${API_BASE_URL}/auth/google/login`,

  // Characters
  CHARACTERS_LIST: `${API_BASE_URL}/characters/list`,
  CHARACTERS_CREATE: `${API_BASE_URL}/characters/create`,

  // Sessions
  SESSIONS_LIST: `${API_BASE_URL}/sessions/list`,
  SESSIONS_CREATE: `${API_BASE_URL}/sessions/create`,
  SESSIONS_CHAT: (sessionId: string) => `${API_BASE_URL}/sessions/${sessionId}/chat`,
  SESSIONS_QUERY: (sessionId: string, limit?: number) =>
    `${API_BASE_URL}/sessions/${sessionId}/query${limit ? `?limit=${limit}` : ''}`,
} as const;
