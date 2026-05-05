import Icon from './Icon';

export default function TTSToggle({ enabled, onToggle, isSpeaking, onStop }) {
  return (
    <div className="tts-toggle">
      {isSpeaking && (
        <button className="tts-btn stop-btn" onClick={onStop} title="Stop speaking">
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <span key={i} className="speaking-bar" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
          Stop
        </button>
      )}
      <button className={`tts-btn ${enabled ? 'on' : 'off'}`} onClick={onToggle}
        title={enabled ? 'Disable auto-speak' : 'Enable auto-speak'}>
        <Icon name={enabled ? 'volume-2' : 'volume-x'} size={12} strokeWidth={2.5} />
        {enabled ? 'Speaking ON' : 'Speaking OFF'}
      </button>
    </div>
  );
}
