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
      asset: '/gooning.webp',
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
      asset: '/sleep.png',
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
      asset: '/water.webp',
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
      asset: '/drunk.png',
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
      asset: '/smoking.png',
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
      asset: '/fat.png',
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
      asset: '/laptop hot.png',
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
  // {
  //   id: 'lingerie',
  //   name: 'Silky Lingerie Set',
  //   price: 42,
  //   rarity: 'Rare',
  //   imagePath: '/lingerie.png',
  //   description: 'Because even petri dishes deserve a runway moment.',
  // },
  {
    id: 'among-us',
    name: 'Astronaut Suit',
    price: 55,
    rarity: 'Legendary',
    imagePath: '/amongus.png',
    description: 'Task: look adorable. Venting optional.',
  },
  {
    id: '67',
    name: '1 2 3 4 5 ...',
    price: 36,
    rarity: 'Common',
    imagePath: '/67.png',
    description: '67',
  },
  {
    id: 'butt-plug',
    name: 'Butt Plug',
    price: 48,
    rarity: 'Rare',
    imagePath: '/plug.png',
    description: 'Discreetly enhance your performance.',
  },
  {
    id: 'speed-core',
    name: 'I Need This',
    price: 60,
    rarity: 'Legendary',
    imagePath: '/speed.png',
    description: 'My mom is kinda homeless.',
  },
  {
    id: 'condom-suit',
    name: 'Safety First Suit',
    price: 30,
    rarity: 'Rare',
    imagePath: '/condom.png',
    description: 'Latex sheen with maximum protective swagger.',
  },
]);

const GRADIENT_ASSETS = Object.freeze({
  nebula:
    "data:image/svg+xml,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220%200%20600%20600%22%3E%3Cdefs%3E%3CradialGradient id%3D%22g%22 cx%3D%2230%25%22 cy%3D%2230%25%22 r%3D%2280%25%22%3E%3Cstop offset%3D%220%25%22 stop-color%3D%22%23f9a8d4%22 stop-opacity%3D%220.6%22/%3E%3Cstop offset%3D%2260%25%22 stop-color%3D%22%236366f1%22 stop-opacity%3D%220.45%22/%3E%3Cstop offset%3D%22100%25%22 stop-color%3D%22%230f172a%22 stop-opacity%3D%220.7%22/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width%3D%22600%22 height%3D%22600%22 fill%3D%22url(%23g)%22/%3E%3Ccircle cx%3D%22180%22 cy%3D%22100%22 r%3D%2280%22 fill%3D%22%23fde68a%22 fill-opacity%3D%220.15%22/%3E%3Ccircle cx%3D%22460%22 cy%3D%22440%22 r%3D%2290%22 fill%3D%22%23c084fc%22 fill-opacity%3D%220.15%22/%3E%3C/svg%3E",
  thermal:
    "data:image/svg+xml,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220%200%20600%20600%22%3E%3Cdefs%3E%3ClinearGradient id%3D%22t%22 x1%3D%220%25%22 y1%3D%220%25%22 x2%3D%22100%25%22 y2%3D%22100%25%22%3E%3Cstop offset%3D%220%25%22 stop-color%3D%22%230e7490%22 stop-opacity%3D%220.35%22/%3E%3Cstop offset%3D%2250%25%22 stop-color%3D%22%2338bdf8%22 stop-opacity%3D%220.35%22/%3E%3Cstop offset%3D%22100%25%22 stop-color%3D%22%23fbbf24%22 stop-opacity%3D%220.4%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width%3D%22600%22 height%3D%22600%22 fill%3D%22url(%23t)%22/%3E%3Cpath d%3D%22M0 460Q150 360 300 420t300-60v240H0Z%22 fill%3D%22%23f59e0b%22 fill-opacity%3D%220.18%22/%3E%3C/svg%3E",
  sterile:
    "data:image/svg+xml,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220%200%20600%20600%22%3E%3Cdefs%3E%3ClinearGradient id%3D%22s%22 x1%3D%220%25%22 y1%3D%220%25%22 x2%3D%22100%25%22 y2%3D%22100%25%22%3E%3Cstop offset%3D%220%25%22 stop-color%3D%22%23e2e8f0%22 stop-opacity%3D%220.95%22/%3E%3Cstop offset%3D%22100%25%22 stop-color%3D%22%2294a3b8%22 stop-opacity%3D%220.55%22/%3E%3C/linearGradient%3E%3Cpattern id%3D%22grid%22 width%3D%2230%22 height%3D%2230%22 patternUnits%3D%22userSpaceOnUse%22%3E%3Crect width%3D%2230%22 height%3D%2230%22 fill%3D%22none%22 stroke%3D%22%2394a3b8%22 stroke-opacity%3D%220.15%22 stroke-width%3D%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width%3D%22600%22 height%3D%22600%22 fill%3D%22url(%23s)%22/%3E%3Crect width%3D%22600%22 height%3D%22600%22 fill%3D%22url(%23grid)%22/%3E%3C/svg%3E",
});

export const SHOP_BACKGROUND_ITEMS = Object.freeze([
  {
    id: 'nebula-glow',
    name: 'Nebula Glow',
    price: 28,
    rarity: 'Rare',
    imagePath: GRADIENT_ASSETS.nebula,
    description: 'Soft cosmic gradients swirling behind your swimmer.',
  },
  {
    id: 'thermal-drift',
    name: 'Thermal Drift',
    price: 34,
    rarity: 'Epic',
    imagePath: GRADIENT_ASSETS.thermal,
    description: 'Warm currents meeting cool tides for dramatic depth.',
  },
  {
    id: 'sterile-lab',
    name: 'Sterile Lab',
    price: 18,
    rarity: 'Common',
    imagePath: GRADIENT_ASSETS.sterile,
    description: 'Clinical clean vibes for peak focus on stats.',
  },
  {
    id: 'sperm-kingdom',
    name: 'Sperm Kingdom',
    price: 65,
    rarity: 'Legendary',
    imagePath: '/sperm_kingdom.png',
    description: 'A candy-coated wonderland swarming with cheery swimmers.',
  },
]);

