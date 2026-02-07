import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Item data for name/preview lookups
const ITEM_DATA: Record<string, { name: string; type: string; preview: string }> = {
  // Backgrounds
  bg_aurora: { name: 'Aurora Boreal', type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
  bg_galaxy: { name: 'Galáxia', type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
  bg_retrowave: { name: 'Retrowave', type: 'background', preview: 'linear-gradient(180deg, #1a0028 0%, #2d004a 30%, #ff006e 60%, #ff6b35 100%)' },
  bg_fire: { name: 'Fogo', type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
  bg_oceano: { name: 'Oceano', type: 'background', preview: 'linear-gradient(180deg, #0a0a1a 0%, #1a2a4a 40%, #2a4a6a 70%, #1a3a5a 100%)' },
  bg_forest: { name: 'Floresta', type: 'background', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
  bg_city: { name: 'Cidade Neon', type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
  bg_space: { name: 'Espaço Profundo', type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
  bg_sunset: { name: 'Pôr do Sol', type: 'background', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
  bg_cyberpunk: { name: 'Cyberpunk', type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
  bg_lava: { name: 'Lava', type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
  bg_ice: { name: 'Gelo Ártico', type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
  bg_chuva_neon: { name: 'Chuva Neon', type: 'background', preview: 'linear-gradient(180deg, #0d0015 0%, #1a0030 40%, #00ff88 50%, #0d0015 100%)' },
  bg_emerald: { name: 'Esmeralda', type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
  bg_royal: { name: 'Real Púrpura', type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
  bg_carbon: { name: 'Fibra de Carbono', type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
  // Animated premium backgrounds
  'anim-cosmic-triangles': { name: 'Triângulos Cósmicos', type: 'background', preview: 'radial-gradient(circle at center, #111 0%, #000 60%)' },
  'anim-gradient-waves': { name: 'Ondas Gradiente', type: 'background', preview: 'linear-gradient(315deg, rgba(101,0,94,1) 3%, rgba(60,132,206,1) 38%, rgba(48,238,226,1) 68%, rgba(255,25,25,1) 98%)' },
  'anim-rainbow-skies': { name: 'Rainbow Skies', type: 'background', preview: 'linear-gradient(315deg, rgba(232,121,249,1) 10%, rgba(96,165,250,1) 50%, rgba(94,234,212,1) 90%)' },
  'anim-infinite-triangles': { name: 'Infinite Triangles', type: 'background', preview: 'linear-gradient(135deg, #d4af37 0%, #000 100%)' },
  'anim-moonlit-sky': { name: 'Moonlit Sky', type: 'background', preview: 'linear-gradient(180deg, #000011 0%, #0a0a2e 50%, #1a1a4a 100%)' },
  // Badges - using icons8 URLs
  badge_skull: { name: 'Caveira', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000' },
  badge_fire: { name: 'Fogo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000' },
  badge_star: { name: 'Estrela', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
  badge_diamond: { name: 'Diamante', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000' },
  badge_lightning: { name: 'Raio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
  badge_pony: { name: 'Unicórnio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000' },
  badge_heart: { name: 'Coração', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000' },
  badge_moon: { name: 'Lua', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000' },
  badge_sun: { name: 'Sol', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000' },
  badge_seal: { name: 'Foca', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000' },
  badge_shark: { name: 'Grande Norke', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000' },
  badge_egghead: { name: 'Cabeça de Ovo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000' },
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
    const { type, minPrice, maxPrice, sortBy, eliteOnly: eliteOnlyFilter } = req.query;
    const userId = req.user?.userId;

    // Check if user is Elite for filtering Elite-only listings
    let userIsElite = false;
    if (userId) {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { isElite: true, eliteUntil: true }
      });
      userIsElite = !!(user?.isElite && user?.eliteUntil && user.eliteUntil > new Date());
    }

    const where: any = {
      status: 'ACTIVE',
    };

    // Filter by Elite-only (if not Elite, exclude Elite-only listings)
    if (!userIsElite) {
      where.eliteOnly = false;
    } else if (eliteOnlyFilter === 'true') {
      where.eliteOnly = true;
    }

    if (type && type !== 'all') {
      where.itemType = type;
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseInt(minPrice as string) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseInt(maxPrice as string) };
    }

    // Updated orderBy: Featured listings first, then by selected sort
    let orderBy: any[] = [{ isFeatured: 'desc' }];
    if (sortBy === 'price_asc') orderBy.push({ price: 'asc' });
    else if (sortBy === 'price_desc') orderBy.push({ price: 'desc' });
    else if (sortBy === 'oldest') orderBy.push({ createdAt: 'asc' });
    else orderBy.push({ createdAt: 'desc' }); // newest is default

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
            isTrustedSeller: true,
            marketSalesCount: true,
          },
        },
      },
    });

    // Get user's favorites to mark isFavorited
    let userFavorites: string[] = [];
    if (userId) {
      const favorites = await prisma.marketFavorite.findMany({
        where: { userId },
        select: { listingId: true }
      });
      userFavorites = favorites.map(f => f.listingId);
    }

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

    const now = new Date();
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

      // Check if featured is still active
      const isStillFeatured = listing.isFeatured && listing.featuredUntil && listing.featuredUntil > now;

      return {
        ...listing,
        itemName,
        itemPreview,
        isOwnListing: userId === listing.sellerId,
        isFavorited: userFavorites.includes(listing.id),
        isFeatured: isStillFeatured, // Only true if not expired
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
    let minPrice = 10; // Preço mínimo padrão

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

      // Calcular preço mínimo para theme packs (80% do preço original)
      minPrice = Math.floor(userPack.pack.price * 0.8);

      itemType = 'theme_pack';
      itemName = userPack.pack.name;
      itemPreview = userPack.pack.backgroundUrl;
    }

    // Validar preço mínimo
    if (price < minPrice) {
      return res.status(400).json({ error: `Preço mínimo para este item é ${minPrice} Zions` });
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
    const seller = await prisma.user.findUnique({ 
      where: { id: listing.sellerId },
      select: { 
        id: true, 
        ownedCustomizations: true,
        marketSalesCount: true,
        isTrustedSeller: true
      }
    });
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
      ),
      marketSalesCount: { increment: 1 }
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
          currency: paymentMethod as 'CASH' | 'POINTS',
        },
      }),
      // Record zion history for seller
      prisma.zionHistory.create({
        data: {
          userId: listing.sellerId,
          amount: sellerReceives,
          reason: `Venda no mercado: ${ITEM_DATA[listing.itemId]?.name || listing.itemId} (taxa: ${fee} ${paymentMethod === 'CASH' ? 'Cash' : 'Points'})`,
          currency: paymentMethod as 'CASH' | 'POINTS',
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
            currency: paymentMethod as 'CASH' | 'POINTS',
          },
        })
      );
    }

    // Check if seller should become trusted seller (10+ sales)
    const newSalesCount = (seller.marketSalesCount || 0) + 1;
    if (newSalesCount >= 10 && !seller.isTrustedSeller) {
      transactionOperations.push(
        prisma.user.update({
          where: { id: listing.sellerId },
          data: { isTrustedSeller: true }
        }),
        prisma.notification.create({
          data: {
            userId: listing.sellerId,
            type: 'SYSTEM',
            content: '🏆 Parabéns! Você agora é um Vendedor Confiável no Mercado!'
          }
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

// ========== MARKET 6.0 FEATURES ==========

// Get user's favorited listings
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const favorites = await prisma.marketFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            seller: {
              select: { id: true, name: true, displayName: true, avatarUrl: true, isTrustedSeller: true }
            }
          }
        }
      }
    });

    // Enrich with item data
    const enriched = favorites.map((fav: any) => {
      const listing = fav.listing;
      return {
        ...fav,
        listing: {
          ...listing,
          itemName: ITEM_DATA[listing.itemId]?.name || listing.itemId,
          itemPreview: ITEM_DATA[listing.itemId]?.preview || '',
        }
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
};

// Add listing to favorites
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    // Check if listing exists and is active
    const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    // Check if it's own listing
    if (listing.sellerId === userId) {
      return res.status(400).json({ error: 'Você não pode favoritar seu próprio anúncio' });
    }

    // Check if already favorited
    const existing = await prisma.marketFavorite.findUnique({
      where: { userId_listingId: { userId, listingId } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Já está nos favoritos' });
    }

    await prisma.marketFavorite.create({
      data: { userId, listingId }
    });

    res.json({ success: true, message: 'Adicionado aos favoritos' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
};

// Remove listing from favorites
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    await prisma.marketFavorite.deleteMany({
      where: { userId, listingId }
    });

    res.json({ success: true, message: 'Removido dos favoritos' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
};

// Get offers received on user's listings
export const getOffersReceived = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const offers = await prisma.marketOffer.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: { id: true, name: true, displayName: true, avatarUrl: true }
        },
        listing: {
          select: { id: true, itemId: true, itemType: true, price: true, status: true }
        }
      }
    });

    const enriched = offers.map((offer: any) => ({
      ...offer,
      listing: {
        ...offer.listing,
        itemName: ITEM_DATA[offer.listing.itemId]?.name || offer.listing.itemId,
        itemPreview: ITEM_DATA[offer.listing.itemId]?.preview || '',
      }
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching received offers:', error);
    res.status(500).json({ error: 'Erro ao buscar ofertas' });
  }
};

// Get offers user has sent
export const getOffersSent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const offers = await prisma.marketOffer.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, name: true, displayName: true, avatarUrl: true }
        },
        listing: {
          select: { id: true, itemId: true, itemType: true, price: true, status: true }
        }
      }
    });

    const enriched = offers.map((offer: any) => ({
      ...offer,
      listing: {
        ...offer.listing,
        itemName: ITEM_DATA[offer.listing.itemId]?.name || offer.listing.itemId,
        itemPreview: ITEM_DATA[offer.listing.itemId]?.preview || '',
      }
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching sent offers:', error);
    res.status(500).json({ error: 'Erro ao buscar ofertas enviadas' });
  }
};

// Make an offer on a listing
export const makeOffer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    const { amount, message } = req.body;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valor da oferta inválido' });
    }

    // Check listing
    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true, name: true } } }
    });

    if (!listing || listing.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    if (listing.sellerId === userId) {
      return res.status(400).json({ error: 'Você não pode fazer oferta no seu próprio item' });
    }

    // Check if user has enough zions
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { zionsPoints: true }
    });
    if (!user || user.zionsPoints < amount) {
      return res.status(400).json({ error: 'Zions Points insuficientes' });
    }

    // Check if user already has pending offer on this listing
    const existingOffer = await prisma.marketOffer.findFirst({
      where: { listingId, buyerId: userId, status: 'PENDING' }
    });
    if (existingOffer) {
      return res.status(400).json({ error: 'Você já tem uma oferta pendente neste item' });
    }

    // Create offer
    const offer = await prisma.marketOffer.create({
      data: {
        listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        amount,
        message: message?.slice(0, 200) || null
      }
    });

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        type: 'SYSTEM',
        content: `Nova oferta de ${amount} Zions no seu item "${ITEM_DATA[listing.itemId]?.name || listing.itemId}"`
      }
    });

    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error('Error making offer:', error);
    res.status(500).json({ error: 'Erro ao fazer oferta' });
  }
};

// Accept an offer
export const acceptOffer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { offerId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const offer = await prisma.marketOffer.findUnique({
      where: { id: offerId },
      include: { 
        listing: true,
        buyer: { select: { id: true, zionsPoints: true, ownedCustomizations: true } }
      }
    });

    if (!offer) return res.status(404).json({ error: 'Oferta não encontrada' });
    if (offer.sellerId !== userId) return res.status(403).json({ error: 'Não autorizado' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Oferta não está pendente' });
    if (offer.listing.status !== 'ACTIVE') return res.status(400).json({ error: 'Anúncio não está ativo' });

    // Verify buyer still has funds
    if (offer.buyer.zionsPoints < offer.amount) {
      await prisma.marketOffer.update({
        where: { id: offerId },
        data: { status: 'CANCELLED' }
      });
      return res.status(400).json({ error: 'Comprador não tem Zions suficientes' });
    }

    // Get seller
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: { ownedCustomizations: true, marketSalesCount: true }
    });
    if (!seller) return res.status(404).json({ error: 'Vendedor não encontrado' });

    const sellerOwned = JSON.parse(seller.ownedCustomizations || '[]');
    const buyerOwned = JSON.parse(offer.buyer.ownedCustomizations || '[]');
    const isThemePack = offer.listing.itemType === 'theme_pack';

    // Calculate fee (5%)
    const fee = Math.floor(offer.amount * 0.05);
    const sellerReceives = offer.amount - fee;

    const operations: any[] = [
      // Update offer status
      prisma.marketOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED', respondedAt: new Date() }
      }),
      // Mark listing as sold
      prisma.marketListing.update({
        where: { id: offer.listingId },
        data: { status: 'SOLD' }
      }),
      // Deduct from buyer
      prisma.user.update({
        where: { id: offer.buyerId },
        data: {
          zionsPoints: { decrement: offer.amount },
          ...(isThemePack ? {} : { ownedCustomizations: JSON.stringify([...buyerOwned, offer.listing.itemId]) })
        }
      }),
      // Add to seller + increment sales count
      prisma.user.update({
        where: { id: userId },
        data: {
          zionsPoints: { increment: sellerReceives },
          marketSalesCount: { increment: 1 },
          ...(isThemePack ? {} : { ownedCustomizations: JSON.stringify(sellerOwned.filter((id: string) => id !== offer.listing.itemId)) })
        }
      }),
      // Create transaction record
      prisma.marketTransaction.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: userId,
          itemId: offer.listing.itemId,
          itemType: offer.listing.itemType,
          price: offer.amount
        }
      }),
      // Notify buyer
      prisma.notification.create({
        data: {
          userId: offer.buyerId,
          type: 'SYSTEM',
          content: `Sua oferta de ${offer.amount} Zions foi aceita! Você adquiriu "${ITEM_DATA[offer.listing.itemId]?.name || offer.listing.itemId}"`
        }
      }),
      // Reject all other pending offers on this listing
      prisma.marketOffer.updateMany({
        where: { listingId: offer.listingId, status: 'PENDING', id: { not: offerId } },
        data: { status: 'REJECTED', respondedAt: new Date() }
      })
    ];

    // Handle theme pack transfer
    if (isThemePack) {
      operations.push(
        prisma.userThemePack.deleteMany({
          where: { userId, packId: offer.listing.itemId }
        }),
        prisma.userThemePack.create({
          data: { userId: offer.buyerId, packId: offer.listing.itemId, price: 0 }
        })
      );
    }

    // Check if seller should become trusted (10+ sales)
    const newSalesCount = (seller.marketSalesCount || 0) + 1;
    if (newSalesCount >= 10) {
      operations.push(
        prisma.user.update({
          where: { id: userId },
          data: { isTrustedSeller: true }
        })
      );
    }

    await prisma.$transaction(operations);

    res.json({ success: true, message: 'Oferta aceita! Venda realizada.' });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: 'Erro ao aceitar oferta' });
  }
};

// Reject an offer
export const rejectOffer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { offerId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const offer = await prisma.marketOffer.findUnique({ where: { id: offerId } });
    if (!offer) return res.status(404).json({ error: 'Oferta não encontrada' });
    if (offer.sellerId !== userId) return res.status(403).json({ error: 'Não autorizado' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Oferta não está pendente' });

    await prisma.marketOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED', respondedAt: new Date() }
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: 'SYSTEM',
        content: `Sua oferta de ${offer.amount} Zions foi recusada.`
      }
    });

    res.json({ success: true, message: 'Oferta recusada' });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ error: 'Erro ao recusar oferta' });
  }
};

// Cancel own offer
export const cancelOffer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { offerId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const offer = await prisma.marketOffer.findUnique({ where: { id: offerId } });
    if (!offer) return res.status(404).json({ error: 'Oferta não encontrada' });
    if (offer.buyerId !== userId) return res.status(403).json({ error: 'Não autorizado' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Oferta não está pendente' });

    await prisma.marketOffer.update({
      where: { id: offerId },
      data: { status: 'CANCELLED' }
    });

    res.json({ success: true, message: 'Oferta cancelada' });
  } catch (error) {
    console.error('Error cancelling offer:', error);
    res.status(500).json({ error: 'Erro ao cancelar oferta' });
  }
};

// Feature a listing (costs 50 Zions Points for 24h)
const FEATURE_COST = 50;
const FEATURE_DURATION_HOURS = 24;

export const featureListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });
    if (listing.sellerId !== userId) return res.status(403).json({ error: 'Não autorizado' });
    if (listing.status !== 'ACTIVE') return res.status(400).json({ error: 'Anúncio não está ativo' });

    // Check if already featured
    if (listing.isFeatured && listing.featuredUntil && listing.featuredUntil > new Date()) {
      return res.status(400).json({ error: 'Anúncio já está em destaque' });
    }

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { zionsPoints: true } });
    if (!user || user.zionsPoints < FEATURE_COST) {
      return res.status(400).json({ error: `Precisa de ${FEATURE_COST} Zions Points para destacar` });
    }

    const featuredUntil = new Date(Date.now() + FEATURE_DURATION_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { zionsPoints: { decrement: FEATURE_COST } }
      }),
      prisma.marketListing.update({
        where: { id: listingId },
        data: { isFeatured: true, featuredUntil }
      }),
      prisma.zionHistory.create({
        data: {
          userId,
          amount: -FEATURE_COST,
          reason: 'Destaque de anúncio no mercado (24h)',
          currency: 'POINTS'
        }
      })
    ]);

    res.json({ success: true, message: 'Anúncio destacado por 24 horas!', featuredUntil });
  } catch (error) {
    console.error('Error featuring listing:', error);
    res.status(500).json({ error: 'Erro ao destacar anúncio' });
  }
};

// Toggle Elite-only on a listing
export const toggleEliteOnly = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });
    if (listing.sellerId !== userId) return res.status(403).json({ error: 'Não autorizado' });
    if (listing.status !== 'ACTIVE') return res.status(400).json({ error: 'Anúncio não está ativo' });

    // Check if seller is Elite (only Elite can make Elite-only listings)
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { isElite: true, eliteUntil: true }
    });
    const isElite = user?.isElite && user?.eliteUntil && user.eliteUntil > new Date();
    if (!isElite) {
      return res.status(403).json({ error: 'Apenas membros Elite podem criar anúncios exclusivos' });
    }

    const newEliteOnly = !listing.eliteOnly;

    await prisma.marketListing.update({
      where: { id: listingId },
      data: { eliteOnly: newEliteOnly }
    });

    res.json({ 
      success: true, 
      eliteOnly: newEliteOnly,
      message: newEliteOnly ? 'Anúncio agora é exclusivo para Elite' : 'Anúncio aberto para todos'
    });
  } catch (error) {
    console.error('Error toggling elite only:', error);
    res.status(500).json({ error: 'Erro ao alterar exclusividade' });
  }
};
