import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { getAllSessions, deleteSession, clearAllSessions } from '../utils/sessionStorage';
import LeadBadge from '../components/LeadBadge';

function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function duration(s, e) {
  if (!e) return 'Ongoing';
  const ms = new Date(e) - new Date(s), m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
const FILTERS = [{ key: 'all', label: 'All' }, { key: 'HOT', label: 'Hot' }, { key: 'WARM', label: 'Warm' }, { key: 'COLD', label: 'Cold' }];

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  function load() { setSessions(getAllSessions()); }
  useEffect(() => { load(); window.addEventListener('focus', load); return () => window.removeEventListener('focus', load); }, []);
  function handleDelete(e, id) { e.stopPropagation(); if (confirm('Delete this session?')) { deleteSession(id); load(); } }
  function handleClear() { if (confirm('Delete ALL sessions?')) { clearAllSessions(); load(); } }
  const filtered = sessions.filter(s => filter === 'all' || s.leadScore === filter);
  const hot = sessions.filter(s => s.leadScore === 'HOT').length;
  const warm = sessions.filter(s => s.leadScore === 'WARM').length;
  const cold = sessions.filter(s => s.leadScore === 'COLD').length;
  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div><h1>Dashboard</h1><p>All sessions with lead scoring and language tracking.</p></div>
          <Link to="/voice" className="btn btn-primary"><Icon name="plus" size={15} color="#fff" /> New Session</Link>
        </div>
      </div>
      <div className="stats-grid">
        {[
          { icon: 'bar-chart', label: 'Total Sessions', value: sessions.length, color: 'var(--text-1)' },
          { icon: 'flame',     label: 'Hot Leads',      value: hot,  color: 'var(--hot)',  border: 'rgba(239,68,68,0.22)'  },
          { icon: 'sun',       label: 'Warm Leads',     value: warm, color: 'var(--warm)', border: 'rgba(245,158,11,0.22)' },
          { icon: 'snowflake', label: 'Cold Leads',     value: cold, color: 'var(--cold)', border: 'rgba(59,130,246,0.22)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={s.border ? { borderColor: s.border } : {}}>
            <div className="stat-icon"><Icon name={s.icon} size={20} color={s.color} strokeWidth={1.8} /></div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {FILTERS.map(f => (
            <button key={f.key} className={`filter-chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        {sessions.length > 0 && (
          <button className="btn btn-danger btn-icon" title="Clear all" onClick={handleClear}><Icon name="trash" size={15} /></button>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <Icon name={sessions.length === 0 ? 'mic' : 'bar-chart'} size={42} color="var(--text-3)" strokeWidth={1.5} />
          </div>
          <h3>{sessions.length === 0 ? 'No sessions yet' : 'No sessions match this filter'}</h3>
          <p>{sessions.length === 0 ? 'Start an AI Agent session to see it here.' : 'Try a different filter.'}</p>
          {sessions.length === 0 && (
            <Link to="/voice" className="btn btn-primary" style={{ marginTop: 20 }}>
              <Icon name="plus" size={15} color="#fff" /> Start a Session
            </Link>
          )}
        </div>
      ) : (
        <div className="sessions-grid">
          {filtered.map(s => (
            <div key={s.id} className="session-card" onClick={() => navigate(`/session/${s.id}`)}>
              <div className="session-card-header">
                <div className="session-type"><Icon name="mic" size={15} color="#a855f7" /><span>Session</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LeadBadge score={s.leadScore} />
                  <button className="btn btn-ghost btn-icon" onClick={e => handleDelete(e, s.id)} title="Delete">
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
              <p className="session-preview">"{s.messages[0]?.text || 'No messages'}"</p>
              <div className="session-footer">
                <div className="session-meta">
                  <span className="lang-tag"><Icon name="globe" size={10} />{s.language}</span>
                  <span className="lang-tag"><Icon name="message-sq" size={10} />{s.messages.length}</span>
                  <span className="lang-tag"><Icon name="clock" size={10} />{duration(s.startTime, s.endTime)}</span>
                </div>
                <div className="session-date">{fmtDate(s.startTime)}<br />{fmtTime(s.startTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
