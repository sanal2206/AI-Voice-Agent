import Icon from './Icon';
import { SCORE_CONFIG } from '../utils/leadScoring';

const SCORE_ICONS = { HOT: 'flame', WARM: 'sun', COLD: 'snowflake' };

export default function LeadBadge({ score }) {
  const cfg  = SCORE_CONFIG[score] || SCORE_CONFIG.COLD;
  const icon = SCORE_ICONS[score] || 'snowflake';
  return (
    <span className={`badge badge-${score.toLowerCase()}`}>
      <Icon name={icon} size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
