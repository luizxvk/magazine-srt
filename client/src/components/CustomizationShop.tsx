import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Lock, Palette, Image, Award, Zap, PackageOpen, CircleDot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ThemePackCard from './ThemePackCard';
import SupplyBoxModal from './SupplyBoxModal';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'background' | 'badge' | 'color' | 'profileBorder';
    preview: string;
    owned: boolean;
    equipped: boolean;
}

interface CustomizationShopProps {
    isOpen: boolean;
    onClose: () => void;
}

// Default items (free, always owned)
const defaultItems = {
    background: { id: 'bg_default', name: 'Magazine Clássico', description: 'O visual padrão do Magazine', price: 0, type: 'background' as const, preview: 'linear-gradient(125deg, #0a0a0a 0%, #1a1a1a 100%)' },
    badge: { id: 'badge_crown', name: 'Coroa Magazine', description: 'Símbolo de elite', price: 0, type: 'badge' as const, preview: 'https://img.icons8.com/?size=100&id=hcZ65S78dSp6&format=png&color=000000' },
    badgeMGT: { id: 'badge_star', name: 'Estrela', description: 'Brilhe sempre', price: 0, type: 'badge' as const, preview: '⭐' },
    color: { id: 'color_gold', name: 'Dourado Magazine', description: 'A cor clássica Magazine', price: 0, type: 'color' as const, preview: '#d4af37' },
    colorMGT: { id: 'color_cyan', name: 'Ciano Neon', description: 'Azul elétrico vibrante', price: 0, type: 'color' as const, preview: '#00ffff' },
    profileBorder: { id: 'border_gold', name: 'Dourado Clássico', description: 'A borda padrão Magazine', price: 0, type: 'profileBorder' as const, preview: 'linear-gradient(135deg, #d4af37 0%, #f4e4a6 50%, #d4af37 100%)' },
    profileBorderMGT: { id: 'border_emerald', name: 'Esmeralda MGT', description: 'Verde MGT exclusivo', price: 0, type: 'profileBorder' as const, preview: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)' },
};

// Predefined backgrounds
const backgrounds: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.background,
    { id: 'bg_aurora', name: 'Aurora Boreal', description: 'Ondas suaves de luz em movimento', price: 600, type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
    { id: 'bg_galaxy', name: 'Galáxia', description: 'Estrelas e constelações', price: 500, type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
    { id: 'bg_retrowave', name: 'Retrowave', description: 'Synthwave retrô com sol e grid neon', price: 850, type: 'background', preview: 'linear-gradient(180deg, #1a0028 0%, #2d004a 30%, #ff006e 60%, #ff6b35 100%)' },
    { id: 'bg_fire', name: 'Fogo', description: 'Fogo dançante nas bordas', price: 400, type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
    { id: 'bg_oceano', name: 'Oceano', description: 'Oceano noturno com montanhas e estrelas', price: 800, type: 'background', preview: 'linear-gradient(180deg, #0a0a1a 0%, #1a2a4a 40%, #2a4a6a 70%, #1a3a5a 100%)' },
    { id: 'bg_forest', name: 'Floresta', description: 'Verde natural e sereno', price: 300, type: 'background', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
    { id: 'bg_city', name: 'Cidade Neon', description: 'Luzes urbanas vibrantes', price: 550, type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
    { id: 'bg_space', name: 'Espaço Profundo', description: 'Vastidão do cosmos', price: 700, type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
    // NOVOS FUNDOS ANIMADOS
    { id: 'bg_sunset', name: 'Pôr do Sol', description: 'Transição laranja-rosa vibrante', price: 650, type: 'background', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
    { id: 'bg_cyberpunk', name: 'Cyberpunk', description: 'Néon rosa e azul futurista', price: 750, type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
    { id: 'bg_lava', name: 'Lava', description: 'Magma incandescente em movimento', price: 800, type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
    { id: 'bg_ice', name: 'Gelo Ártico', description: 'Cristais de gelo azulados', price: 600, type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
    { id: 'bg_chuva_neon', name: 'Chuva Neon', description: 'Chuva digital estilo cyberpunk', price: 850, type: 'background', preview: 'linear-gradient(180deg, #0d0015 0%, #1a0030 40%, #00ff88 50%, #0d0015 100%)' },
    { id: 'bg_emerald', name: 'Esmeralda', description: 'Verde profundo luxuoso', price: 700, type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
    { id: 'bg_royal', name: 'Real Púrpura', description: 'Púrpura majestoso', price: 900, type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
    { id: 'bg_carbon', name: 'Fibra de Carbono', description: 'Textura escura premium', price: 500, type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
];

// FEATURED - Premium animated backgrounds
const featuredBackgrounds: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos', description: 'Triângulos 3D coloridos em movimento hipnótico', price: 2500, type: 'background', preview: 'radial-gradient(circle at 30% 30%, #ff0080 0%, transparent 30%), radial-gradient(circle at 70% 70%, #00ffff 0%, transparent 30%), radial-gradient(circle at center, #111 0%, #000 100%)' },
    { id: 'anim-gradient-waves', name: 'Ondas Gradiente', description: 'Gradiente animado com ondas fluidas', price: 2000, type: 'background', preview: 'linear-gradient(315deg, rgba(101,0,94,1) 3%, rgba(60,132,206,1) 38%, rgba(48,238,226,1) 68%, rgba(255,25,25,1) 98%)' },
    { id: 'anim-rainbow-skies', name: 'Rainbow Skies', description: 'Raios coloridos deslizando em fundo gradiente (Modo Claro)', price: 3000, type: 'background', preview: 'linear-gradient(315deg, rgba(232,121,249,1) 10%, rgba(96,165,250,1) 50%, rgba(94,234,212,1) 90%)' },
    { id: 'anim-infinite-triangles', name: 'Infinite Triangles', description: 'Grade hexagonal com triângulos infinitos na cor de destaque', price: 3500, type: 'background', preview: 'linear-gradient(135deg, var(--accent-color, #d4af37) 0%, rgba(212,175,55,0.3) 50%, #000 100%)' },
    { id: 'anim-moonlit-sky', name: 'Moonlit Sky', description: 'Céu noturno com lua, estrelas e nuvens em movimento', price: 4000, type: 'background', preview: 'radial-gradient(circle at 70% 20%, rgba(255,255,200,0.3) 0%, transparent 20%), linear-gradient(180deg, #000011 0%, #0a0a2e 50%, #1a1a4a 100%)' },
];

// Predefined badges (profile decorations)
const badges: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.badge,
    { id: 'badge_skull', name: 'Caveira', description: 'Estilo rebelde', price: 300, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000' },
    { id: 'badge_fire', name: 'Fogo', description: 'Queima tudo!', price: 200, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000' },
    { id: 'badge_diamond', name: 'Diamante', description: 'Precioso e raro', price: 500, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000' },
    { id: 'badge_lightning', name: 'Raio', description: 'Velocidade máxima', price: 400, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
    { id: 'badge_pony', name: 'Unicórnio', description: 'Mágico e único', price: 250, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000' },
    { id: 'badge_heart', name: 'Coração', description: 'Com amor', price: 200, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000' },
    { id: 'badge_moon', name: 'Lua', description: 'Noturno', price: 300, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000' },
    { id: 'badge_sun', name: 'Sol', description: 'Radiante', price: 350, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000' },
    // Novos badges
    { id: 'badge_seal', name: 'Foca', description: 'Fofinho e focado', price: 250, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000' },
    { id: 'badge_shark', name: 'Grande Norke', description: 'Predador dos mares', price: 450, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000' },
    { id: 'badge_egghead', name: 'Cabeça de Ovo', description: 'Pensador único', price: 350, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000' },
    { id: 'badge_xitada', name: 'Ta Xitada', description: 'Xitou geral!', price: 400, type: 'badge', preview: 'https://img.icons8.com/?size=100&id=8S7SkmQtNOry&format=png&color=000000' },
];

// Neon accent colors (excluding gold for Magazine exclusivity)
const colors: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.color,
    { id: 'color_rgb', name: 'RGB Dinâmico', description: 'Troca entre Red, Green, Blue ao vivo!', price: 1000, type: 'color', preview: 'rgb-dynamic' },
    { id: 'color_cyan', name: 'Ciano Neon', description: 'Azul elétrico vibrante', price: 400, type: 'color', preview: '#00ffff' },
    { id: 'color_magenta', name: 'Magenta Neon', description: 'Rosa intenso', price: 400, type: 'color', preview: '#ff00ff' },
    { id: 'color_lime', name: 'Verde Limão', description: 'Verde vibrante', price: 400, type: 'color', preview: '#00ff00' },
    { id: 'color_orange', name: 'Laranja Neon', description: 'Quente e energético', price: 400, type: 'color', preview: '#ff6600' },
    { id: 'color_purple', name: 'Roxo Neon', description: 'Misterioso e elegante', price: 400, type: 'color', preview: '#9933ff' },
    { id: 'color_pink', name: 'Rosa Neon', description: 'Doce e marcante', price: 400, type: 'color', preview: '#ff69b4' },
    { id: 'color_blue', name: 'Azul Elétrico', description: 'Clássico e moderno', price: 400, type: 'color', preview: '#0066ff' },
    { id: 'color_red', name: 'Vermelho Neon', description: 'Intenso e poderoso', price: 400, type: 'color', preview: '#ff0033' },
    // Pastel Colors
    { id: 'color_pastel_pink', name: 'Rosa Pastel', description: 'Delicado e suave', price: 350, type: 'color', preview: '#ffb6c1' },
    { id: 'color_pastel_lavender', name: 'Lavanda Pastel', description: 'Relaxante e elegante', price: 350, type: 'color', preview: '#e6e6fa' },
    { id: 'color_pastel_mint', name: 'Menta Pastel', description: 'Fresco e natural', price: 350, type: 'color', preview: '#98fb98' },
    { id: 'color_pastel_peach', name: 'Pêssego Pastel', description: 'Acolhedor e quente', price: 350, type: 'color', preview: '#ffdab9' },
    { id: 'color_pastel_sky', name: 'Céu Pastel', description: 'Sereno e calmo', price: 350, type: 'color', preview: '#87ceeb' },
    { id: 'color_pastel_coral', name: 'Coral Pastel', description: 'Vibrante mas suave', price: 350, type: 'color', preview: '#ffb5a7' },
    { id: 'color_pastel_lilac', name: 'Lilás Pastel', description: 'Romântico e místico', price: 350, type: 'color', preview: '#dda0dd' },
    { id: 'color_pastel_sage', name: 'Sálvia Pastel', description: 'Terroso e natural', price: 350, type: 'color', preview: '#9dc183' },
    { id: 'color_pastel_butter', name: 'Manteiga Pastel', description: 'Amarelo suave', price: 350, type: 'color', preview: '#fffacd' },
    { id: 'color_pastel_periwinkle', name: 'Pervinca Pastel', description: 'Azul-violeta delicado', price: 350, type: 'color', preview: '#ccccff' },
];

// Profile border styles (circular border around avatar)
const profileBorders: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    // Free defaults
    { id: 'border_gold', name: 'Dourado Clássico', description: 'A borda padrão Magazine', price: 0, type: 'profileBorder', preview: 'linear-gradient(135deg, #d4af37 0%, #f4e4a6 50%, #d4af37 100%)' },
    { id: 'border_emerald', name: 'Esmeralda MGT', description: 'Verde MGT exclusivo', price: 0, type: 'profileBorder', preview: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)' },
    
    // Pastel (400 Zions)
    { id: 'border_pastel_pink', name: 'Rosa Pastel', description: 'Suave e delicado', price: 400, type: 'profileBorder', preview: 'linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 50%, #ffb6c1 100%)' },
    { id: 'border_pastel_lavender', name: 'Lavanda Pastel', description: 'Relaxante e elegante', price: 400, type: 'profileBorder', preview: 'linear-gradient(135deg, #e6e6fa 0%, #dda0dd 50%, #e6e6fa 100%)' },
    { id: 'border_pastel_mint', name: 'Menta Pastel', description: 'Refrescante e suave', price: 400, type: 'profileBorder', preview: 'linear-gradient(135deg, #98fb98 0%, #90ee90 50%, #98fb98 100%)' },
    { id: 'border_pastel_peach', name: 'Pêssego Pastel', description: 'Aconchegante e doce', price: 400, type: 'profileBorder', preview: 'linear-gradient(135deg, #ffdab9 0%, #ffefd5 50%, #ffdab9 100%)' },
    { id: 'border_pastel_sky', name: 'Céu Pastel', description: 'Leve como nuvens', price: 400, type: 'profileBorder', preview: 'linear-gradient(135deg, #87ceeb 0%, #add8e6 50%, #87ceeb 100%)' },
    
    // Classic colors (500 Zions)
    { id: 'border_rose', name: 'Rosa Neon', description: 'Rosa vibrante e feminino', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #ff69b4 100%)' },
    { id: 'border_blue', name: 'Azul Elétrico', description: 'Azul intenso e moderno', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #00bfff 0%, #1e90ff 50%, #00bfff 100%)' },
    { id: 'border_purple', name: 'Roxo Real', description: 'Púrpura majestoso', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #9933ff 0%, #cc66ff 50%, #9933ff 100%)' },
    { id: 'border_green', name: 'Verde Esmeralda', description: 'Verde luxuoso', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #00ff7f 0%, #32cd32 50%, #00ff7f 100%)' },
    { id: 'border_red', name: 'Vermelho Fogo', description: 'Vermelho intenso e poderoso', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff4444 0%, #ff0000 50%, #ff4444 100%)' },
    { id: 'border_cyan', name: 'Ciano Neon', description: 'Azul-esverdeado elétrico', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #00ffff 0%, #00ced1 50%, #00ffff 100%)' },
    { id: 'border_orange', name: 'Laranja Fogo', description: 'Laranja quente e energético', price: 500, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff8c00 0%, #ff6600 50%, #ff8c00 100%)' },
    
    // Mid-tier (600-800 Zions)
    { id: 'border_midnight', name: 'Meia-Noite', description: 'Escuro e misterioso', price: 600, type: 'profileBorder', preview: 'linear-gradient(135deg, #191970 0%, #000080 50%, #191970 100%)' },
    { id: 'border_ocean', name: 'Oceano Profundo', description: 'Azul das profundezas', price: 700, type: 'profileBorder', preview: 'linear-gradient(135deg, #006994 0%, #0077be 25%, #00a9e0 50%, #0077be 75%, #006994 100%)' },
    { id: 'border_forest', name: 'Floresta', description: 'Verde natureza', price: 700, type: 'profileBorder', preview: 'linear-gradient(135deg, #228b22 0%, #32cd32 25%, #90ee90 50%, #32cd32 75%, #228b22 100%)' },
    { id: 'border_cherry_blossom', name: 'Flor de Cerejeira', description: 'Rosa primavera japonesa', price: 750, type: 'profileBorder', preview: 'linear-gradient(135deg, #ffb7c5 0%, #ff69b4 25%, #ffc0cb 50%, #ff69b4 75%, #ffb7c5 100%)' },
    { id: 'border_autumn', name: 'Outono', description: 'Tons terrosos de folhas', price: 750, type: 'profileBorder', preview: 'linear-gradient(135deg, #8b4513 0%, #d2691e 25%, #ff8c00 50%, #d2691e 75%, #8b4513 100%)' },
    { id: 'border_cotton_candy', name: 'Algodão Doce', description: 'Rosa e azul bebê', price: 800, type: 'profileBorder', preview: 'linear-gradient(135deg, #ffb3de 0%, #89cff0 50%, #ffb3de 100%)' },
    { id: 'border_ice', name: 'Gelo Ártico', description: 'Cristais de gelo', price: 800, type: 'profileBorder', preview: 'linear-gradient(135deg, #e0ffff 0%, #87ceeb 25%, #00bfff 50%, #87ceeb 75%, #e0ffff 100%)' },
    
    // Premium (900-1200 Zions)
    { id: 'border_sunset', name: 'Pôr do Sol', description: 'Cores do entardecer', price: 900, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 25%, #ff6b6b 50%, #feb47b 75%, #ff7e5f 100%)' },
    { id: 'border_fire', name: 'Chamas', description: 'Fogo ardente', price: 1000, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff4500 0%, #ff6600 25%, #ffcc00 50%, #ff6600 75%, #ff4500 100%)' },
    { id: 'border_aurora', name: 'Aurora Boreal', description: 'Luzes do norte', price: 1100, type: 'profileBorder', preview: 'linear-gradient(135deg, #00ff87 0%, #60efff 25%, #00ff87 50%, #60efff 75%, #00ff87 100%)' },
    { id: 'border_neon', name: 'Neon Vibes', description: 'Ciberpunk colorido', price: 1100, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 25%, #ff00ff 50%, #00ffff 75%, #ff00ff 100%)' },
    { id: 'border_lava', name: 'Lava Vulcânica', description: 'Magma incandescente', price: 1100, type: 'profileBorder', preview: 'linear-gradient(135deg, #8b0000 0%, #ff4500 25%, #ffd700 50%, #ff4500 75%, #8b0000 100%)' },
    { id: 'border_electric', name: 'Elétrico', description: 'Energia pura', price: 1100, type: 'profileBorder', preview: 'linear-gradient(135deg, #fff700 0%, #00ff00 25%, #00ffff 50%, #00ff00 75%, #fff700 100%)' },
    { id: 'border_mystic', name: 'Místico', description: 'Magia e mistério', price: 1200, type: 'profileBorder', preview: 'linear-gradient(135deg, #4b0082 0%, #9400d3 25%, #ff1493 50%, #9400d3 75%, #4b0082 100%)' },
    { id: 'border_galaxy', name: 'Galáxia', description: 'Estrelas e cosmos', price: 1200, type: 'profileBorder', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #4b0082 50%, #1a0a2e 75%, #0c0c0c 100%)' },
    
    // Ultra Premium (1500-2500 Zions)
    { id: 'border_rainbow', name: 'Arco-Íris', description: 'Todas as cores em harmonia', price: 1500, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00ff00 50%, #0080ff 67%, #8000ff 83%, #ff0080 100%)' },
    { id: 'border_diamond', name: 'Diamante', description: 'Brilho de diamante raro', price: 2000, type: 'profileBorder', preview: 'linear-gradient(135deg, #b9f2ff 0%, #e0ffff 20%, #ffffff 40%, #e0ffff 60%, #b9f2ff 80%, #ffffff 100%)' },
    { id: 'border_platinum', name: 'Platina', description: 'Metal precioso', price: 2000, type: 'profileBorder', preview: 'linear-gradient(135deg, #e5e4e2 0%, #c0c0c0 25%, #ffffff 50%, #c0c0c0 75%, #e5e4e2 100%)' },
    { id: 'border_holographic', name: 'Holográfico', description: 'Efeito iridescente', price: 2500, type: 'profileBorder', preview: 'linear-gradient(135deg, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #80ff00 37.5%, #00ff00 50%, #00ff80 62.5%, #00ffff 75%, #0080ff 87.5%, #ff00ff 100%)' },
    { id: 'border_cosmic', name: 'Cósmico', description: 'Nebulosas espaciais', price: 2500, type: 'profileBorder', preview: 'linear-gradient(135deg, #000033 0%, #4b0082 20%, #8b008b 40%, #ff1493 60%, #ff69b4 80%, #ffffff 100%)' },
    { id: 'border_phoenix', name: 'Fênix', description: 'Renascimento em chamas', price: 2500, type: 'profileBorder', preview: 'linear-gradient(135deg, #8b0000 0%, #ff0000 20%, #ff4500 40%, #ffa500 60%, #ffd700 80%, #ffffff 100%)' },
];

export default function CustomizationShop({ isOpen, onClose }: CustomizationShopProps) {
    const { user, updateUserZions, updateUser, theme, setPreviewTheme } = useAuth();
    const [activeTab, setActiveTab] = useState<'background' | 'badge' | 'color' | 'profileBorder' | 'packs'>('background');
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<{ background?: string; badge?: string; color?: string; profileBorder?: string }>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [themePacks, setThemePacks] = useState<any[]>([]);
    const [userPacks, setUserPacks] = useState<any[]>([]);
    const [showSupplyBox, setShowSupplyBox] = useState(false);
    const [loadingPacks, setLoadingPacks] = useState(false);

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'emerald' : 'gold';
    const isDarkMode = theme === 'dark';

    // Default items are always owned
    const defaultItemIds = [defaultItems.background.id, defaultItems.badge.id, defaultItems.color.id, defaultItems.profileBorder.id];
    // MGT users also get their default items
    const mgtDefaultItemIds = [defaultItems.badgeMGT.id, defaultItems.colorMGT.id, 'bg_galaxy', defaultItems.profileBorderMGT.id];

    useEffect(() => {
        if (isOpen) {
            fetchUserCustomizations();
            fetchThemePacks();
            api.get('/users/me').then(res => updateUser(res.data)); // Refresh user data on open
        }
    }, [isOpen]);

    const fetchThemePacks = async () => {
        try {
            setLoadingPacks(true);
            const [packsRes, userPacksRes] = await Promise.all([
                api.get('/theme-packs'),
                api.get('/theme-packs/my-packs')
            ]);
            setThemePacks(packsRes.data);
            setUserPacks(userPacksRes.data);
        } catch (error) {
            console.error('Error fetching theme packs:', error);
        } finally {
            setLoadingPacks(false);
        }
    };

    const fetchUserCustomizations = async () => {
        // Determine default items based on membership type
        const defaultBadge = isMGT ? defaultItems.badgeMGT.id : defaultItems.badge.id;
        const defaultColor = isMGT ? defaultItems.colorMGT.id : defaultItems.color.id;
        const defaultBg = isMGT ? 'bg_galaxy' : defaultItems.background.id; // MGT uses Galaxy as default
        const defaultBorder = isMGT ? defaultItems.profileBorderMGT.id : defaultItems.profileBorder.id;

        // Items that are always free/owned for the user
        const alwaysOwnedItems = isMGT 
            ? [...defaultItemIds, ...mgtDefaultItemIds]
            : [...defaultItemIds];

        try {
            const response = await api.get('/users/customizations');
            // User owns: default items + purchased items
            const purchasedItems = response.data.owned || [];
            setOwnedItems([...new Set([...alwaysOwnedItems, ...purchasedItems])]);
            
            // If no items equipped, set defaults based on membership
            const equipped = response.data.equipped || {};
            
            // Check if equipped badge is Magazine-exclusive for MGT user
            let badgeToEquip = equipped.badge || defaultBadge;
            if (isMGT && badgeToEquip === 'badge_crown') {
                badgeToEquip = defaultItems.badgeMGT.id;
            }
            
            // Check if equipped color is Magazine-exclusive for MGT user
            let colorToEquip = equipped.color || defaultColor;
            if (isMGT && colorToEquip === 'color_gold') {
                colorToEquip = defaultItems.colorMGT.id;
            }

            // Check if equipped border is Magazine-exclusive for MGT user
            let borderToEquip = equipped.profileBorder || defaultBorder;
            if (isMGT && borderToEquip === 'border_gold') {
                borderToEquip = defaultItems.profileBorderMGT.id;
            }
            
            setEquippedItems({
                background: equipped.background || defaultBg,
                badge: badgeToEquip,
                color: colorToEquip,
                profileBorder: borderToEquip
            });
        } catch (error) {
            console.error('Failed to fetch customizations', error);
            // On error, only show default items as owned
            setOwnedItems([...new Set(alwaysOwnedItems)]);
            setEquippedItems({
                background: defaultBg,
                badge: defaultBadge,
                color: defaultColor,
                profileBorder: defaultBorder
            });
        }
    };

    const handlePurchase = async (item: Omit<ShopItem, 'owned' | 'equipped'>) => {
        // Default items are free and always owned
        if (item.price === 0) {
            handleEquip(item);
            return;
        }

        // Check if user has made at least one post
        if (!user?.postCount || user.postCount < 1) {
            setNotification({ type: 'error', message: 'Faça sua primeira postagem para desbloquear a loja!' });
            setTimeout(() => setNotification(null), 4000);
            return;
        }

        if (!user || (user.zionsPoints || 0) < item.price) {
            setNotification({ type: 'error', message: 'Zions insuficientes!' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setPurchasing(item.id);
        try {
            const categoryMap: Record<string, string> = { background: 'backgrounds', badge: 'badges', color: 'colors', profileBorder: 'profileBorders' };
            await api.post('/users/customizations/purchase', {
                itemId: item.id,
                category: categoryMap[item.type]
            });
            setOwnedItems(prev => [...prev, item.id]);
            updateUserZions(-item.price); // Subtract price from zions
            setNotification({ type: 'success', message: `${item.name} adquirido!` });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao comprar item';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEquip = async (item: Omit<ShopItem, 'owned' | 'equipped'>) => {
        try {
            const categoryMap: Record<string, string> = { background: 'backgrounds', badge: 'badges', color: 'colors', profileBorder: 'profileBorders' };
            const payload = {
                itemId: item.id,
                category: categoryMap[item.type]
            };
            console.log('[CustomizationShop] Equipping item:', payload);

            const response = await api.post('/users/customizations/equip', payload);
            console.log('[CustomizationShop] Equip response:', response.data);

            setEquippedItems(prev => ({ ...prev, [item.type]: item.id }));

            // Update user state with the equipped item so it applies globally
            if (item.type === 'background') {
                updateUser({ ...user!, equippedBackground: item.id });
            } else if (item.type === 'badge') {
                updateUser({ ...user!, equippedBadge: item.id });
            } else if (item.type === 'color') {
                updateUser({ ...user!, equippedColor: item.id });
            } else if (item.type === 'profileBorder') {
                updateUser({ ...user!, equippedProfileBorder: item.id });
            }

            setNotification({ type: 'success', message: `${item.name} equipado!` });
        } catch (error: any) {
            console.error('[CustomizationShop] Equip error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.error || 'Erro ao equipar item';
            setNotification({ type: 'error', message: errorMsg });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUnequip = async (type: 'background' | 'badge' | 'color' | 'profileBorder') => {
        try {
            const categoryMap: Record<string, string> = { background: 'backgrounds', badge: 'badges', color: 'colors', profileBorder: 'profileBorders' };
            await api.post('/users/customizations/unequip', { category: categoryMap[type] });
            setEquippedItems(prev => ({ ...prev, [type]: undefined }));

            // Update user state to remove the equipped item
            if (type === 'background') {
                updateUser({ ...user!, equippedBackground: null });
            } else if (type === 'badge') {
                updateUser({ ...user!, equippedBadge: null });
            } else if (type === 'color') {
                updateUser({ ...user!, equippedColor: null });
            } else if (type === 'profileBorder') {
                updateUser({ ...user!, equippedProfileBorder: null });
            }

            setNotification({ type: 'success', message: 'Item desequipado!' });
        } catch (error) {
            console.error('Failed to unequip', error);
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handlePurchaseThemePack = async (packId: string) => {
        setPurchasing(packId);
        try {
            const response = await api.post(`/theme-packs/${packId}/purchase`);
            setNotification({ type: 'success', message: response.data.message });

            // Optimistically update owned packs to reflect change immediately
            setUserPacks(prev => [...prev, { packId: packId }]);

            fetchThemePacks(); // Refresh packs data for stock counts etc
            fetchUserCustomizations(); // Refresh zions balance
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao comprar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEquipThemePack = async (packId: string) => {
        setPurchasing(packId);
        try {
            const response = await api.post(`/theme-packs/${packId}/equip`);
            setNotification({ type: 'success', message: response.data.message });
            // Update user state with equipped items from pack (including badge)
            const pack = response.data.pack;
            if (pack) {
                updateUser({
                    ...user!,
                    equippedBackground: pack.backgroundUrl,
                    equippedColor: pack.accentColor,
                    equippedBadge: pack.badgeUrl || user!.equippedBadge
                });
            }
            fetchThemePacks(); // Refresh to update equipped status
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao equipar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleUnequipThemePack = async () => {
        setPurchasing('unequip');
        try {
            // Unequip background, color and badge
            await api.post('/users/customizations/unequip', { category: 'backgrounds' });
            await api.post('/users/customizations/unequip', { category: 'colors' });
            await api.post('/users/customizations/unequip', { category: 'badges' });
            
            setNotification({ type: 'success', message: 'Pack desequipado com sucesso!' });
            
            // Update user state to remove equipped items
            updateUser({
                ...user!,
                equippedBackground: null,
                equippedColor: null,
                equippedBadge: null
            });
            
            fetchThemePacks(); // Refresh to update equipped status
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao desequipar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handlePreviewPack = (pack: any) => {
        // Set global preview theme and close shop
        setPreviewTheme({
            background: pack.backgroundUrl,
            color: pack.accentColor,
            packName: pack.name,
            packId: pack.id,
            price: pack.price,
            badgeUrl: pack.badgeUrl
        });
        onClose(); // Close the shop to show the preview
    };

    // Listen for purchase event from preview bar
    React.useEffect(() => {
        const handlePurchaseEvent = async (e: Event) => {
            const customEvent = e as CustomEvent;
            const packId = customEvent.detail;
            await handlePurchaseThemePack(packId);
            setPreviewTheme(null);
        };

        window.addEventListener('purchasePreviewPack', handlePurchaseEvent);
        return () => window.removeEventListener('purchasePreviewPack', handlePurchaseEvent);
    }, []);

    const isOwned = (itemId: string) => ownedItems.includes(itemId);
    const isEquipped = (item: Omit<ShopItem, 'owned' | 'equipped'>) => equippedItems[item.type] === item.id;

    const getItems = () => {
        // Filter out Magazine-exclusive items for MGT users
        const filterMagazineExclusive = (items: typeof backgrounds | typeof badges | typeof colors | typeof featuredBackgrounds | typeof profileBorders) => {
            if (!isMGT) return items;
            // MGT users don't see Magazine-exclusive items (bg_default, badge_crown, color_gold, border_gold)
            return items.filter(item => !['bg_default', 'badge_crown', 'color_gold', 'border_gold'].includes(item.id));
        };

        switch (activeTab) {
            case 'background': {
                // Categorize backgrounds - regular and featured (animated)
                const regularBgs = filterMagazineExclusive(backgrounds) as typeof backgrounds;
                const featuredBgs = filterMagazineExclusive(featuredBackgrounds) as typeof featuredBackgrounds;
                return { regularBgs, featuredBgs };
            }
            case 'badge': return filterMagazineExclusive(badges);
            case 'color': {
                // Categorize colors
                const allColors = filterMagazineExclusive(colors) as typeof colors;
                const basicColors = allColors.filter(c => !c.id.includes('pastel'));
                const pastelColors = allColors.filter(c => c.id.includes('pastel'));
                return { basicColors, pastelColors };
            }
            case 'profileBorder': {
                // Categorize borders - basic and special
                const allBorders = filterMagazineExclusive(profileBorders) as typeof profileBorders;
                const basicBorders = allBorders.filter(b => b.price <= 500);
                const premiumBorders = allBorders.filter(b => b.price > 500);
                return { basicBorders, premiumBorders };
            }
        }
    };

    const tabs = [
        { id: 'background' as const, label: 'Fundos', icon: Image },
        { id: 'badge' as const, label: 'Badges', icon: Award },
        { id: 'color' as const, label: 'Cores', icon: Palette },
        { id: 'profileBorder' as const, label: 'Bordas', icon: CircleDot },
        { id: 'packs' as const, label: 'Packs', icon: PackageOpen },
    ];

    if (!isOpen) return null;

    const bgMain = isDarkMode ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black' : 'bg-white';
    const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
    const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/80' : 'bg-black/40'} backdrop-blur-sm`}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className={`relative w-full max-w-2xl max-h-[85vh] ${bgMain} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-4 border-b ${borderColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-${themeColor}-500/10 to-transparent`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${themeColor}-500/20`}>
                                <Sparkles className={`w-5 h-5 text-${themeColor}-400`} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${textMain}`}>Meu Estilo</h2>
                                <p className={`text-xs ${textSub}`}>Customize seu perfil</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <button
                                onClick={() => setShowSupplyBox(true)}
                                className={`px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-1 whitespace-nowrap`}
                            >
                                <PackageOpen className="w-3 h-3" />
                                <span className="hidden sm:inline">Supply</span> Box
                            </button>
                            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-${themeColor}-500/20 border border-${themeColor}-500/30`}>
                                <Zap className={`w-3 sm:w-4 h-3 sm:h-4 text-${themeColor}-400`} />
                                <span className={`text-xs sm:text-sm font-bold text-${themeColor}-400 whitespace-nowrap`}>{user?.zionsPoints?.toLocaleString() || 0} Points</span>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                <X className={`w-5 h-5 ${textSub}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notification Toast - Fixed at bottom center of screen */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl z-[200] shadow-xl backdrop-blur-md ${notification.type === 'success' ? 'bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-red-500/30 text-red-300 border border-red-500/40'
                                    }`}
                            >
                                <span className="font-medium">{notification.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs - scroll horizontal para caber todos */}
                    <div className={`flex border-b ${borderColor} overflow-x-auto scrollbar-hide`}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.id
                                    ? `text-${themeColor}-400 border-b-2 border-${themeColor}-400 bg-${themeColor}-500/5`
                                    : `${textSub} ${isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-100'}`
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)] custom-scrollbar">
                        {activeTab === 'packs' ? (
                            // Packs Tab - Real implementation
                            <div>
                                {loadingPacks ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
                                    </div>
                                ) : themePacks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className={`p-6 rounded-full bg-${themeColor}-500/10 mb-4`}>
                                            <PackageOpen className={`w-16 h-16 text-${themeColor}-400`} />
                                        </div>
                                        <h3 className={`text-xl font-bold ${textMain} mb-2`}>Packs de Tema</h3>
                                        <p className={`${textSub} max-w-md mb-4`}>
                                            Pacotes temáticos exclusivos inspirados em jogos! Cada pack inclui fundo animado + cor destaque única.
                                        </p>
                                        <div className={`px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm`}>
                                            Nenhum pack disponível no momento
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Legendary Packs Carousel */}
                                        {(() => {
                                            const legendaryPacks = themePacks.filter(p => p.rarity === 'LEGENDARY');
                                            if (legendaryPacks.length > 0) {
                                                return (
                                                    <div className="mb-8">
                                                        <h3 className={`text-lg font-bold ${textMain} mb-4`}>
                                                            Packs Lendários
                                                        </h3>
                                                        <div className="relative">
                                                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                                                                {legendaryPacks.map(pack => {
                                                                    const isOwned = userPacks.some(up => (up.packId === pack.id) || (up.themePackId === pack.id));
                                                                    const isEquipped = user?.equippedBackground === pack.backgroundUrl &&
                                                                        user?.equippedColor === pack.accentColor;

                                                                    return (
                                                                        <div key={pack.id} className="flex-shrink-0 w-80 snap-center">
                                                                            <ThemePackCard
                                                                                pack={{ ...pack, isOwned, isEquipped }}
                                                                                onPurchase={handlePurchaseThemePack}
                                                                                onEquip={handleEquipThemePack}
                                                                                onUnequip={handleUnequipThemePack}
                                                                                onPreview={!isOwned ? handlePreviewPack : undefined}
                                                                                loading={purchasing === pack.id || purchasing === 'unequip'}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Other Packs Grid */}
                                        {(() => {
                                            const otherPacks = themePacks.filter(p => p.rarity !== 'LEGENDARY');
                                            if (otherPacks.length > 0) {
                                                return (
                                                    <div>
                                                        <h3 className={`text-lg font-bold ${textMain} mb-4`}>
                                                            Outros Packs
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {otherPacks.map(pack => {
                                                                const isOwned = userPacks.some(up => (up.packId === pack.id) || (up.themePackId === pack.id));
                                                                const isEquipped = user?.equippedBackground === pack.backgroundUrl &&
                                                                    user?.equippedColor === pack.accentColor;

                                                                return (
                                                                    <ThemePackCard
                                                                        key={pack.id}
                                                                        pack={{ ...pack, isOwned, isEquipped }}
                                                                        onPurchase={handlePurchaseThemePack}
                                                                        onEquip={handleEquipThemePack}
                                                                        onUnequip={handleUnequipThemePack}
                                                                        onPreview={!isOwned ? handlePreviewPack : undefined}
                                                                        loading={purchasing === pack.id || purchasing === 'unequip'}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'color' ? (
                            // Render color categories
                            (() => {
                                const { basicColors, pastelColors } = getItems() as { basicColors: typeof colors; pastelColors: typeof colors };
                                return (
                                    <>
                                        {/* Basic Colors */}
                                        <div className="mb-6">
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Palette className={`w-4 h-4 text-${themeColor}-400`} />
                                                Cores Básicas
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {basicColors.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                {item.preview === 'rgb-dynamic' ? (
                                                                    <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                                ) : (
                                                                    <div
                                                                        className="w-16 h-16 rounded-full shadow-lg"
                                                                        style={{
                                                                            backgroundColor: item.preview,
                                                                            boxShadow: `0 0 30px ${item.preview}50`
                                                                        }}
                                                                    />
                                                                )}
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Pastel Colors */}
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Palette className={`w-4 h-4 text-${themeColor}-400`} />
                                                Tom Pastel
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {pastelColors.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                {item.preview === 'rgb-dynamic' ? (
                                                                    <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                                ) : (
                                                                    <div
                                                                        className="w-16 h-16 rounded-full shadow-lg"
                                                                        style={{
                                                                            backgroundColor: item.preview,
                                                                            boxShadow: `0 0 30px ${item.preview}50`
                                                                        }}
                                                                    />
                                                                )}
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        ) : activeTab === 'profileBorder' ? (
                            // Render profile border categories
                            (() => {
                                const { basicBorders, premiumBorders } = getItems() as { basicBorders: typeof profileBorders; premiumBorders: typeof profileBorders };
                                return (
                                    <>
                                        {/* Basic Borders */}
                                        <div className="mb-6">
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <CircleDot className={`w-4 h-4 text-${themeColor}-400`} />
                                                Bordas Básicas
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {basicBorders.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-black/30">
                                                                {/* Preview avatar with border */}
                                                                <div 
                                                                    className="w-20 h-20 rounded-full p-1"
                                                                    style={{ background: item.preview }}
                                                                >
                                                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                                                        <img
                                                                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip('profileBorder') : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Premium Borders */}
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Sparkles className={`w-4 h-4 text-${themeColor}-400`} />
                                                Bordas Premium
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${themeColor}-500/20 text-${themeColor}-400`}>ESPECIAL</span>
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {premiumBorders.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-black/30">
                                                                {/* Preview avatar with border */}
                                                                <div 
                                                                    className="w-20 h-20 rounded-full p-1"
                                                                    style={{ background: item.preview }}
                                                                >
                                                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                                                        <img
                                                                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip('profileBorder') : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        ) : activeTab === 'background' ? (
                            // Render background categories
                            (() => {
                                const { regularBgs, featuredBgs } = getItems() as { regularBgs: typeof backgrounds; featuredBgs: typeof featuredBackgrounds };
                                return (
                                    <>
                                        {/* Featured Backgrounds */}
                                        <div className="mb-6">
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Sparkles className={`w-4 h-4 text-${themeColor}-400`} />
                                                Featured
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${themeColor}-500/20 text-${themeColor}-400`}>PREMIUM</span>
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {featuredBgs.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                <div className="absolute inset-0 animate-wave-bg" style={{ background: item.preview, backgroundSize: '200% 200%' }} />
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Regular Backgrounds */}
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Image className={`w-4 h-4 text-${themeColor}-400`} />
                                                Fundos Básicos
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {regularBgs.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    const isFree = item.price === 0;
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                <div className="absolute inset-0 animate-wave-bg" style={{ background: item.preview, backgroundSize: '200% 200%' }} />
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                                {isFree && !(isMGT && item.id === 'bg_default') && (
                                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                                                                        <span className="text-[10px] font-bold text-green-400">GRÁTIS</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zionsPoints || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        ) : activeTab === 'badge' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(getItems() as typeof badges).map(item => {
                                    const owned = isOwned(item.id);
                                    const equipped = isEquipped(item);
                                    const isFree = item.price === 0;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ scale: 1.02 }}
                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                        >
                                            {/* Preview */}
                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                {item.type === 'background' && (
                                                    <div className="absolute inset-0 animate-wave-bg" style={{ background: item.preview, backgroundSize: '200% 200%' }} />
                                                )}
                                                {item.type === 'badge' && (
                                                    item.preview.startsWith('http') ? (
                                                        <img src={item.preview} alt={item.name} className="w-16 h-16 object-contain" />
                                                    ) : (
                                                        <span className="text-5xl">{item.preview}</span>
                                                    )
                                                )}
                                                {item.type === 'color' && (
                                                    item.preview === 'rgb-dynamic' ? (
                                                        <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                    ) : (
                                                        <div
                                                            className="w-16 h-16 rounded-full shadow-lg"
                                                            style={{
                                                                backgroundColor: item.preview,
                                                                boxShadow: `0 0 30px ${item.preview}50`
                                                            }}
                                                        />
                                                    )
                                                )}

                                                {/* Equipped badge */}
                                                {equipped && (
                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                        <Check className="w-3 h-3 text-black" />
                                                    </div>
                                                )}

                                                {/* Free badge for default items - Only show for Magazine Classico for Magazine members */}
                                                {isFree && !(isMGT && item.id === 'bg_default') && (
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                                                        <span className="text-[10px] font-bold text-green-400">GRÁTIS</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>

                                                {/* Action */}
                                                <div className="mt-2">
                                                    {owned ? (
                                                        <button
                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                }`}
                                                        >
                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePurchase(item)}
                                                            disabled={purchasing === item.id || (user?.zionsPoints || 0) < item.price}
                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${(user?.zionsPoints || 0) < item.price
                                                                ? `${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-300 text-gray-400'} cursor-not-allowed`
                                                                : `bg-${themeColor}-500 text-black hover:bg-${themeColor}-400`
                                                                }`}
                                                        >
                                                            {purchasing === item.id ? (
                                                                <span className="animate-spin">⏳</span>
                                                            ) : (user?.zionsPoints || 0) < item.price ? (
                                                                <>
                                                                    <Lock className="w-3 h-3" />
                                                                    {item.price}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Zap className="w-3 h-3" />
                                                                    {item.price}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>

            <SupplyBoxModal
                isOpen={showSupplyBox}
                onClose={() => setShowSupplyBox(false)}
                onSuccess={() => {
                    fetchThemePacks();
                    fetchUserCustomizations();
                }}
            />
        </AnimatePresence >
        , document.body);
}
