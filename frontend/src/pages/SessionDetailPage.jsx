import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MessageSquare, Globe, Clock, Volume2, BarChart2 } from 'lucide-react';
import { getSessionById } from '../utils/sessionStorage';
import LeadBadge from '../components/LeadBadge';
import { useTTS } from '../hooks/useTTS';

function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function duration(s, e) {
  if (!e) return 'Ongoing';
  const m = Math.floor((new Date(e) - new Date(s)) / 60000);
  const sec = Math.floor(((new Date(e) - new Date(s)) % 60000) / 1000);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { speak, isSupported } = useTTS();
  const session = getSessionById(id);

  if (!session) return (
    <div className="fade-in">
      <div className="card empty-state">
        <div className="empty-icon"><BarChart2 size={40} strokeWidth={1.5} /></div>
        <h3>Session Not Found</h3>
        <p>This session may have been deleted.</p>
        <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    </div>
  );

  const user = session.messages.filter(m => m.role === 'user').length;
  const ai   = session.messages.filter(m => m.role === 'ai').length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')} title="Back">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {session.type === 'voice' ? <Mic size={20} color="#a855f7" /> : <MessageSquare size={20} color="#60a5fa" />}
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {session.type === 'voice' ? 'Voice' : 'Chat'} Session
            </h1>
            <LeadBadge score={session.leadScore} />
          </div>
          <div className="detail-meta">
            <span className="detail-pill"><Clock size={12} />{fmtDate(session.startTime)}</span>
            <span className="detail-pill"><Clock size={12} />{duration(session.startTime, session.endTime)}</span>
            <span className="detail-pill"><Globe size={12} />{session.language}</span>
            <span className="detail-pill"><MessageSquare size={12} />{session.messages.length} messages</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { label: 'User Messages', value: user, Icon: Mic },
          { label: 'AI Responses',  value: ai,   Icon: Volume2 },
          { label: 'Lead Score',    value: session.leadScore, Icon: BarChart2 },
          { label: 'Language',      value: session.language,  Icon: Globe },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ flex: '1 1 140px' }}>
            <div className="stat-icon"><s.Icon size={18} strokeWidth={1.8} /></div>
            <div className="stat-value" style={{ fontSize: 18 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transcript */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>Full Transcript</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{session.messages.length} messages</span>
        </div>
        {session.messages.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}><p>No messages recorded.</p></div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {session.messages.map((msg, i) => (
              <div key={i} className={`message-bubble ${msg.role}`}>
                <div className={`bubble-avatar ${msg.role === 'ai' ? 'ai-avatar' : 'user-avatar'}`}>
                  {msg.role === 'ai' ? <Volume2 size={14} color="#a855f7" /> : <Mic size={14} color="#60a5fa" />}
                </div>
                <div className="bubble-content">
                  <div className="bubble-text">{msg.text}</div>
                  <div className="bubble-meta">
                    <span className="bubble-time">{fmtTime(msg.time)}</span>
                    {msg.role === 'ai' && isSupported && (
                      <button className="replay-btn" onClick={() => speak(msg.text)} title="Play">
                        <Volume2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
