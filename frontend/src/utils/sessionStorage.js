const STORAGE_KEY = 'ai_agent_sessions';

export function getAllSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSessionById(id) {
  return getAllSessions().find(s => s.id === id) || null;
}

export function saveSession(session) {
  const sessions = getAllSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id) {
  const sessions = getAllSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
