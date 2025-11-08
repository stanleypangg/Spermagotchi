export const STAT_CONFIG = Object.freeze([
  {
    key: 'motility',
    label: 'Motility',
    abbr: 'M',
    description: 'Swim speed. Feeds base speed in every zone.',
    tooltip: 'Swim speed (akin to CASA VCL).',
    color: '#7dd3fc',
  },
  {
    key: 'linearity',
    label: 'Linearity',
    abbr: 'L',
    description: 'How straight you swim. Converts speed into forward progress.',
    tooltip: 'Swim straighter for real progress (VSL/VCL).',
    color: '#a5b4fc',
  },
  {
    key: 'flow',
    label: 'Flow',
    abbr: 'F',
    description: 'Handling in currents and thicker mucus.',
    tooltip: 'Handle currents and thickness (rheotaxis/viscosity).',
    color: '#bef264',
  },
  {
    key: 'signals',
    label: 'Signals',
    abbr: 'S',
    description: 'How well you follow cues and trigger bursts.',
    tooltip: 'Follow cues and time bursts (chemotaxis/hyperactivation).',
    color: '#f9a8d4',
  },
]);

export const NAV_ITEMS = Object.freeze([
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'shop', label: 'Shop', icon: '🛍️' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]);

export const GOOD_HABITS_CONFIG = Object.freeze([
  {
    key: 'drinkMatcha',
    title: 'Drink Matcha',
    effect: '+1 SIG · +0.5 FLOW',
    look: 'Matcha Glow',
    category: 'good',
    imageOverride: {
      asset: '/matcha.png',
      alt: 'Matcha glow buddy',
    },
  },
  {
    key: 'goon',
    title: 'Goon Session',
    effect: '+1.2 MOT · +0.5 SIG',
    look: 'Charge Sprint',
    category: 'good',
    imageOverride: {
      asset: '/happier.png',
      alt: 'Charged sprint buddy',
    },
  },
  {
    key: 'sleep8Hours',
    title: 'Sleep 8 Hours',
    effect: '+1.5 LIN · +0.5 MOT',
    look: 'Well Rested',
    category: 'good',
    imageOverride: {
      asset: '/neutral.png',
      alt: 'Well rested buddy',
    },
  },
  {
    key: 'drink2LWater',
    title: 'Drink 2L Water',
    effect: '+1.2 FLOW · +0.3 LIN',
    look: 'Hydro Glide',
    category: 'good',
    imageOverride: {
      asset: '/happy.png',
      alt: 'Hydrated buddy',
    },
  },
]);

export const BAD_HABITS_CONFIG = Object.freeze([
  {
    key: 'drinkAlcohol',
    title: 'Drink Alcohol',
    effect: '−1.5 MOT · −1 LIN · −0.5 SIG',
    look: 'Tipsy Drift',
    category: 'bad',
    imageOverride: {
      asset: '/sad.png',
      alt: 'Tipsy drift buddy',
    },
  },
  {
    key: 'smokeCigarettes',
    title: 'Smoke Cigarettes',
    effect: '−2 MOT · −1 SIG',
    look: 'Smoky Fade',
    category: 'bad',
    imageOverride: {
      asset: '/sadder.png',
      alt: 'Smoky fade buddy',
    },
  },
  {
    key: 'eatFastFood',
    title: 'Eat Fast Food',
    effect: '−1 MOT · −0.7 FLOW',
    look: 'Grease Crash',
    category: 'bad',
    imageOverride: {
      asset: '/sad.png',
      alt: 'Grease crash buddy',
    },
  },
  {
    key: 'hotLaptop',
    title: 'Hot Laptop on Lap',
    effect: '−1.2 MOT · −1 FLOW',
    look: 'Overheated',
    category: 'bad',
    imageOverride: {
      asset: '/sadder.png',
      alt: 'Overheated buddy',
    },
  },
]);

const habitDefaults = {};
const habitOverrides = {};

for (const habit of [...GOOD_HABITS_CONFIG, ...BAD_HABITS_CONFIG]) {
  habitDefaults[habit.key] = false;
  habitOverrides[habit.key] = {
    asset: habit.imageOverride.asset,
    alt: habit.imageOverride.alt,
    label: habit.look,
  };
}

export const DEFAULT_HABIT_FORM = Object.freeze(habitDefaults);

export const HABIT_IMAGE_OVERRIDES = Object.freeze(habitOverrides);

export const WELLNESS_STATES = Object.freeze([
  {
    threshold: 0,
    key: 'sadder',
    asset: '/sadder.png',
    alt: 'Sadder sperm buddy',
    label: 'Sadder',
  },
  {
    threshold: 25,
    key: 'sad',
    asset: '/sad.png',
    alt: 'Sad sperm buddy',
    label: 'Sad',
  },
  {
    threshold: 45,
    key: 'neutral',
    asset: '/neutral.png',
    alt: 'Neutral sperm buddy',
    label: 'Neutral',
  },
  {
    threshold: 70,
    key: 'happy',
    asset: '/happy.png',
    alt: 'Happy sperm buddy',
    label: 'Happy',
  },
  {
    threshold: 90,
    key: 'happiest',
    asset: '/happier.png',
    alt: 'Happiest sperm buddy',
    label: 'Happiest',
  },
]);

export const SHOP_CLOTHING_ITEMS = Object.freeze([
  {
    id: 'lingerie',
    name: 'Silky Lingerie Set',
    price: 42,
    rarity: 'Rare',
    imagePath: '/lingerie.png',
    description: 'Because even petri dishes deserve a runway moment.',
  },
  {
    id: 'among-us',
    name: 'Sus Capsule Suit',
    price: 55,
    rarity: 'Legendary',
    imagePath: '/among-us.png',
    description: 'Task: look adorable. Venting optional.',
  },
  {
    id: '67',
    name: 'No. 67 Race Kit',
    price: 36,
    rarity: 'Common',
    imagePath: '/67.png',
    description: 'Coach says channel your inner lane sixty-seven.',
  },
  {
    id: 'butt-plug',
    name: 'Chromed Plug Fin',
    price: 48,
    rarity: 'Rare',
    imagePath: '/plug.jpg',
    description: 'Hydrodynamics? Questionable. Confidence? Unshakable.',
  },
  {
    id: 'speed-core',
    name: 'I Need This',
    price: 60,
    rarity: 'Legendary',
    imagePath: '/speed.png',
    description: 'Built for reckless velocity and chaos energy.',
  },
]);

