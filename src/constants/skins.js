// Ball Skin definitions with colors, physical material properties, and gem prices

export const SKINS = [
  {
    id: 'classic',
    name: 'Classic Silver',
    price: 0,
    color: '#888888',
    darkColor: '#bbbbbb',
    metalness: 0.9,
    roughness: 0.25,
  },
  {
    id: 'neon_ruby',
    name: 'Ruby Blaze',
    price: 50,
    color: '#ff1744',
    darkColor: '#ff5252',
    metalness: 0.8,
    roughness: 0.2,
  },
  {
    id: 'electric_sapphire',
    name: 'Sapphire Glow',
    price: 100,
    color: '#00b0ff',
    darkColor: '#40c4ff',
    metalness: 0.8,
    roughness: 0.2,
  },
  {
    id: 'emerald_gem',
    name: 'Emerald Core',
    price: 200,
    color: '#00e676',
    darkColor: '#69f0ae',
    metalness: 0.85,
    roughness: 0.2,
  },
  {
    id: 'cyber_gold',
    name: 'Cyber Gold',
    price: 350,
    color: '#ffd700',
    darkColor: '#ffe57f',
    metalness: 1.0,
    roughness: 0.15,
  },
  {
    id: 'amethyst_void',
    name: 'Amethyst Star',
    price: 500,
    color: '#d500f9',
    darkColor: '#e040fb',
    metalness: 0.9,
    roughness: 0.18,
  },
];

export const SKINS_MAP = SKINS.reduce((acc, skin) => {
  acc[skin.id] = skin;
  return acc;
}, {});
