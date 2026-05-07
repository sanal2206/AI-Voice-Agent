const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://focused-creativity-production-70c6.up.railway.app';

/**
 * Converts the frontend message format to what the backend expects.
 * Frontend: { role: 'user' | 'ai', text: '...' }
 * Backend:  { role: 'user' | 'model', content: '...' }
 */
function toApiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === 'ai' ? 'model' : 'user',
    content: m.text,
  }));
}

/**
 * POST /api/process-speech
 * @param {string} text - The user's latest message (transcribed or typed).
 * @param {Array}  messages - The current session message history.
 * @returns {Promise<ProcessedResponse>}
 *
 * ProcessedResponse shape:
 * {
 *   response_text: string,
 *   detected_language: string,
 *   objections_handled: string[],
 *   lead_classification: 'Hot' | 'Warm' | 'Cold',
 *   interest_level: string,
 *   network_size: string,
 *   requires_handoff: boolean,
 *   recommended_next_action: string,
 *   post_call_summary: string | null,
 * }
 */
export async function processSpeech(text, messages = [], detectedLanguage = 'Auto-Detect') {
  const body = {
    text,
    detected_language: detectedLanguage,
    history: toApiHistory(messages),
  };

  const res = await fetch(`${API_BASE_URL}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errText;
    try {
      const data = await res.json();
      errText = data.error?.message || JSON.stringify(data);
    } catch {
      errText = await res.text();
    }
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`API error ${data.error.code || res.status}: ${data.error.message}`);
  }

  return data;
}

/**
 * Maps backend lead_classification string to uppercase HOT/WARM/COLD keys
 * used throughout the frontend.
 */
/**
 * POST /api/voice
 * @param {Blob} audioBlob - The recorded audio from the user.
 * @param {Array} messages - The current session message history.
 * @returns {Promise<Object>}
 */
export async function processVoice(audioBlob, messages = []) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('history', JSON.stringify(toApiHistory(messages)));

  const res = await fetch(`${API_BASE_URL}/api/voice`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errText;
    try {
      const data = await res.json();
      errText = data.detail ? JSON.stringify(data.detail) : (data.error?.message || JSON.stringify(data));
    } catch {
      errText = await res.text();
    }
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`API error ${data.error.code || res.status}: ${data.error.message}`);
  }

  return data;
}

export function normalizeLeadScore(classification) {
  const map = { Hot: 'HOT', Warm: 'WARM', Cold: 'COLD' };
  return map[classification] ?? 'COLD';
}
