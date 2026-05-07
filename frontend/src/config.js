// API Configuration
// The live backend is configured directly in src/services/apiService.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://focused-creativity-production-70c6.up.railway.app';

// MOCK_MODE: set to true to use local mock responses instead of the real backend
export const MOCK_MODE = false;

export const ENDPOINTS = {
  processSpeech: `${API_BASE_URL}/api/process`, // POST: { text, history[] } → ProcessedResponse
};
