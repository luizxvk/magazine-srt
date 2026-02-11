import { Request, Response } from 'express';
import { PrismaClient, ThemePackRarity } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Zions compensation for duplicates based on rarity
const DUPLICATE_COMPENSATION = {
    COMMON: 100,
    RARE: 200,
    EPIC: 400,
    LEGENDARY: 800
};

// Reward type weights (total = 100)
const REWARD_TYPE_WEIGHTS = {
    PACK: 25,           // 25% - ThemePacks
    BACKGROUND: 20,     // 20% - Backgrounds
    BADGE: 15,          // 15% - Badges  
    COLOR: 15,          // 15% - Colors
    BORDER: 15,         // 15% - Borders
    ZIONS: 10           // 10% - Zions bonus
};

// All items from CustomizationShop - organized by rarity based on price
// COMMON: 0-400 Zions | RARE: 401-800 Zions | EPIC: 801-1500 Zions | LEGENDARY: 1501+ Zions

const ITEM_POOLS = {
    BACKGROUND: [
        // COMMON (0-400)
        { id: 'bg_default', name: 'Magazine Clássico', rarity: 'COMMON' },
        { id: 'bg_forest', name: 'Floresta', rarity: 'COMMON' },
        { id: 'bg_fire', name: 'Fogo', rarity: 'COMMON' },
        // RARE (401-800)
        { id: 'bg_aurora', name: 'Aurora Boreal', rarity: 'RARE' },
        { id: 'bg_galaxy', name: 'Galáxia', rarity: 'RARE' },
        { id: 'bg_retrowave', name: 'Retrowave', rarity: 'RARE' },
        { id: 'bg_city', name: 'Cidade Neon', rarity: 'RARE' },
        { id: 'bg_space', name: 'Espaço Profundo', rarity: 'RARE' },
        { id: 'bg_sunset', name: 'Pôr do Sol', rarity: 'RARE' },
        { id: 'bg_cyberpunk', name: 'Cyberpunk', rarity: 'RARE' },
        { id: 'bg_lava', name: 'Lava', rarity: 'RARE' },
        { id: 'bg_ice', name: 'Gelo Ártico', rarity: 'RARE' },
        { id: 'bg_carbon', name: 'Fibra de Carbono', rarity: 'RARE' },
        { id: 'bg_emerald', name: 'Esmeralda', rarity: 'RARE' },
        { id: 'bg_oceano', name: 'Oceano', rarity: 'RARE' },
        // EPIC (801-1500)
        { id: 'bg_chuva_neon', name: 'Chuva Neon', rarity: 'EPIC' },
        { id: 'bg_royal', name: 'Real Púrpura', rarity: 'EPIC' },
        // LEGENDARY (1501+)
        { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos', rarity: 'LEGENDARY' },
        { id: 'anim-gradient-waves', name: 'Ondas Gradiente', rarity: 'LEGENDARY' },
        { id: 'anim-rainbow-skies', name: 'Rainbow Skies', rarity: 'LEGENDARY' },
        { id: 'anim-infinite-triangles', name: 'Infinite Triangles', rarity: 'LEGENDARY' },
        { id: 'anim-moonlit-sky', name: 'Moonlit Sky', rarity: 'LEGENDARY' },
        { id: 'anim-dark-veil', name: 'Véu Sombrio', rarity: 'LEGENDARY' },
        { id: 'anim-iridescence', name: 'Prisma Iridescente', rarity: 'LEGENDARY' },
    ],
    BADGE: [
        // COMMON (0-250)
        { id: 'badge_crown', name: 'Coroa Magazine', rarity: 'COMMON' },
        { id: 'badge_fire', name: 'Fogo', rarity: 'COMMON' },
        { id: 'badge_heart', name: 'Coração', rarity: 'COMMON' },
        { id: 'badge_pony', name: 'Unicórnio', rarity: 'COMMON' },
        { id: 'badge_seal', name: 'Foca', rarity: 'COMMON' },
        // RARE (251-400)
        { id: 'badge_skull', name: 'Caveira', rarity: 'RARE' },
        { id: 'badge_star', name: 'Estrela', rarity: 'RARE' },
        { id: 'badge_moon', name: 'Lua', rarity: 'RARE' },
        { id: 'badge_sun', name: 'Sol', rarity: 'RARE' },
        { id: 'badge_lightning', name: 'Raio', rarity: 'RARE' },
        { id: 'badge_egghead', name: 'Cabeça de Ovo', rarity: 'RARE' },
        // EPIC (401+)
        { id: 'badge_diamond', name: 'Diamante', rarity: 'EPIC' },
        { id: 'badge_shark', name: 'Grande Norke', rarity: 'EPIC' },
    ],
    COLOR: [
        // COMMON (0-350)
        { id: 'color_gold', name: 'Dourado Magazine', rarity: 'COMMON' },
        { id: 'color_pastel_pink', name: 'Rosa Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_lavender', name: 'Lavanda Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_mint', name: 'Menta Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_peach', name: 'Pêssego Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_sky', name: 'Céu Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_coral', name: 'Coral Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_lilac', name: 'Lilás Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_sage', name: 'Sálvia Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_butter', name: 'Manteiga Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_periwinkle', name: 'Pervinca Pastel', rarity: 'COMMON' },
        // RARE (351-500)
        { id: 'color_cyan', name: 'Ciano Neon', rarity: 'RARE' },
        { id: 'color_magenta', name: 'Magenta Neon', rarity: 'RARE' },
        { id: 'color_lime', name: 'Verde Limão', rarity: 'RARE' },
        { id: 'color_orange', name: 'Laranja Neon', rarity: 'RARE' },
        { id: 'color_purple', name: 'Roxo Neon', rarity: 'RARE' },
        { id: 'color_pink', name: 'Rosa Neon', rarity: 'RARE' },
        { id: 'color_blue', name: 'Azul Elétrico', rarity: 'RARE' },
        { id: 'color_red', name: 'Vermelho Neon', rarity: 'RARE' },
        // EPIC (600+) - Gradient Colors
        { id: 'color_gradient_sunset', name: 'Pôr do Sol', rarity: 'EPIC' },
        { id: 'color_gradient_ocean', name: 'Oceano', rarity: 'EPIC' },
        { id: 'color_gradient_aurora', name: 'Aurora Boreal', rarity: 'EPIC' },
        { id: 'color_gradient_fire', name: 'Fogo Infernal', rarity: 'EPIC' },
        { id: 'color_gradient_galaxy', name: 'Galáxia', rarity: 'EPIC' },
        { id: 'color_gradient_neon', name: 'Neon Elétrico', rarity: 'EPIC' },
        { id: 'color_gradient_forest', name: 'Floresta Mística', rarity: 'EPIC' },
        { id: 'color_gradient_gold', name: 'Dourado Premium', rarity: 'EPIC' },
        { id: 'color_gradient_midnight', name: 'Meia-Noite', rarity: 'EPIC' },
        { id: 'color_gradient_candy', name: 'Doce Intenso', rarity: 'EPIC' },
        // LEGENDARY (1000+)
        { id: 'color_rgb', name: 'RGB Dinâmico', rarity: 'LEGENDARY' },
    ],
    BORDER: [
        // COMMON (0-400) - Excluding default community borders (gold/emerald)
        { id: 'border_pastel_pink', name: 'Rosa Pastel', rarity: 'COMMON' },
        { id: 'border_pastel_lavender', name: 'Lavanda Pastel', rarity: 'COMMON' },
        { id: 'border_pastel_mint', name: 'Menta Pastel', rarity: 'COMMON' },
        { id: 'border_pastel_peach', name: 'Pêssego Pastel', rarity: 'COMMON' },
        { id: 'border_pastel_sky', name: 'Céu Pastel', rarity: 'COMMON' },
        // RARE (401-800)
        { id: 'border_rose', name: 'Rosa Neon', rarity: 'RARE' },
        { id: 'border_blue', name: 'Azul Elétrico', rarity: 'RARE' },
        { id: 'border_purple', name: 'Roxo Real', rarity: 'RARE' },
        { id: 'border_green', name: 'Verde Esmeralda', rarity: 'RARE' },
        { id: 'border_red', name: 'Vermelho Fogo', rarity: 'RARE' },
        { id: 'border_cyan', name: 'Ciano Neon', rarity: 'RARE' },
        { id: 'border_orange', name: 'Laranja Fogo', rarity: 'RARE' },
        { id: 'border_midnight', name: 'Meia-Noite', rarity: 'RARE' },
        { id: 'border_ocean', name: 'Oceano Profundo', rarity: 'RARE' },
        { id: 'border_forest', name: 'Floresta', rarity: 'RARE' },
        { id: 'border_cherry_blossom', name: 'Flor de Cerejeira', rarity: 'RARE' },
        { id: 'border_autumn', name: 'Outono', rarity: 'RARE' },
        { id: 'border_cotton_candy', name: 'Algodão Doce', rarity: 'RARE' },
        { id: 'border_ice', name: 'Gelo Ártico', rarity: 'RARE' },
        // EPIC (801-1500)
        { id: 'border_sunset', name: 'Pôr do Sol', rarity: 'EPIC' },
        { id: 'border_fire', name: 'Chamas', rarity: 'EPIC' },
        { id: 'border_aurora', name: 'Aurora Boreal', rarity: 'EPIC' },
        { id: 'border_neon', name: 'Neon Vibes', rarity: 'EPIC' },
        { id: 'border_lava', name: 'Lava Vulcânica', rarity: 'EPIC' },
        { id: 'border_electric', name: 'Elétrico', rarity: 'EPIC' },
        { id: 'border_mystic', name: 'Místico', rarity: 'EPIC' },
        { id: 'border_galaxy', name: 'Galáxia', rarity: 'EPIC' },
        { id: 'border_rainbow', name: 'Arco-Íris', rarity: 'EPIC' },
        // LEGENDARY (1501+)
        { id: 'border_diamond', name: 'Diamante', rarity: 'LEGENDARY' },
        { id: 'border_platinum', name: 'Platina', rarity: 'LEGENDARY' },
        { id: 'border_holographic', name: 'Holográfico', rarity: 'LEGENDARY' },
        { id: 'border_cosmic', name: 'Cósmico', rarity: 'LEGENDARY' },
        { id: 'border_phoenix', name: 'Fênix', rarity: 'LEGENDARY' },
    ]
};

// Zions bonus amounts by rarity
const ZIONS_BONUS = {
    COMMON: { min: 10, max: 50 },
    RARE: { min: 50, max: 100 },
    EPIC: { min: 100, max: 200 },
    LEGENDARY: { min: 200, max: 500 }
};

// Progressive costs
const COSTS = [0, 500, 1000, 2500, 5000];

// Helper function to select reward type based on weights
function selectRewardType(): string {
    const total = Object.values(REWARD_TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    
    for (const [type, weight] of Object.entries(REWARD_TYPE_WEIGHTS)) {
        rand -= weight;
        if (rand <= 0) return type;
    }
    return 'PACK';
}

// Helper function to select rarity
function selectRarity(): string {
    const rand = Math.random();
    if (rand > 0.97) return 'LEGENDARY';  // 3%
    if (rand > 0.85) return 'EPIC';       // 12%
    if (rand > 0.60) return 'RARE';       // 25%
    return 'COMMON';                       // 60%
}

// Helper to get random item from pool matching rarity
function getRandomItemByRarity(pool: Array<{id: string, name: string, rarity: string}>, targetRarity: string) {
    const matchingItems = pool.filter(item => item.rarity === targetRarity);
    
    if (matchingItems.length === 0) {
        // Fallback: try lower rarities
        const rarityOrder = ['LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        
        for (let i = targetIndex + 1; i < rarityOrder.length; i++) {
            const fallbackItems = pool.filter(item => item.rarity === rarityOrder[i]);
            if (fallbackItems.length > 0) {
                return fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
            }
        }
        // Last resort: any item
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    return matchingItems[Math.floor(Math.random() * matchingItems.length)];
}

export const openDailySupplyBox = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const opensToday = await prisma.zionHistory.count({
            where: {
                userId,
                reason: { startsWith: 'Supply Box Open' },
                createdAt: { gte: today }
            }
        });

        const costIndex = Math.min(opensToday, COSTS.length - 1);
        const cost = COSTS[costIndex];

        // Check balance if cost > 0
        if (cost > 0) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { zionsPoints: true } });
            if (!user || user.zionsPoints < cost) {
                return res.status(400).json({
                    error: `Saldo insuficiente. Custo: ${cost} Zions Points.`,
                    nextCost: cost
                });
            }

            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { decrement: cost } }
            });
        }

        // Log the attempt
        await prisma.zionHistory.create({
            data: {
                userId,
                amount: -cost,
                reason: `Supply Box Open #${opensToday + 1}`,
                currency: 'POINTS'
            }
        });

        // Select reward type and rarity
        const rewardType = selectRewardType();
        const selectedRarity = selectRarity();
        const nextCost = COSTS[Math.min(opensToday + 1, COSTS.length - 1)];

        let result: any = {
            type: 'NEW_ITEM',
            rewardType,
            rarity: selectedRarity,
            item: null,
            compensation: 0,
            message: '',
            nextCost
        };

        // Handle based on reward type
        if (rewardType === 'PACK') {
            // ThemePack from database
            let packs = await prisma.themePack.findMany({
                where: { rarity: selectedRarity as ThemePackRarity, isActive: true }
            });

            if (packs.length === 0) {
                packs = await prisma.themePack.findMany({ where: { isActive: true } });
            }

            if (packs.length === 0) {
                // No packs - give Zions instead
                const bonus = 100;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: bonus } }
                });
                // Registrar crédito no histórico (fallback sem packs)
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: bonus,
                        reason: `Supply Box - Bônus de ${bonus} Zions`,
                        currency: 'POINTS'
                    }
                });
                result.rewardType = 'ZIONS';
                result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
                result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;
                return res.json(result);
            }

            const selectedPack = packs[Math.floor(Math.random() * packs.length)];
            result.item = selectedPack;
            result.rarity = selectedPack.rarity;

            const existingOwnership = await prisma.userThemePack.findUnique({
                where: { userId_packId: { userId, packId: selectedPack.id } }
            });

            if (existingOwnership) {
                const compensation = DUPLICATE_COMPENSATION[selectedPack.rarity as keyof typeof DUPLICATE_COMPENSATION] || 200;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: compensation } }
                });
                // Registrar compensação de duplicata no histórico
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: compensation,
                        reason: `Supply Box - Duplicata: ${selectedPack.name} (+${compensation} Zions)`,
                        currency: 'POINTS'
                    }
                });
                result.type = 'DUPLICATE';
                result.compensation = compensation;
                result.message = `Duplicata: ${selectedPack.name}! Você recebeu ${compensation} Pontos.`;
            } else {
                await prisma.userThemePack.create({
                    data: { userId, packId: selectedPack.id, price: cost }
                });
                result.message = `Você ganhou o Pack: ${selectedPack.name}!`;
            }

        } else if (rewardType === 'ZIONS') {
            // Zions bonus
            const bonusRange = ZIONS_BONUS[selectedRarity as keyof typeof ZIONS_BONUS] || ZIONS_BONUS.COMMON;
            const bonus = Math.floor(Math.random() * (bonusRange.max - bonusRange.min + 1)) + bonusRange.min;
            
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { increment: bonus } }
            });

            // Registrar crédito no histórico
            await prisma.zionHistory.create({
                data: {
                    userId,
                    amount: bonus,
                    reason: `Supply Box - Bônus de ${bonus} Zions`,
                    currency: 'POINTS'
                }
            });

            result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
            result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;

        } else {
            // Individual items (BACKGROUND, BADGE, COLOR, BORDER)
            const pool = ITEM_POOLS[rewardType as keyof typeof ITEM_POOLS];
            
            if (!pool || pool.length === 0) {
                // Fallback to Zions
                const bonus = 50;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: bonus } }
                });
                // Registrar crédito no histórico (fallback sem itens)
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: bonus,
                        reason: `Supply Box - Bônus de ${bonus} Zions`,
                        currency: 'POINTS'
                    }
                });
                result.rewardType = 'ZIONS';
                result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
                result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;
                return res.json(result);
            }

            const selectedItem = getRandomItemByRarity(pool, selectedRarity);
            result.item = selectedItem;
            result.rarity = selectedItem.rarity;

            // Get user's owned customizations (stored as JSON string)
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { ownedCustomizations: true }
            });

            let ownedItems: string[] = [];
            try {
                if (user?.ownedCustomizations) {
                    ownedItems = JSON.parse(user.ownedCustomizations);
                }
            } catch {
                ownedItems = [];
            }

            if (ownedItems.includes(selectedItem.id)) {
                // Duplicate
                const compensation = DUPLICATE_COMPENSATION[selectedItem.rarity as keyof typeof DUPLICATE_COMPENSATION] || 100;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: compensation } }
                });
                // Registrar compensação de duplicata no histórico
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: compensation,
                        reason: `Supply Box - Duplicata: ${selectedItem.name} (+${compensation} Zions)`,
                        currency: 'POINTS'
                    }
                });
                result.type = 'DUPLICATE';
                result.compensation = compensation;
                result.message = `Duplicata: ${selectedItem.name}! Você recebeu ${compensation} Pontos.`;
            } else {
                // Add to owned customizations
                ownedItems.push(selectedItem.id);
                await prisma.user.update({
                    where: { id: userId },
                    data: { ownedCustomizations: JSON.stringify(ownedItems) }
                });
                
                const typeNames: Record<string, string> = {
                    BACKGROUND: 'Fundo',
                    BADGE: 'Badge',
                    COLOR: 'Cor',
                    BORDER: 'Borda'
                };
                result.message = `Você ganhou ${typeNames[rewardType] || 'Item'}: ${selectedItem.name}!`;
            }
        }

        res.json(result);

    } catch (error) {
        console.error('Error opening supply box:', error);
        res.status(500).json({ error: 'Erro ao abrir Supply Box' });
    }
};

export const getSupplyBoxStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const opensToday = await prisma.zionHistory.count({
            where: {
                userId,
                reason: { startsWith: 'Supply Box Open' },
                createdAt: { gte: today }
            }
        });

        const costIndex = Math.min(opensToday, COSTS.length - 1);
        const cost = COSTS[costIndex];
        const nextCost = COSTS[Math.min(opensToday + 1, COSTS.length - 1)];

        res.json({
            opensToday,
            cost,
            nextCost,
            isFree: cost === 0
        });
    } catch (error) {
        console.error('Error fetching supply box status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
