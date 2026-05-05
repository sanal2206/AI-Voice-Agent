import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { MOCK_MODE } from '../config';

const NAV = [
  { to: '/',      icon: 'layout-dash', label: 'Dashboard' },
  { to: '/voice', icon: 'bot',         label: 'AI Agent'  },
];

export default function Sidebar() {
  return (
    <>
      <nav className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon"><Icon name="bot" size={18} color="#fff" /></div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>AI Agent</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, textDecoration: 'none',
                color: isActive ? '#a855f7' : '#94a3b8',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              })}
              title={label}
            >
              <Icon name={icon} size={18} />
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Icon name="bot" size={18} color="#fff" /></div>
          <div>
            <div className="logo-text">AI Sales Agent</div>
            <div className="logo-sub">Voice + Text</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={icon} size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {MOCK_MODE && (
            <div className="mock-badge">
              <Icon name="zap" size={13} color="#f59e0b" />
              <div>
                <div style={{ fontWeight: 700 }}>Demo Mode</div>
                <div style={{ opacity: 0.65, fontSize: 10 }}>Mock API active</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
