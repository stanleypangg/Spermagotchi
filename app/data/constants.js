export const STAT_CONFIG = Object.freeze([
  {
    key: 'motility',
    label: 'Motility',
    abbr: 'MOT',
    description: 'Swim speed. Feeds base speed in every zone.',
    tooltip: 'Swim speed (akin to CASA VCL).',
    color: '#7dd3fc',
  },
  {
    key: 'linearity',
    label: 'Linearity',
    abbr: 'LIN',
    description: 'How straight you swim. Converts speed into forward progress.',
    tooltip: 'Swim straighter for real progress (VSL/VCL).',
    color: '#a5b4fc',
  },
  {
    key: 'flow',
    label: 'Flow',
    abbr: 'FLOW',
    description: 'Handling in currents and thicker mucus.',
    tooltip: 'Handle currents and thickness (rheotaxis/viscosity).',
    color: '#bef264',
  },
  {
    key: 'signals',
    label: 'Signals',
    abbr: 'SIG',
    description: 'How well you follow cues and trigger bursts.',
    tooltip: 'Follow cues and time bursts (chemotaxis/hyperactivation).',
    color: '#f9a8d4',
  },
]);

export const NAV_ITEMS = Object.freeze([
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'habits', label: 'Habits', icon: '📝' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]);

export const DEFAULT_HABIT_FORM = Object.freeze({
  exercise: false,
  sleep: false,
  hydration: false,
  noAlcohol: false,
  noNicotine: false,
  lCarnitine: false,
  coq10: false,
  micronutrients: false,
  matchaOrPineapple: false,
});

export const WELLNESS_STATES = Object.freeze([
  { threshold: 0, key: 'sadder', asset: '/sadder.png', alt: 'Sadder sperm buddy' },
  { threshold: 25, key: 'sad', asset: '/sad.png', alt: 'Sad sperm buddy' },
  { threshold: 40, key: 'neutral', asset: '/neutral.png', alt: 'Neutral sperm buddy' },
  { threshold: 75, key: 'happy', asset: '/happy.png', alt: 'Happy sperm buddy' },
  { threshold: 90, key: 'happiest', asset: '/happier.png', alt: 'Happiest sperm buddy' },
]);

