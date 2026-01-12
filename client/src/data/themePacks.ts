export interface ThemePack {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  backgroundColor: string; // Animated background ID
  accentColor: string; // Highlight color ID
  previewGradient: string; // CSS gradient for preview card
  category: 'shooter' | 'rpg' | 'cyberpunk' | 'fantasy' | 'horror' | 'adventure';
}

export const themePacks: ThemePack[] = [
  {
    id: 'arc-raiders',
    name: 'Arc Raiders',
    description: 'Pack inspirado no universo futurista de Arc Raiders. Inclui fundo animado sci-fi e cor destaque azul neon.',
    price: 500,
    image: '/packs/arc-raiders.jpg',
    backgroundColor: 'bg-tech-grid',
    accentColor: 'cyan',
    previewGradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    category: 'shooter'
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    description: 'Entre no futuro de Night City com este pack vibrante. Fundo cyberpunk + cor destaque amarelo neon.',
    price: 600,
    image: '/packs/cyberpunk.jpg',
    backgroundColor: 'bg-neon-city',
    accentColor: 'yellow',
    previewGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    category: 'cyberpunk'
  },
  {
    id: 'red-dead-redemption',
    name: 'Red Dead Redemption',
    description: 'Viva o velho oeste com este pack temático. Fundo desértico + cor destaque vermelho terra.',
    price: 450,
    image: '/packs/red-dead.jpg',
    backgroundColor: 'bg-desert-sunset',
    accentColor: 'red',
    previewGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    category: 'adventure'
  },
  {
    id: 'the-witcher',
    name: 'The Witcher',
    description: 'Pack inspirado no mundo de Geralt de Rivia. Fundo medieval + cor destaque prata mística.',
    price: 550,
    image: '/packs/witcher.jpg',
    backgroundColor: 'bg-medieval-castle',
    accentColor: 'gray',
    previewGradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    category: 'fantasy'
  },
  {
    id: 'resident-evil',
    name: 'Resident Evil',
    description: 'Sobreviva ao horror com este pack sombrio. Fundo apocalíptico + cor destaque verde bioazard.',
    price: 480,
    image: '/packs/resident-evil.jpg',
    backgroundColor: 'bg-zombie-outbreak',
    accentColor: 'green',
    previewGradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    category: 'horror'
  },
  {
    id: 'valorant',
    name: 'Valorant',
    description: 'Pack tático inspirado em Valorant. Fundo geométrico futurista + cor destaque vermelho tactical.',
    price: 520,
    image: '/packs/valorant.jpg',
    backgroundColor: 'bg-tactical-grid',
    accentColor: 'rose',
    previewGradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    category: 'shooter'
  },
  {
    id: 'elden-ring',
    name: 'Elden Ring',
    description: 'Pack inspirado nas Terras Intermédias. Fundo místico dourado + cor destaque ouro ancestral.',
    price: 650,
    image: '/packs/elden-ring.jpg',
    backgroundColor: 'bg-golden-tree',
    accentColor: 'amber',
    previewGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    category: 'rpg'
  },
  {
    id: 'god-of-war',
    name: 'God of War',
    description: 'Pack épico inspirado na mitologia nórdica. Fundo nevado + cor destaque azul gélido.',
    price: 580,
    image: '/packs/god-of-war.jpg',
    backgroundColor: 'bg-nordic-frost',
    accentColor: 'blue',
    previewGradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    category: 'adventure'
  },
  {
    id: 'stray',
    name: 'Stray',
    description: 'Pack inspirado na jornada do gatinho cyberpunk. Fundo neon urbano + cor destaque laranja quente.',
    price: 420,
    image: '/packs/stray.jpg',
    backgroundColor: 'bg-neon-alley',
    accentColor: 'orange',
    previewGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    category: 'cyberpunk'
  },
  {
    id: 'hollow-knight',
    name: 'Hollow Knight',
    description: 'Pack inspirado em Hallownest. Fundo sombrio subterrâneo + cor destaque branco espectral.',
    price: 490,
    image: '/packs/hollow-knight.jpg',
    backgroundColor: 'bg-dark-cavern',
    accentColor: 'slate',
    previewGradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    category: 'fantasy'
  }
];

// Helper function to get pack by ID
export const getPackById = (id: string): ThemePack | undefined => {
  return themePacks.find(pack => pack.id === id);
};

// Helper function to get packs by category
export const getPacksByCategory = (category: ThemePack['category']): ThemePack[] => {
  return themePacks.filter(pack => pack.category === category);
};

// Helper function to get all categories
export const getAllCategories = (): ThemePack['category'][] => {
  return ['shooter', 'rpg', 'cyberpunk', 'fantasy', 'horror', 'adventure'];
};
