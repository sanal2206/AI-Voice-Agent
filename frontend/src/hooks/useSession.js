import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveSession, getSessionById } from '../utils/sessionStorage';
import { computeLeadScore } from '../utils/leadScoring';
import { detectLanguage } from '../utils/mockResponses';

export function useSession(type) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState('Auto-Detect');

  const startSession = useCallback(() => {
    const id = uuidv4();
    const session = {
      id,
      type,
      messages: [],
      language: 'Auto-Detect',
      leadScore: 'COLD',
      startTime: new Date().toISOString(),
      endTime: null,
    };
    saveSession(session);
    setSessionId(id);
    setMessages([]);
    setLanguage('Auto-Detect');
    return id;
  }, [type]);

  /**
   * @param {string} sessionId
   * @param {object} message      - { role, text, time, source }
   * @param {object} [meta]       - Optional metadata from API: { leadScore, language }
   */
  const addMessage = useCallback((sessionId, message, meta = {}) => {
    setMessages(prev => {
      const updated = [...prev, message];

      // Use backend-provided values when available, else compute locally
      const userTexts = updated.filter(m => m.role === 'user').map(m => m.text).join(' ');
      const detectedLang = meta.language ?? detectLanguage(userTexts);
      const leadScore    = meta.leadScore  ?? computeLeadScore(updated);

      setLanguage(detectedLang);

      const existing = getSessionById(sessionId);
      if (existing) {
        saveSession({
          ...existing,
          messages: updated,
          language: detectedLang,
          leadScore,
        });
      }
      return updated;
    });
  }, []);

  const endSession = useCallback((sessionId) => {
    const existing = getSessionById(sessionId);
    if (existing) {
      saveSession({ ...existing, endTime: new Date().toISOString() });
    }
    setSessionId(null);
    setMessages([]);
    setLanguage('Auto-Detect');
  }, []);

  return { sessionId, messages, language, startSession, addMessage, endSession };
}
