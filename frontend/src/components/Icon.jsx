/**
 * Lightweight inline SVG icons — no external dependency, React 19 safe.
 * Usage: <Icon name="mic" size={16} color="#fff" />
 */
const PATHS = {
  mic:           'M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm-1 17.93V22h2v-2.07A8 8 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z',
  'mic-off':     'M19 11h-1.7A5 5 0 0 1 13 15.3V17h2v2H9v-2h2v-1.7c-.9-.2-1.8-.6-2.5-1.2L4 19.8 2.8 18.6 19.8 1.6 21 2.8l-4.2 4.2A5 5 0 0 0 12 2a5 5 0 0 0-5 5v3.3L5 12.3V7a7 7 0 0 1 14 0v4h-1.4L19 11zm-8.8 2.8L8 11.6V12a4 4 0 0 0 2.2 3.6l.2.2zM12 6a3 3 0 0 1 3 3v.8l-3-3V6z',
  square:        'M3 3h18v18H3z',
  send:          'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  'message-sq':  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  'volume-2':    'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  'volume-x':    'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  globe:         'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-1.5 2.5-2.4 5-2.4 10s.9 7.5 2.4 10m0-20c1.5 2.5 2.4 5 2.4 10s-.9 7.5-2.4 10M2 12h20',
  clock:         'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v6l4 2',
  trash:         'M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  plus:          'M12 5v14M5 12h14',
  'bar-chart':   'M18 20V10M12 20V4M6 20v-6',
  'layout-dash': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  bot:           'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-3 5s-2 0-2-1h4c0 1-2 1-2 1z',
  flame:         'M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10zm0 14a2 2 0 0 1-2-2c0-2 2-5 2-5s2 3 2 5a2 2 0 0 1-2 2z',
  sun:           'M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  snowflake:     'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07',
  zap:           'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'arrow-left':  'M19 12H5M12 5l-7 7 7 7',
};

export default function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 2, style = {}, className = '', fill = 'none' }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
