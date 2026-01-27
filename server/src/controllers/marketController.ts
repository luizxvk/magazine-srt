import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Item data for name/preview lookups
const ITEM_DATA: Record<string, { name: string; type: string; preview: string }> = {
  // Backgrounds
  bg_aurora: { name: 'Aurora Boreal', type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
  bg_galaxy: { name: 'Galáxia', type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
  bg_matrix: { name: 'Matrix', type: 'background', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
  bg_fire: { name: 'Fogo', type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
  bg_ocean: { name: 'Oceano', type: 'background', preview: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
  bg_forest: { name: 'Floresta', type: 'background', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
  bg_city: { name: 'Cidade Neon', type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
  bg_space: { name: 'Espaço Profundo', type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
  bg_sunset: { name: 'Pôr do Sol', type: 'background', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
  bg_cyberpunk: { name: 'Cyberpunk', type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
  bg_lava: { name: 'Lava', type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
  bg_ice: { name: 'Gelo Ártico', type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
  bg_neon_grid: { name: 'Grade Neon', type: 'background', preview: 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)' },
  bg_emerald: { name: 'Esmeralda', type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
  bg_royal: { name: 'Real Púrpura', type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
  bg_carbon: { name: 'Fibra de Carbono', type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
  // Badges
  badge_skull: { name: 'Caveira', type: 'badge', preview: '💀' },
  badge_fire: { name: 'Fogo', type: 'badge', preview: '🔥' },
  badge_star: { name: 'Estrela', type: 'badge', preview: '⭐' },
  badge_diamond: { name: 'Diamante', type: 'badge', preview: '💎' },
  badge_lightning: { name: 'Raio', type: 'badge', preview: '⚡' },
  badge_pony: { name: 'Unicórnio', type: 'badge', preview: '🦄' },
  badge_heart: { name: 'Coração', type: 'badge', preview: '❤️' },
  badge_moon: { name: 'Lua', type: 'badge', preview: '🌙' },
  badge_sun: { name: 'Sol', type: 'badge', preview: '☀️' },
  // Colors
  color_rgb: { name: 'RGB Dinâmico', type: 'color', preview: 'rgb-dynamic' },
  color_cyan: { name: 'Ciano Neon', type: 'color', preview: '#00ffff' },
  color_magenta: { name: 'Magenta Neon', type: 'color', preview: '#ff00ff' },
  color_lime: { name: 'Verde Limão', type: 'color', preview: '#00ff00' },
  color_orange: { name: 'Laranja Neon', type: 'color', preview: '#ff6600' },
  color_purple: { name: 'Roxo Neon', type: 'color', preview: '#9933ff' },
  color_pink: { name: 'Rosa Neon', type: 'color', preview: '#ff69b4' },
  color_blue: { name: 'Azul Elétrico', type: 'color', preview: '#0066ff' },
  color_red: { name: 'Vermelho Neon', type: 'color', preview: '#ff0033' },
  color_pastel_pink: { name: 'Rosa Pastel', type: 'color', preview: '#ffb6c1' },
  color_pastel_lavender: { name: 'Lavanda Pastel', type: 'color', preview: '#e6e6fa' },
  color_pastel_mint: { name: 'Menta Pastel', type: 'color', preview: '#98fb98' },
  color_pastel_peach: { name: 'Pêssego Pastel', type: 'color', preview: '#ffdab9' },
  color_pastel_sky: { name: 'Céu Pastel', type: 'color', preview: '#87ceeb' },
  color_pastel_coral: { name: 'Coral Pastel', type: 'color', preview: '#ffb5a7' },
  color_pastel_lilac: { name: 'Lilás Pastel', type: 'color', preview: '#dda0dd' },
  color_pastel_sage: { name: 'Sálvia Pastel', type: 'color', preview: '#9dc183' },
  color_pastel_butter: { name: 'Manteiga Pastel', type: 'color', preview: '#fffacd' },
  color_pastel_periwinkle: { name: 'Pervinca Pastel', type: 'color', preview: '#ccccff' },
};

// Default items that cannot be sold
const DEFAULT_ITEMS = ['bg_default', 'badge_crown', 'color_gold'];

// Get all active market listings
export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    const { type, minPrice, maxPrice, sortBy } = req.query;
    const userId = req.user?.userId;

    const where: any = {
      status: 'ACTIVE',
    };

    if (type && type !== 'all') {
      where.itemType = type;
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseInt(minPrice as string) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseInt(maxPrice as string) };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };

    const listings = await prisma.marketListing.findMany({
      where,
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Enrich with item data
    const packIds = listings
      .filter(l => l.itemType === 'theme_pack')
      .map(l => l.itemId);

    let packs: any[] = [];
    if (packIds.length > 0) {
      packs = await prisma.themePack.findMany({
        where: { id: { in: packIds } }
      });
    }

    const enrichedListings = listings.map((listing: any) => {
      let itemName = ITEM_DATA[listing.itemId]?.name || listing.itemId;
      let itemPreview = ITEM_DATA[listing.itemId]?.preview || '';

      if (listing.itemType === 'theme_pack') {
        const pack = packs.find(p => p.id === listing.itemId);
        if (pack) {
          itemName = pack.name;
          itemPreview = pack.backgroundUrl;
        }
      }

      return {
        ...listing,
        itemName,
        itemPreview,
        isOwnListing: userId === listing.sellerId,
      };
    });

    res.json(enrichedListings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Erro ao buscar anúncios' });
  }
};

// Get user's own listings
export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const listings = await prisma.marketListing.findMany({
      where: {
        sellerId: userId,
        status: { in: ['ACTIVE', 'SOLD'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with item data
    const packIds = listings
      .filter(l => l.itemType === 'theme_pack')
      .map(l => l.itemId);

    let packs: any[] = [];
    if (packIds.length > 0) {
      packs = await prisma.themePack.findMany({
        where: { id: { in: packIds } }
      });
    }

    const enrichedListings = listings.map((listing: any) => {
      let itemName = ITEM_DATA[listing.itemId]?.name || listing.itemId;
      let itemPreview = ITEM_DATA[listing.itemId]?.preview || '';

      if (listing.itemType === 'theme_pack') {
        const pack = packs.find(p => p.id === listing.itemId);
        if (pack) {
          itemName = pack.name;
          itemPreview = pack.backgroundUrl;
        }
      }

      return {
        ...listing,
        itemName,
        itemPreview,
      };
    });

    res.json(enrichedListings);
  } catch (error) {
    console.error('Error fetching my listings:', error);
    res.status(500).json({ error: 'Erro ao buscar seus anúncios' });
  }
};

// Create a new listing
export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId, price } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!itemId || !price) {
      return res.status(400).json({ error: 'Item e preço são obrigatórios' });
    }

    if (price < 10) {
      return res.status(400).json({ error: 'Preço mínimo é 10 Zions' });
    }

    if (price > 10000) {
      return res.status(400).json({ error: 'Preço máximo é 10.000 Zions' });
    }

    // Check if it's a default item
    if (DEFAULT_ITEMS.includes(itemId)) {
      return res.status(400).json({ error: 'Este item não pode ser vendido' });
    }

    // Check if user owns the item
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const ownedItems = JSON.parse(user.ownedCustomizations || '[]');
    let itemType = '';
    let itemName = '';
    let itemPreview = '';

    // Check ITEM_DATA first (standard items)
    if (ITEM_DATA[itemId]) {
      if (!ownedItems.includes(itemId)) {
        return res.status(403).json({ error: 'Você não possui este item' });
      }
      // Check if item is currently equipped
      if (user.equippedBackground === itemId || user.equippedBadge === itemId || user.equippedColor === itemId) {
        return res.status(400).json({ error: 'Desequipe o item antes de vendê-lo' });
      }
      itemType = ITEM_DATA[itemId].type;
      itemName = ITEM_DATA[itemId].name;
      itemPreview = ITEM_DATA[itemId].preview;

    } else {
      // Check if it's a Theme Pack
      // Note: verify strictly if it's a pack ownership
      const userPack = await prisma.userThemePack.findFirst({
        where: { userId, packId: itemId },
        include: { pack: true }
      });

      if (!userPack) {
        return res.status(403).json({ error: 'Você não possui este item ou pack inválido' });
      }

      // Check if pack content is equipped
      if (user.equippedBackground === userPack.pack.backgroundUrl ||
        user.equippedColor === userPack.pack.accentColor) {
        return res.status(400).json({ error: 'Desequipe os itens do pack antes de vendê-lo' });
      }

      itemType = 'theme_pack';
      itemName = userPack.pack.name;
      itemPreview = userPack.pack.backgroundUrl;
    }

    // Check if item is already listed
    const existingListing = await prisma.marketListing.findFirst({
      where: {
        sellerId: userId,
        itemId,
        status: 'ACTIVE',
      },
    });

    if (existingListing) {
      return res.status(400).json({ error: 'Este item já está à venda' });
    }

    const listing = await prisma.marketListing.create({
      data: {
        sellerId: userId,
        itemId,
        itemType,
        price,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      ...listing,
      itemName,
      itemPreview,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Erro ao criar anúncio' });
  }
};

// Buy an item from the market
export const buyItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    const paymentMethod = req.body?.paymentMethod || 'CASH'; // 'CASH' or 'POINTS'

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!['CASH', 'POINTS'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    // Get listing
    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Este item já foi vendido' });
    }

    if (listing.sellerId === userId) {
      return res.status(400).json({ error: 'Você não pode comprar seu próprio item' });
    }

    // Get buyer
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, zionsCash: true, zionsPoints: true, ownedCustomizations: true }
    });

    if (!buyer) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if buyer already owns the item
    const buyerOwned = JSON.parse(buyer.ownedCustomizations || '[]');
    let isThemePack = listing.itemType === 'theme_pack';

    if (isThemePack) {
      const existingPack = await prisma.userThemePack.findFirst({
        where: { userId, packId: listing.itemId }
      });
      if (existingPack) {
        return res.status(400).json({ error: 'Você já possui este pack' });
      }
    } else {
      if (buyerOwned.includes(listing.itemId)) {
        return res.status(400).json({ error: 'Você já possui este item' });
      }
    }

    // Check if buyer has enough balance
    const price = listing.price;
    const priceInPoints = paymentMethod === 'POINTS' ? price * 100 : price; // 1 Cash = 100 Points

    if (paymentMethod === 'CASH' && buyer.zionsCash < price) {
      return res.status(400).json({ error: 'Zions Cash insuficiente' });
    }

    if (paymentMethod === 'POINTS' && buyer.zionsPoints < priceInPoints) {
      return res.status(400).json({ error: 'Zions Points insuficientes' });
    }

    // Get seller
    const seller = await prisma.user.findUnique({ where: { id: listing.sellerId } });
    if (!seller) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }

    const sellerOwned = JSON.parse(seller.ownedCustomizations || '[]');

    // For theme packs, verify seller still has it
    if (isThemePack) {
      const sellerPack = await prisma.userThemePack.findFirst({
        where: { userId: listing.sellerId, packId: listing.itemId }
      });
      if (!sellerPack) {
        return res.status(400).json({ error: 'O vendedor não possui mais este pack' });
      }
    }

    // Calculate fee (5% market fee goes to admin)
    const actualPrice = paymentMethod === 'POINTS' ? priceInPoints : price;
    const fee = Math.floor(actualPrice * 0.05);
    const sellerReceives = actualPrice - fee;

    // Find admin user to receive the fee
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    // Prepare buyer update based on payment method
    const buyerUpdate: any = {
      ...(paymentMethod === 'CASH'
        ? { zionsCash: { decrement: price } }
        : { zionsPoints: { decrement: priceInPoints } }
      )
    };
    if (!isThemePack) {
      buyerUpdate.ownedCustomizations = JSON.stringify([...buyerOwned, listing.itemId]);
    }

    // Prepare seller update based on payment method
    const sellerUpdate: any = {
      ...(paymentMethod === 'CASH'
        ? { zionsCash: { increment: sellerReceives } }
        : { zionsPoints: { increment: sellerReceives } }
      )
    };
    if (!isThemePack) {
      sellerUpdate.ownedCustomizations = JSON.stringify(sellerOwned.filter((id: string) => id !== listing.itemId));
    }

    // Perform transaction
    const transactionOperations: any[] = [
      // Deduct from buyer
      prisma.user.update({
        where: { id: userId },
        data: buyerUpdate,
      }),
      // Add to seller (minus fee)
      prisma.user.update({
        where: { id: listing.sellerId },
        data: sellerUpdate,
      }),
      // Mark listing as sold
      prisma.marketListing.update({
        where: { id: listingId },
        data: { status: 'SOLD' },
      }),
      // Create transaction record
      prisma.marketTransaction.create({
        data: {
          listingId,
          buyerId: userId,
          sellerId: listing.sellerId,
          itemId: listing.itemId,
          itemType: listing.itemType,
          price: listing.price,
        },
      }),
      // Record zion history for buyer
      prisma.zionHistory.create({
        data: {
          userId,
          amount: -actualPrice,
          reason: `Compra no mercado: ${ITEM_DATA[listing.itemId]?.name || listing.itemId} (${paymentMethod === 'CASH' ? 'Cash' : 'Points'})`,
        },
      }),
      // Record zion history for seller
      prisma.zionHistory.create({
        data: {
          userId: listing.sellerId,
          amount: sellerReceives,
          reason: `Venda no mercado: ${ITEM_DATA[listing.itemId]?.name || listing.itemId} (taxa: ${fee} ${paymentMethod === 'CASH' ? 'Cash' : 'Points'})`,
        },
      }),
      // Create notification for seller
      prisma.notification.create({
        data: {
          userId: listing.sellerId,
          type: 'SYSTEM',
          content: `Seu item "${ITEM_DATA[listing.itemId]?.name || listing.itemId}" foi vendido por ${actualPrice} ${paymentMethod === 'CASH' ? 'Zions Cash' : 'Zions Points'}! Você recebeu ${sellerReceives} (taxa de 5%).`,
        },
      }),
    ];

    // Theme Pack Ownership Transfer
    if (isThemePack) {
      transactionOperations.push(
        // Remove from seller
        prisma.userThemePack.deleteMany({ // deleteMany is safer if somehow generic unique query fails, but we expect 1. Using deleteMany with where is fine.
          where: {
            userId: listing.sellerId,
            packId: listing.itemId
          }
        }),
        // Add to buyer
        prisma.userThemePack.create({
          data: {
            userId,
            packId: listing.itemId,
            price: 0 // Bought from market, so we don't track original price or tracking strictly market price? Model might require price. Let's put 0 or listing price. listing.price is in Cash/Points, db might expect original zions? Let's assume 0 or handle schema default. The schema for UserThemePack usually tracks purchase price.
          }
        })
      );
    }

    // Add admin fee if admin exists and fee > 0
    if (adminUser && fee > 0) {
      const adminFeeUpdate = paymentMethod === 'CASH'
        ? { zionsCash: { increment: fee } }
        : { zionsPoints: { increment: fee } };

      transactionOperations.push(
        // Add fee to admin
        prisma.user.update({
          where: { id: adminUser.id },
          data: adminFeeUpdate,
        }),
        // Record admin fee history
        prisma.zionHistory.create({
          data: {
            userId: adminUser.id,
            amount: fee,
            reason: `Taxa de mercado (5%): ${ITEM_DATA[listing.itemId]?.name || listing.itemId} (${paymentMethod === 'CASH' ? 'Cash' : 'Points'})`,
          },
        })
      );
    }

    await prisma.$transaction(transactionOperations);

    res.json({
      success: true,
      message: 'Item comprado com sucesso!',
      newBalance: paymentMethod === 'CASH' ? buyer.zionsCash - listing.price : buyer.zionsPoints - (paymentMethod === 'POINTS' ? listing.price * 100 : listing.price),
      itemId: listing.itemId,
    });
  } catch (error) {
    console.error('Error buying item:', error);
    res.status(500).json({ error: 'Erro ao comprar item' });
  }
};

// Cancel a listing
export const cancelListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    if (listing.sellerId !== userId) {
      return res.status(403).json({ error: 'Você não pode cancelar este anúncio' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Este anúncio não pode ser cancelado' });
    }

    await prisma.marketListing.update({
      where: { id: listingId },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, message: 'Anúncio cancelado' });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    res.status(500).json({ error: 'Erro ao cancelar anúncio' });
  }
};

// Get transaction history
export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const transactions = await prisma.marketTransaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const enrichedTransactions = transactions.map((tx: any) => ({
      ...tx,
      itemName: ITEM_DATA[tx.itemId]?.name || tx.itemId,
      itemPreview: ITEM_DATA[tx.itemId]?.preview || '',
      type: tx.buyerId === userId ? 'purchase' : 'sale',
    }));

    res.json(enrichedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

// Get market stats
export const getMarketStats = async (req: AuthRequest, res: Response) => {
  try {
    const [activeListings, totalSold, recentSales] = await Promise.all([
      prisma.marketListing.count({ where: { status: 'ACTIVE' } }),
      prisma.marketTransaction.count(),
      prisma.marketTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          buyer: {
            select: { name: true, displayName: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const totalVolume = await prisma.marketTransaction.aggregate({
      _sum: { price: true },
    });

    res.json({
      activeListings,
      totalSold,
      totalVolume: totalVolume._sum.price || 0,
      recentSales: recentSales.map((sale: any) => ({
        ...sale,
        itemName: ITEM_DATA[sale.itemId]?.name || sale.itemId,
        itemPreview: ITEM_DATA[sale.itemId]?.preview || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
