import { Request, Response } from 'express';
import { PrismaClient, ThemePackRarity } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Drop Rates for rarity
const RATES = {
    [ThemePackRarity.COMMON]: 0.60,
    [ThemePackRarity.RARE]: 0.25,
    [ThemePackRarity.EPIC]: 0.12,
    [ThemePackRarity.LEGENDARY]: 0.03
};

// Zions compensation for duplicates
const DUPLICATE_COMPENSATION = {
    [ThemePackRarity.COMMON]: 300,
    [ThemePackRarity.RARE]: 500,
    [ThemePackRarity.EPIC]: 800,
    [ThemePackRarity.LEGENDARY]: 1500
};

// Reward type weights (total = 100)
const REWARD_TYPE_WEIGHTS = {
    PACK: 30,          // 30% - ThemePacks
    BACKGROUND: 20,    // 20% - Backgrounds
    BADGE: 15,         // 15% - Badges  
    COLOR: 15,         // 15% - Colors
    BORDER: 10,        // 10% - Borders
    ZIONS: 10          // 10% - Zions bonus
};

// Individual items pool (same IDs as InventoryCard)
const ITEM_POOLS = {
    BACKGROUND: [
        { id: 'bg_aurora', name: 'Aurora Boreal', rarity: 'COMMON' },
        { id: 'bg_sunset', name: 'Pôr do Sol', rarity: 'COMMON' },
        { id: 'bg_ocean', name: 'Oceano Profundo', rarity: 'COMMON' },
        { id: 'bg_forest', name: 'Floresta', rarity: 'COMMON' },
        { id: 'bg_galaxy', name: 'Galáxia', rarity: 'RARE' },
        { id: 'bg_matrix', name: 'Matrix', rarity: 'RARE' },
        { id: 'bg_fire', name: 'Fogo', rarity: 'COMMON' },
        { id: 'bg_city', name: 'Cidade', rarity: 'COMMON' },
        { id: 'bg_space', name: 'Espaço', rarity: 'RARE' },
        { id: 'bg_cyberpunk', name: 'Cyberpunk', rarity: 'EPIC' },
        { id: 'bg_lava', name: 'Lava', rarity: 'RARE' },
        { id: 'bg_ice', name: 'Gelo', rarity: 'COMMON' },
        { id: 'bg_neon_grid', name: 'Neon Grid', rarity: 'EPIC' },
        { id: 'bg_emerald', name: 'Esmeralda', rarity: 'RARE' },
        { id: 'bg_royal', name: 'Royal', rarity: 'EPIC' },
        { id: 'bg_carbon', name: 'Carbon', rarity: 'COMMON' },
        { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos', rarity: 'LEGENDARY' },
        { id: 'anim-gradient-waves', name: 'Ondas Gradiente', rarity: 'LEGENDARY' },
        { id: 'anim-rainbow-skies', name: 'Rainbow Skies', rarity: 'LEGENDARY' },
        { id: 'anim-infinite-triangles', name: 'Infinite Triangles', rarity: 'LEGENDARY' },
        { id: 'anim-moonlit-sky', name: 'Moonlit Sky', rarity: 'EPIC' },
    ],
    BADGE: [
        { id: 'badge_crown', name: 'Coroa', rarity: 'LEGENDARY' },
        { id: 'badge_skull', name: 'Caveira', rarity: 'RARE' },
        { id: 'badge_fire', name: 'Fogo', rarity: 'COMMON' },
        { id: 'badge_diamond', name: 'Diamante', rarity: 'EPIC' },
        { id: 'badge_star', name: 'Estrela', rarity: 'COMMON' },
        { id: 'badge_lightning', name: 'Raio', rarity: 'RARE' },
        { id: 'badge_pony', name: 'Unicórnio', rarity: 'EPIC' },
        { id: 'badge_heart', name: 'Coração', rarity: 'COMMON' },
        { id: 'badge_moon', name: 'Lua', rarity: 'RARE' },
        { id: 'badge_sun', name: 'Sol', rarity: 'RARE' },
    ],
    COLOR: [
        { id: 'color_gold', name: 'Dourado', rarity: 'EPIC' },
        { id: 'color_rgb', name: 'RGB Dinâmico', rarity: 'LEGENDARY' },
        { id: 'color_cyan', name: 'Ciano', rarity: 'RARE' },
        { id: 'color_magenta', name: 'Magenta', rarity: 'RARE' },
        { id: 'color_lime', name: 'Lima', rarity: 'COMMON' },
        { id: 'color_orange', name: 'Laranja', rarity: 'COMMON' },
        { id: 'color_purple', name: 'Roxo', rarity: 'RARE' },
        { id: 'color_pink', name: 'Rosa', rarity: 'COMMON' },
        { id: 'color_blue', name: 'Azul', rarity: 'COMMON' },
        { id: 'color_red', name: 'Vermelho', rarity: 'COMMON' },
        { id: 'color_pastel_pink', name: 'Rosa Pastel', rarity: 'COMMON' },
        { id: 'color_pastel_lavender', name: 'Lavanda', rarity: 'COMMON' },
        { id: 'color_pastel_mint', name: 'Menta', rarity: 'COMMON' },
        { id: 'color_pastel_peach', name: 'Pêssego', rarity: 'COMMON' },
        { id: 'color_pastel_sky', name: 'Céu', rarity: 'COMMON' },
    ],
    BORDER: [
        { id: 'border_gold', name: 'Borda Dourada', rarity: 'EPIC' },
        { id: 'border_silver', name: 'Borda Prateada', rarity: 'RARE' },
        { id: 'border_bronze', name: 'Borda Bronze', rarity: 'COMMON' },
        { id: 'border_neon', name: 'Borda Neon', rarity: 'LEGENDARY' },
        { id: 'border_rainbow', name: 'Borda Arco-íris', rarity: 'LEGENDARY' },
        { id: 'border_fire', name: 'Borda Fogo', rarity: 'EPIC' },
        { id: 'border_ice', name: 'Borda Gelo', rarity: 'RARE' },
        { id: 'border_emerald', name: 'Borda Esmeralda', rarity: 'RARE' },
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
    return 'PACK'; // Default fallback
}

// Helper function to select rarity
function selectRarity(): string {
    const rand = Math.random();
    if (rand > 0.97) return 'LEGENDARY';
    if (rand > 0.85) return 'EPIC';
    if (rand > 0.60) return 'RARE';
    return 'COMMON';
}

// Helper to get random item from pool matching rarity
function getRandomItemByRarity(pool: typeof ITEM_POOLS.BACKGROUND, targetRarity: string) {
    // Filter by rarity
    const matchingItems = pool.filter(item => item.rarity === targetRarity);
    
    // If no items of that rarity, try lower rarities
    if (matchingItems.length === 0) {
        const fallbackItems = pool.filter(item => 
            (targetRarity === 'LEGENDARY' && ['EPIC', 'RARE', 'COMMON'].includes(item.rarity)) ||
            (targetRarity === 'EPIC' && ['RARE', 'COMMON'].includes(item.rarity)) ||
            (targetRarity === 'RARE' && item.rarity === 'COMMON')
        );
        if (fallbackItems.length > 0) {
            return fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
        }
        // Last resort: any item from pool
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

            // Deduct cost
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { decrement: cost } }
            });
        }

        // Log the attempt (even if free) to track count
        await prisma.zionHistory.create({
            data: {
                userId,
                amount: -cost,
                reason: `Supply Box Open #${opensToday + 1}`
            }
        });

        // 1. Select reward type
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

        // 2. Handle based on reward type
        if (rewardType === 'PACK') {
            // ThemePack logic (original)
            const packs = await prisma.themePack.findMany({
                where: { rarity: selectedRarity as ThemePackRarity, isActive: true }
            });

            if (packs.length === 0) {
                // Fallback to any active pack
                const anyPacks = await prisma.themePack.findMany({
                    where: { isActive: true }
                });
                if (anyPacks.length === 0) {
                    return res.status(500).json({ error: 'Erro ao gerar loot: Sem packs disponíveis' });
                }
                const selectedPack = anyPacks[Math.floor(Math.random() * anyPacks.length)];
                result.item = selectedPack;
                result.rarity = selectedPack.rarity;
            } else {
                result.item = packs[Math.floor(Math.random() * packs.length)];
            }

            // Check if user already owns it
            const existingOwnership = await prisma.userThemePack.findUnique({
                where: {
                    userId_packId: {
                        userId,
                        packId: result.item.id
                    }
                }
            });

            if (existingOwnership) {
                const compensation = DUPLICATE_COMPENSATION[result.rarity as ThemePackRarity] || 300;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: compensation } }
                });
                result.type = 'DUPLICATE';
                result.compensation = compensation;
                result.message = `Duplicata: ${result.item.name}! Você recebeu ${compensation} Pontos.`;
            } else {
                await prisma.userThemePack.create({
                    data: {
                        userId,
                        packId: result.item.id,
                        price: cost
                    }
                });
                result.message = `Você ganhou o Pack: ${result.item.name}!`;
            }

        } else if (rewardType === 'ZIONS') {
            // Zions bonus
            const bonusRange = ZIONS_BONUS[selectedRarity as keyof typeof ZIONS_BONUS] || ZIONS_BONUS.COMMON;
            const bonus = Math.floor(Math.random() * (bonusRange.max - bonusRange.min + 1)) + bonusRange.min;
            
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { increment: bonus } }
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
                result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
                result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;
                result.rewardType = 'ZIONS';
            } else {
                const selectedItem = getRandomItemByRarity(pool, selectedRarity);
                result.item = selectedItem;
                result.rarity = selectedItem.rarity;

                // Get user's owned customizations (stored as JSON string)
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { ownedCustomizations: true }
                });

                // Parse owned items from JSON string
                let ownedItems: string[] = [];
                try {
                    if (user?.ownedCustomizations) {
                        ownedItems = JSON.parse(user.ownedCustomizations);
                    }
                } catch {
                    ownedItems = [];
                }

                if (ownedItems.includes(selectedItem.id)) {
                    // Duplicate - give Zions compensation
                    const compensation = DUPLICATE_COMPENSATION[selectedItem.rarity as ThemePackRarity] || 100;
                    await prisma.user.update({
                        where: { id: userId },
                        data: { zionsPoints: { increment: compensation } }
                    });
                    result.type = 'DUPLICATE';
                    result.compensation = compensation;
                    result.message = `Duplicata: ${selectedItem.name}! Você recebeu ${compensation} Pontos.`;
                } else {
                    // Add to owned customizations (as JSON string)
                    ownedItems.push(selectedItem.id);
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            ownedCustomizations: JSON.stringify(ownedItems)
                        }
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
