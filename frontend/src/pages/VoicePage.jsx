import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../components/Icon';
import { useSession } from '../hooks/useSession';
import { useTTS } from '../hooks/useTTS';
import { processSpeech, normalizeLeadScore } from '../services/apiService';
import LeadBadge from '../components/LeadBadge';
import TTSToggle from '../components/TTSToggle';

function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Waveform() {
  return (
    <div className="waveform">
      {Array.from({ length: 18 }, (_, i) => <div key={i} className="waveform-bar" />)}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="message-bubble ai">
      <div className="bubble-avatar ai-avatar">
        <Icon name="volume-2" size={14} color="#a855f7" />
      </div>
      <div className="bubble-content">
        <div className="bubble-text" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTopLeftRadius: 4 }}>
          <div className="typing-indicator">
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Web Speech API transcription hook ─────────────────────────────────────────
function useSpeechToText() {
  const [isListening, setIsListening]   = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [sttError, setSttError]         = useState(null);
  const recognitionRef                  = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) { setSttError('Speech recognition not supported in this browser.'); return; }
    setSttError(null);
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.lang            = 'en-IN'; // supports both English & Hindi

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
    };

    recognition.onerror = (e) => {
      setSttError(`Mic error: ${e.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, sttError, startListening, stopListening, isSupported };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const { messages, language, startSession, addMessage, endSession } = useSession('voice');
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTTS();
  const { isListening, transcript, sttError, startListening, stopListening, isSupported: sttSupported } = useSpeechToText();

  const [isProcessing, setIsProcessing]         = useState(false);
  const [isTypingAI, setIsTypingAI]             = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionActive, setSessionActive]       = useState(false);
  const [autoSpeak, setAutoSpeak]               = useState(true);
  const [textInput, setTextInput]               = useState('');
  const [inputMode, setInputMode]               = useState('voice');
  const [apiError, setApiError]                 = useState(null);
  const [interimText, setInterimText]           = useState('');
  const [liveLeadScore, setLiveLeadScore]       = useState('COLD');

  const messagesEndRef = useRef(null);
  const textInputRef   = useRef(null);
  const prevTranscript = useRef('');

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTypingAI]);

  // Sync interim transcript display while user is speaking
  useEffect(() => {
    if (isListening) setInterimText(transcript);
    else             setInterimText('');
  }, [isListening, transcript]);

  // When recognition ends and we have a transcript — send it
  useEffect(() => {
    if (isListening) return; // still recording
    if (!transcript || transcript === prevTranscript.current) return;
    if (!currentSessionId) return;
    prevTranscript.current = transcript;
    handleSendText(transcript, 'voice');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // ── Core send function used by both voice & text modes ──────────────────────
  async function handleSendText(text, source = 'text') {
    const trimmed = text.trim();
    if (!trimmed || !currentSessionId || isTypingAI || isProcessing) return;

    setApiError(null);
    if (source === 'text') setTextInput('');

    // If it's a trigger message, don't add to UI, just send to backend
    const isTrigger = source === 'trigger';

    // Optimistically add user message if not a trigger
    let userMsg = null;
    if (!isTrigger) {
      userMsg = { role: 'user', text: trimmed, time: new Date().toISOString(), source };
      addMessage(currentSessionId, userMsg);
    }

    setIsTypingAI(true);
    try {
      // Pass current messages + the new user message as history
      const history = userMsg ? [...messages, userMsg] : messages;
      const data = await processSpeech(trimmed, history);

      const aiMsg = {
        role: 'ai',
        text: data.response_text,
        time: new Date().toISOString(),
        source,
        meta: {
          detectedLanguage: data.detected_language,
          interestLevel:    data.interest_level,
          networkSize:      data.network_size,
          requiresHandoff:  data.requires_handoff,
          nextAction:       data.recommended_next_action,
          objections:       data.objections_handled,
        },
      };

      // Pass backend metadata so session is updated with accurate lead score + language
      const meta = {
        leadScore: normalizeLeadScore(data.lead_classification),
        language:  data.detected_language,
      };
      setLiveLeadScore(meta.leadScore);
      addMessage(currentSessionId, aiMsg, meta);

      if (autoSpeak && ttsSupported) {
        speak(data.response_text, {
          onEnd: () => {
            if (inputMode === 'voice' && sttSupported && sessionActive) {
              startListening();
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Sorry, the server is busy.';
      
      // Check for 503 or "high demand" errors specifically
      if (err.message.includes('503') || err.message.includes('high demand')) {
        errMsg = 'Our customer support is busy, we will call you later.';
      }
      
      setApiError(errMsg);
      if (autoSpeak && ttsSupported) {
        speak(errMsg, {
          onEnd: () => {
            if (inputMode === 'voice' && sttSupported && sessionActive) {
              startListening();
            }
          }
        });
      }
    } finally {
      setIsTypingAI(false);
      if (source === 'text') setTimeout(() => textInputRef.current?.focus(), 40);
    }
  }

  async function startSess() {
    const id = startSession();
    setCurrentSessionId(id);
    setSessionActive(true);
    setLiveLeadScore('COLD');
    prevTranscript.current = '';
    
    // Trigger initial AI greeting
    setTimeout(() => {
      handleSendText("hello", 'trigger');
    }, 500);
  }

  function endSess() {
    stop();
    endSession(currentSessionId);
    setCurrentSessionId(null);
    setSessionActive(false);
    setApiError(null);
    prevTranscript.current = '';
  }

  const isBusy = isProcessing || isTypingAI;

  return (
    <div className="fade-in" style={{ maxWidth: 820 }}>
      <div className="page-header">
        <h1>AI Voice Agent</h1>
        <p>Speak or type — the AI replies in text and reads the response aloud.</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Info bar */}
        <div className="session-info-bar">
          <span className={`session-dot${sessionActive ? '' : ' inactive'}`} />
          <span style={{ fontSize: 13, fontWeight: 600, color: sessionActive ? 'var(--text-1)' : 'var(--text-3)' }}>
            {sessionActive ? 'Session Active' : 'No Active Session'}
          </span>
          {sessionActive && (
            <>
              <div className="info-pill">
                <Icon name="globe" size={11} color="var(--text-3)" />
                <strong>{language}</strong>
              </div>
              <LeadBadge score={liveLeadScore} />
              <div className="info-pill">
                <Icon name="message-sq" size={11} color="var(--text-3)" />
                <strong>{messages.length}</strong>
              </div>
              {ttsSupported && (
                <div style={{ marginLeft: 'auto' }}>
                  <TTSToggle enabled={autoSpeak} onToggle={() => { stop(); setAutoSpeak(v => !v); }}
                    isSpeaking={isSpeaking} onStop={stop} />
                </div>
              )}
            </>
          )}
        </div>

        {/* No session */}
        {!sessionActive ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--accent-soft)', border: '1px solid rgba(124,58,237,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Icon name="mic" size={30} color="#a855f7" />
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
              Start a session to speak or type with the AI
            </p>
            <button className="btn btn-primary" style={{ padding: '11px 28px' }} onClick={startSess}>
              Start Session
            </button>
          </div>
        ) : (
          <>
            {/* Transcript */}
            <div style={{ padding: '20px 24px', minHeight: 220, maxHeight: 400, overflowY: 'auto' }}>
              {messages.length === 0 && !interimText && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  <Icon name="message-sq" size={28} color="var(--text-3)"
                    style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                  Speak or type your first message
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.role}`}>
                  <div className={`bubble-avatar ${msg.role === 'ai' ? 'ai-avatar' : 'user-avatar'}`}>
                    {msg.role === 'ai'
                      ? <Icon name="volume-2" size={13} color="#a855f7" />
                      : msg.source === 'voice'
                        ? <Icon name="mic" size={13} color="#60a5fa" />
                        : <Icon name="message-sq" size={13} color="#60a5fa" />}
                  </div>
                  <div className="bubble-content">
                    <div className="bubble-text">{msg.text}</div>
                    <div className="bubble-meta">
                      <span className="bubble-time">{formatTime(msg.time)}</span>
                      <span className="source-pill" style={{
                        color:      msg.source === 'voice' ? '#a855f7' : '#60a5fa',
                        background: msg.source === 'voice' ? 'rgba(168,85,247,0.09)' : 'rgba(96,165,250,0.09)',
                        border:     `1px solid ${msg.source === 'voice' ? 'rgba(168,85,247,0.18)' : 'rgba(96,165,250,0.18)'}`,
                      }}>
                        <Icon name={msg.source === 'voice' ? 'mic' : 'message-sq'} size={9} strokeWidth={2.5} />
                        {msg.source}
                      </span>
                      {/* Show backend metadata tags on AI messages */}
                      {msg.role === 'ai' && msg.meta?.detectedLanguage && (
                        <span className="source-pill" style={{ color: '#34d399', background: 'rgba(52,211,153,0.09)', border: '1px solid rgba(52,211,153,0.2)' }}>
                          {msg.meta.detectedLanguage}
                        </span>
                      )}
                      {msg.role === 'ai' && ttsSupported && (
                        <button className="replay-btn" onClick={() => speak(msg.text)} title="Replay">
                          <Icon name="volume-2" size={11} />
                        </button>
                      )}
                    </div>
                    {/* Show recommended next action under AI messages */}
                    {msg.role === 'ai' && msg.meta?.nextAction && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
                        💡 {msg.meta.nextAction}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Interim voice transcript preview */}
              {isListening && interimText && (
                <div className="message-bubble user" style={{ opacity: 0.55 }}>
                  <div className="bubble-avatar user-avatar">
                    <Icon name="mic" size={13} color="#60a5fa" />
                  </div>
                  <div className="bubble-content">
                    <div className="bubble-text" style={{ fontStyle: 'italic' }}>{interimText}…</div>
                  </div>
                </div>
              )}

              {isTypingAI && <TypingBubble />}
              <div ref={messagesEndRef} />
            </div>

            {/* Mode tabs */}
            <div style={{
              padding: '12px 20px 0',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div className="mode-tabs">
                {[
                  { key: 'voice', icon: 'mic',        label: 'Voice' },
                  { key: 'text',  icon: 'message-sq', label: 'Text'  },
                ].map(({ key, icon, label }) => (
                  <button key={key}
                    className={`mode-tab${inputMode === key ? ' active' : ''}`}
                    onClick={() => { setInputMode(key); if (key === 'text') setTimeout(() => textInputRef.current?.focus(), 50); }}
                  >
                    <Icon name={icon} size={13} strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
              {isSpeaking && (
                <span style={{ fontSize: 11, color: 'var(--accent-2)', fontWeight: 600 }}>Speaking…</span>
              )}
            </div>

            {/* Input panel */}
            <div style={{ padding: '14px 20px' }}>
              {inputMode === 'voice' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
                  {/* Status zone */}
                  <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    {isListening && <Waveform />}
                    {isBusy && !isListening && (
                      <div className="processing-row">
                        <div className="spinner" />
                        <span>Processing…</span>
                      </div>
                    )}
                    {!isListening && !isBusy && (
                      <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
                        {!sttSupported
                          ? 'Voice not supported — use Text mode'
                          : messages.length === 0
                            ? 'Tap the mic button to speak'
                            : 'Tap mic for your next message'}
                      </p>
                    )}
                  </div>

                  <button
                    className={`mic-btn${isListening ? ' recording' : ''}`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isBusy || !sttSupported}
                  >
                    {isListening
                      ? <Icon name="square" size={26} color="#fff" fill="#fff" />
                      : <Icon name="mic"    size={28} color="#fff" />}
                  </button>
                  <p className="mic-hint">
                    {isListening ? 'Listening — tap to stop' : 'Tap to record'}
                  </p>
                </div>
              ) : (
                <div className="chat-input-area">
                  <textarea ref={textInputRef} id="text-input" className="chat-input"
                    value={textInput} onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(textInput); } }}
                    placeholder="Type your message… (Enter to send)" disabled={isBusy} rows={1} />
                  <button id="text-send-btn" className="send-btn" onClick={() => handleSendText(textInput)}
                    disabled={!textInput.trim() || isBusy}>
                    <Icon name="send" size={17} color="#fff" />
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={endSess}>
                End Session &amp; Save
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error banner */}
      {(apiError || sttError) && (
        <div style={{
          marginTop: 14,
          background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: 10, padding: '11px 14px', fontSize: 13, color: 'var(--hot)',
        }}>
          {apiError || sttError}
        </div>
      )}
    </div>
  );
}
