const HOT_KEYWORDS = [
  'buy', 'purchase', 'ready', 'confirm', 'sign up', 'sign me up',
  'let\'s do it', 'proceed', 'budget approved', 'approved', 'yes please',
  'absolutely', 'definitely', 'deal', 'when can we start', 'start now',
  'credit card', 'payment', 'invoice', 'contract', 'agree', 'book',
];

const WARM_KEYWORDS = [
  'interested', 'maybe', 'consider', 'thinking about', 'tell me more',
  'how much', 'pricing', 'cost', 'price', 'exploring', 'looking into',
  'sounds good', 'not sure', 'depends', 'could work', 'possibly',
  'let me think', 'get back', 'follow up', 'more information',
];

const COLD_KEYWORDS = [
  'not interested', 'no thanks', 'cancel', 'expensive', 'too much',
  'not now', 'later', 'no need', 'don\'t want', 'remove me',
  'unsubscribe', 'stop', 'never mind', 'pass', 'not for me',
];

export function computeLeadScore(messages) {
  const text = messages
    .filter(m => m.role === 'user')
    .map(m => m.text.toLowerCase())
    .join(' ');

  let hotCount = 0;
  let warmCount = 0;
  let coldCount = 0;

  HOT_KEYWORDS.forEach(kw => { if (text.includes(kw)) hotCount++; });
  WARM_KEYWORDS.forEach(kw => { if (text.includes(kw)) warmCount++; });
  COLD_KEYWORDS.forEach(kw => { if (text.includes(kw)) coldCount++; });

  if (hotCount > 0) return 'HOT';
  if (coldCount > warmCount) return 'COLD';
  if (warmCount > 0) return 'WARM';
  return 'COLD';
}

export const SCORE_CONFIG = {
  HOT:  { label: 'Hot',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '🔥' },
  WARM: { label: 'Warm', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '☀️' },
  COLD: { label: 'Cold', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '❄️' },
};
