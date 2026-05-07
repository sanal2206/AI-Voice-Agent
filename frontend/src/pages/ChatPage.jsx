import { useState, useRef, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { useTTS } from '../hooks/useTTS';
import { MOCK_MODE, ENDPOINTS } from '../config';
import { getMockResponse } from '../utils/mockResponses';
import { computeLeadScore } from '../utils/leadScoring';
import LeadBadge from '../components/LeadBadge';
import TTSToggle from '../components/TTSToggle';

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="message-bubble ai" style={{ marginBottom: 12 }}>
      <div className="bubble-avatar ai-avatar">🤖</div>
      <div className="bubble-content">
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { sessionId, messages, language, startSession, addMessage, endSession } = useSession('chat');
  const { speak, stop, isSpeaking, isSupported } = useTTS();

  const [input, setInput]               = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [autoSpeak, setAutoSpeak]       = useState(true); // TTS on by default

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  function handleStartSession() {
    const id = startSession();
    setCurrentSessionId(id);
    setSessionActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleEndSession() {
    stop();
    endSession(currentSessionId);
    setCurrentSessionId(null);
    setSessionActive(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !currentSessionId || isTyping) return;

    setInput('');
    const now = new Date().toISOString();
    addMessage(currentSessionId, { role: 'user', text, time: now });
    setIsTyping(true);

    try {
      let aiResponse;

      if (MOCK_MODE) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
        aiResponse = getMockResponse(text);
      } else {
        const res = await fetch(ENDPOINTS.chat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: currentSessionId }),
        });
        const data = await res.json();
        aiResponse = data.response;
      }

      addMessage(currentSessionId, {
        role: 'ai',
        text: aiResponse,
        time: new Date().toISOString(),
      });

      // 🔊 Speak the AI response aloud
      if (autoSpeak && isSupported) {
        speak(aiResponse);
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = 'Sorry, I encountered an error. Please try again.';
      addMessage(currentSessionId, { role: 'ai', text: errMsg, time: new Date().toISOString() });
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const leadScore = computeLeadScore(messages);

  return (
    <div className="chat-page fade-in">
      <div className="page-header">
        <h1>💬 Chat Agent</h1>
        <p>Text-based AI conversation. Replies are shown in text <strong>and spoken aloud automatically</strong>.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Session info bar */}
        <div className="session-info-bar">
          <div className="session-info-item">
            <span className={`session-dot${sessionActive ? '' : ' inactive'}`} />
            <span className="value">{sessionActive ? 'Session Active' : 'No Active Session'}</span>
          </div>
          {sessionActive && (
            <>
              <div className="session-info-item">
                <span className="label">Language:</span>
                <span className="value">🌐 {language}</span>
              </div>
              <div className="session-info-item">
                <span className="label">Lead Score:</span>
                <LeadBadge score={leadScore} />
              </div>

              {/* TTS toggle */}
              {isSupported && (
                <TTSToggle
                  enabled={autoSpeak}
                  onToggle={() => { stop(); setAutoSpeak(v => !v); }}
                  isSpeaking={isSpeaking}
                  onStop={stop}
                />
              )}

              <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }} onClick={handleEndSession}>
                  ✓ End & Save Session
                </button>
              </div>
            </>
          )}
        </div>

        {!sessionActive ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              Start a new chat session to begin the conversation
            </p>
            <button className="btn btn-primary" onClick={handleStartSession}>
              ▶ Start Chat Session
            </button>
          </div>
        ) : (
          <>
            {/* Messages window */}
            <div className="chat-window">
              {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, gap: 8, paddingTop: 60 }}>
                  <span style={{ fontSize: 32 }}>👋</span>
                  <span>Say hello to get started!</span>
                  {isSupported && (
                    <span style={{ fontSize: 11, marginTop: 4 }}>
                      🔊 Auto-speak is <strong style={{ color: autoSpeak ? '#a855f7' : 'inherit' }}>{autoSpeak ? 'ON' : 'OFF'}</strong>
                    </span>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.role}`}>
                  <div className={`bubble-avatar ${msg.role === 'ai' ? 'ai-avatar' : 'user-avatar'}`}>
                    {msg.role === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div className="bubble-content">
                    <div className="bubble-text">{msg.text}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="bubble-time">{formatTime(msg.time)}</div>
                      {/* Replay button on AI messages */}
                      {msg.role === 'ai' && isSupported && (
                        <button
                          onClick={() => speak(msg.text)}
                          title="Replay speech"
                          style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: 12,
                            color: 'var(--text-muted)', padding: '0 4px',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => e.target.style.color = '#a855f7'}
                          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                id="chat-input"
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                disabled={isTyping}
                rows={1}
              />
              <button
                id="send-btn"
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
