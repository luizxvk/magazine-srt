import prisma from '../utils/prisma';
import { ChallengeStatus, ChallengeMetric, Prisma } from '@prisma/client';

const CHALLENGE_FEE_PERCENT = 5; // Taxa da casa (5%)
const MIN_BET_AMOUNT = 100; // Aposta mínima
const MAX_BET_AMOUNT = 10000; // Aposta máxima
const CHALLENGE_EXPIRE_HOURS = 24; // Horas para aceitar o desafio

// =============================================
// HELPER: Get metric value from stats
// =============================================
const getMetricValue = (stats: any, metric: ChallengeMetric): number => {
  if (!stats) return 0;
  
  switch (metric) {
    case 'KILLS':
      return stats.totalKills || 0;
    case 'WINS':
      return stats.totalWins || 0;
    case 'KD':
      return stats.kd || 0;
    case 'WIN_RATE':
      return stats.winRate || 0;
    case 'SCORE':
      return stats.score || 0;
    case 'HOURS':
      return stats.hoursPlayed || 0;
    default:
      return 0;
  }
};

// =============================================
// CREATE CHALLENGE
// =============================================
export const createChallenge = async (
  challengerId: string,
  opponentId: string,
  gameProfileId: string,
  metric: ChallengeMetric,
  betAmount: number,
  duration: number = 3
) => {
  // Validate bet amount
  if (betAmount < MIN_BET_AMOUNT) {
    throw new Error(`Aposta mínima é ${MIN_BET_AMOUNT} Zions`);
  }
  if (betAmount > MAX_BET_AMOUNT) {
    throw new Error(`Aposta máxima é ${MAX_BET_AMOUNT} Zions`);
  }

  // Check if challenger has enough Zions
  const challenger = await prisma.user.findUnique({
    where: { id: challengerId },
    select: { zionsPoints: true }
  });

  if (!challenger || challenger.zionsPoints < betAmount) {
    throw new Error('Zions insuficientes para criar o desafio');
  }

  // Check if can't challenge self
  if (challengerId === opponentId) {
    throw new Error('Você não pode desafiar a si mesmo');
  }

  // Get game profile to extract game info
  const gameProfile = await prisma.gameProfile.findUnique({
    where: { id: gameProfileId },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!gameProfile) {
    throw new Error('Perfil de jogo não encontrado');
  }

  if (gameProfile.userId !== challengerId) {
    throw new Error('Este perfil não pertence a você');
  }

  // Check if opponent has a profile for this game
  const opponentProfile = await prisma.gameProfile.findFirst({
    where: {
      userId: opponentId,
      game: gameProfile.game
    }
  });

  if (!opponentProfile) {
    throw new Error('Oponente não possui perfil neste jogo');
  }

  // Check for existing pending/active challenges between these users
  const existingChallenge = await prisma.challenge.findFirst({
    where: {
      OR: [
        { challengerId, opponentId },
        { challengerId: opponentId, opponentId: challengerId }
      ],
      status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] }
    }
  });

  if (existingChallenge) {
    throw new Error('Já existe um desafio ativo entre vocês');
  }

  // Deduct Zions from challenger (held until challenge resolves)
  await prisma.user.update({
    where: { id: challengerId },
    data: { zionsPoints: { decrement: betAmount } }
  });

  // Log the transaction
  await prisma.zionHistory.create({
    data: {
      userId: challengerId,
      amount: -betAmount,
      reason: `Desafio 1v1 criado (aguardando)`,
      currency: 'POINTS'
    }
  });

  // Get current stats snapshot
  const currentStats = gameProfile.snapshots[0] || null;

  // Create the challenge
  const challenge = await prisma.challenge.create({
    data: {
      challengerId,
      opponentId,
      gameProfileId,
      opponentProfileId: opponentProfile.id,
      game: gameProfile.game,
      metric,
      betAmount,
      duration,
      status: 'PENDING',
      challengerStartStats: currentStats ? {
        totalKills: currentStats.totalKills,
        totalWins: currentStats.totalWins,
        kd: currentStats.kd,
        winRate: currentStats.winRate,
        score: currentStats.score,
        hoursPlayed: currentStats.hoursPlayed
      } : Prisma.JsonNull,
      expiresAt: new Date(Date.now() + CHALLENGE_EXPIRE_HOURS * 60 * 60 * 1000)
    },
    include: {
      challenger: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      opponent: { select: { id: true, name: true, displayName: true, avatarUrl: true } }
    }
  });

  // Notify opponent
  await prisma.notification.create({
    data: {
      userId: opponentId,
      type: 'CHALLENGE',
      content: `${challenger.zionsPoints > 0 ? 'Você' : ''} recebeu um desafio 1v1 de ${betAmount} Zions no ${gameProfile.game}!`
    }
  });

  return challenge;
};

// =============================================
// ACCEPT CHALLENGE
// =============================================
export const acceptChallenge = async (challengeId: string, opponentId: string) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      challenger: { select: { id: true, name: true, displayName: true } }
    }
  });

  if (!challenge) {
    throw new Error('Desafio não encontrado');
  }

  if (challenge.opponentId !== opponentId) {
    throw new Error('Você não é o oponente deste desafio');
  }

  if (challenge.status !== 'PENDING') {
    throw new Error('Este desafio não está pendente');
  }

  if (challenge.expiresAt && new Date() > challenge.expiresAt) {
    // Refund challenger and mark as expired
    await prisma.user.update({
      where: { id: challenge.challengerId },
      data: { zionsPoints: { increment: challenge.betAmount } }
    });
    await prisma.zionHistory.create({
      data: {
        userId: challenge.challengerId,
        amount: challenge.betAmount,
        reason: 'Desafio 1v1 expirou - reembolso',
        currency: 'POINTS'
      }
    });
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'EXPIRED' }
    });
    throw new Error('Este desafio expirou');
  }

  // Check opponent has enough Zions
  const opponent = await prisma.user.findUnique({
    where: { id: opponentId },
    select: { zionsPoints: true }
  });

  if (!opponent || opponent.zionsPoints < challenge.betAmount) {
    throw new Error('Zions insuficientes para aceitar o desafio');
  }

  // Get opponent's game profile and stats
  const opponentProfile = await prisma.gameProfile.findFirst({
    where: {
      userId: opponentId,
      game: challenge.game
    },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!opponentProfile) {
    throw new Error('Você não possui perfil neste jogo');
  }

  const opponentStats = opponentProfile.snapshots[0] || null;

  // Deduct Zions from opponent
  await prisma.user.update({
    where: { id: opponentId },
    data: { zionsPoints: { decrement: challenge.betAmount } }
  });

  await prisma.zionHistory.create({
    data: {
      userId: opponentId,
      amount: -challenge.betAmount,
      reason: `Desafio 1v1 aceito`,
      currency: 'POINTS'
    }
  });

  // Calculate end date
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + challenge.duration * 24 * 60 * 60 * 1000);

  // Update challenge
  const updatedChallenge = await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      status: 'IN_PROGRESS',
      opponentProfileId: opponentProfile.id,
      opponentStartStats: opponentStats ? {
        totalKills: opponentStats.totalKills,
        totalWins: opponentStats.totalWins,
        kd: opponentStats.kd,
        winRate: opponentStats.winRate,
        score: opponentStats.score,
        hoursPlayed: opponentStats.hoursPlayed
      } : Prisma.JsonNull,
      startsAt,
      endsAt
    },
    include: {
      challenger: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      opponent: { select: { id: true, name: true, displayName: true, avatarUrl: true } }
    }
  });

  // Notify challenger
  await prisma.notification.create({
    data: {
      userId: challenge.challengerId,
      type: 'CHALLENGE',
      content: `Seu desafio 1v1 foi aceito! O duelo começou!`
    }
  });

  return updatedChallenge;
};

// =============================================
// DECLINE CHALLENGE
// =============================================
export const declineChallenge = async (challengeId: string, opponentId: string) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId }
  });

  if (!challenge) {
    throw new Error('Desafio não encontrado');
  }

  if (challenge.opponentId !== opponentId) {
    throw new Error('Você não é o oponente deste desafio');
  }

  if (challenge.status !== 'PENDING') {
    throw new Error('Este desafio não está pendente');
  }

  // Refund challenger
  await prisma.user.update({
    where: { id: challenge.challengerId },
    data: { zionsPoints: { increment: challenge.betAmount } }
  });

  await prisma.zionHistory.create({
    data: {
      userId: challenge.challengerId,
      amount: challenge.betAmount,
      reason: 'Desafio 1v1 recusado - reembolso',
      currency: 'POINTS'
    }
  });

  // Update challenge status
  const updatedChallenge = await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'DECLINED' }
  });

  // Notify challenger
  await prisma.notification.create({
    data: {
      userId: challenge.challengerId,
      type: 'CHALLENGE',
      content: `Seu desafio 1v1 foi recusado.`
    }
  });

  return updatedChallenge;
};

// =============================================
// CANCEL CHALLENGE (by challenger, only if pending)
// =============================================
export const cancelChallenge = async (challengeId: string, challengerId: string) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId }
  });

  if (!challenge) {
    throw new Error('Desafio não encontrado');
  }

  if (challenge.challengerId !== challengerId) {
    throw new Error('Apenas quem criou pode cancelar');
  }

  if (challenge.status !== 'PENDING') {
    throw new Error('Só é possível cancelar desafios pendentes');
  }

  // Refund challenger
  await prisma.user.update({
    where: { id: challengerId },
    data: { zionsPoints: { increment: challenge.betAmount } }
  });

  await prisma.zionHistory.create({
    data: {
      userId: challengerId,
      amount: challenge.betAmount,
      reason: 'Desafio 1v1 cancelado - reembolso',
      currency: 'POINTS'
    }
  });

  // Update challenge status
  return prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'CANCELLED' }
  });
};

// =============================================
// COMPLETE CHALLENGE (called by cron job or manually)
// =============================================
export const completeChallenge = async (challengeId: string) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId }
  });

  if (!challenge) {
    throw new Error('Desafio não encontrado');
  }

  if (challenge.status !== 'IN_PROGRESS') {
    throw new Error('Este desafio não está em andamento');
  }

  // Get current stats for both players
  const challengerProfile = await prisma.gameProfile.findUnique({
    where: { id: challenge.gameProfileId },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const opponentProfile = await prisma.gameProfile.findUnique({
    where: { id: challenge.opponentProfileId! },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const challengerEndStats = challengerProfile?.snapshots[0] || null;
  const opponentEndStats = opponentProfile?.snapshots[0] || null;

  // Calculate deltas based on metric
  const challengerStartValue = getMetricValue(challenge.challengerStartStats, challenge.metric);
  const opponentStartValue = getMetricValue(challenge.opponentStartStats, challenge.metric);
  const challengerEndValue = getMetricValue(challengerEndStats, challenge.metric);
  const opponentEndValue = getMetricValue(opponentEndStats, challenge.metric);

  const challengerDelta = challengerEndValue - challengerStartValue;
  const opponentDelta = opponentEndValue - opponentStartValue;

  // Determine winner
  let winnerId: string | null = null;
  if (challengerDelta > opponentDelta) {
    winnerId = challenge.challengerId;
  } else if (opponentDelta > challengerDelta) {
    winnerId = challenge.opponentId;
  }
  // If equal, it's a draw - both get refunded

  // Calculate prize
  const totalPool = challenge.betAmount * 2;
  const fee = Math.floor(totalPool * (CHALLENGE_FEE_PERCENT / 100));
  const prize = totalPool - fee;

  if (winnerId) {
    // Winner takes prize
    await prisma.user.update({
      where: { id: winnerId },
      data: { zionsPoints: { increment: prize } }
    });

    await prisma.zionHistory.create({
      data: {
        userId: winnerId,
        amount: prize,
        reason: `Vitória no desafio 1v1! (+${challengerDelta > opponentDelta ? challengerDelta : opponentDelta} ${challenge.metric})`,
        currency: 'POINTS'
      }
    });

    // Notify both players
    const loserId = winnerId === challenge.challengerId ? challenge.opponentId : challenge.challengerId;
    
    await prisma.notification.create({
      data: {
        userId: winnerId,
        type: 'CHALLENGE',
        content: `Você venceu o desafio 1v1! Ganhou ${prize} Zions! 🏆`
      }
    });

    await prisma.notification.create({
      data: {
        userId: loserId,
        type: 'CHALLENGE',
        content: `Você perdeu o desafio 1v1. Melhor sorte na próxima!`
      }
    });
  } else {
    // Draw - refund both minus minimal fee
    const refund = challenge.betAmount - Math.floor(fee / 2);
    
    await prisma.user.update({
      where: { id: challenge.challengerId },
      data: { zionsPoints: { increment: refund } }
    });
    await prisma.user.update({
      where: { id: challenge.opponentId },
      data: { zionsPoints: { increment: refund } }
    });

    await prisma.zionHistory.create({
      data: {
        userId: challenge.challengerId,
        amount: refund,
        reason: 'Desafio 1v1 empatado - reembolso parcial',
        currency: 'POINTS'
      }
    });
    await prisma.zionHistory.create({
      data: {
        userId: challenge.opponentId,
        amount: refund,
        reason: 'Desafio 1v1 empatado - reembolso parcial',
        currency: 'POINTS'
      }
    });

    await prisma.notification.create({
      data: {
        userId: challenge.challengerId,
        type: 'CHALLENGE',
        content: `O desafio 1v1 terminou empatado! Você recebeu ${refund} Zions de volta.`
      }
    });
    await prisma.notification.create({
      data: {
        userId: challenge.opponentId,
        type: 'CHALLENGE',
        content: `O desafio 1v1 terminou empatado! Você recebeu ${refund} Zions de volta.`
      }
    });
  }

  // Update challenge
  return prisma.challenge.update({
    where: { id: challengeId },
    data: {
      status: 'COMPLETED',
      winnerId,
      challengerEndStats: challengerEndStats ? {
        totalKills: challengerEndStats.totalKills,
        totalWins: challengerEndStats.totalWins,
        kd: challengerEndStats.kd,
        winRate: challengerEndStats.winRate,
        score: challengerEndStats.score,
        hoursPlayed: challengerEndStats.hoursPlayed
      } : Prisma.JsonNull,
      opponentEndStats: opponentEndStats ? {
        totalKills: opponentEndStats.totalKills,
        totalWins: opponentEndStats.totalWins,
        kd: opponentEndStats.kd,
        winRate: opponentEndStats.winRate,
        score: opponentEndStats.score,
        hoursPlayed: opponentEndStats.hoursPlayed
      } : Prisma.JsonNull,
      challengerDelta,
      opponentDelta,
      completedAt: new Date()
    },
    include: {
      challenger: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      opponent: { select: { id: true, name: true, displayName: true, avatarUrl: true } }
    }
  });
};

// =============================================
// GET USER CHALLENGES
// =============================================
export const getUserChallenges = async (userId: string, status?: ChallengeStatus) => {
  const where: any = {
    OR: [
      { challengerId: userId },
      { opponentId: userId }
    ]
  };

  if (status) {
    where.status = status;
  }

  return prisma.challenge.findMany({
    where,
    include: {
      challenger: { 
        select: { id: true, name: true, displayName: true, avatarUrl: true } 
      },
      opponent: { 
        select: { id: true, name: true, displayName: true, avatarUrl: true } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// =============================================
// GET CHALLENGE BY ID
// =============================================
export const getChallengeById = async (challengeId: string) => {
  return prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      challenger: { 
        select: { id: true, name: true, displayName: true, avatarUrl: true, gameProfiles: true } 
      },
      opponent: { 
        select: { id: true, name: true, displayName: true, avatarUrl: true, gameProfiles: true } 
      }
    }
  });
};

// =============================================
// GET CHALLENGE LEADERBOARD
// =============================================
export const getChallengeLeaderboard = async (limit: number = 10) => {
  // Get users with most challenge wins
  const completedChallenges = await prisma.challenge.findMany({
    where: { status: 'COMPLETED', winnerId: { not: null } },
    select: { winnerId: true }
  });

  // Count wins per user
  const winCounts: Record<string, number> = {};
  completedChallenges.forEach(c => {
    if (c.winnerId) {
      winCounts[c.winnerId] = (winCounts[c.winnerId] || 0) + 1;
    }
  });

  // Sort and get top users
  const topUserIds = Object.entries(winCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => userId);

  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, displayName: true, avatarUrl: true }
  });

  return topUserIds.map(userId => ({
    user: users.find(u => u.id === userId),
    wins: winCounts[userId]
  }));
};

// =============================================
// CHECK AND COMPLETE EXPIRED CHALLENGES (cron job)
// =============================================
export const processExpiredChallenges = async () => {
  const now = new Date();

  // Find challenges that should be completed
  const expiredChallenges = await prisma.challenge.findMany({
    where: {
      status: 'IN_PROGRESS',
      endsAt: { lte: now }
    }
  });

  for (const challenge of expiredChallenges) {
    try {
      await completeChallenge(challenge.id);
      console.log(`Challenge ${challenge.id} completed automatically`);
    } catch (error) {
      console.error(`Error completing challenge ${challenge.id}:`, error);
    }
  }

  // Find pending challenges that expired without acceptance
  const expiredPending = await prisma.challenge.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now }
    }
  });

  for (const challenge of expiredPending) {
    // Refund challenger
    await prisma.user.update({
      where: { id: challenge.challengerId },
      data: { zionsPoints: { increment: challenge.betAmount } }
    });
    
    await prisma.zionHistory.create({
      data: {
        userId: challenge.challengerId,
        amount: challenge.betAmount,
        reason: 'Desafio 1v1 expirou - reembolso',
        currency: 'POINTS'
      }
    });

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { status: 'EXPIRED' }
    });

    await prisma.notification.create({
      data: {
        userId: challenge.challengerId,
        type: 'CHALLENGE',
        content: 'Seu desafio 1v1 expirou sem resposta. Zions devolvidos.'
      }
    });
  }

  return { completed: expiredChallenges.length, expired: expiredPending.length };
};

// =============================================
// GET WEEKLY CHALLENGE LEADERBOARD
// =============================================
export const getWeeklyChallengeLeaderboard = async (limit: number = 10) => {
  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  // Get completed challenges from this week
  const completedChallenges = await prisma.challenge.findMany({
    where: {
      status: 'COMPLETED',
      winnerId: { not: null },
      completedAt: { gte: weekStart }
    },
    select: { winnerId: true, betAmount: true }
  });

  // Count wins and earnings per user
  const userStats: Record<string, { wins: number; earnings: number }> = {};
  completedChallenges.forEach(c => {
    if (c.winnerId) {
      if (!userStats[c.winnerId]) {
        userStats[c.winnerId] = { wins: 0, earnings: 0 };
      }
      userStats[c.winnerId].wins += 1;
      userStats[c.winnerId].earnings += Math.floor(c.betAmount * 2 * 0.95); // Prize after 5% fee
    }
  });

  // Sort by wins, then by earnings
  const topUserIds = Object.entries(userStats)
    .sort((a, b) => {
      if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
      return b[1].earnings - a[1].earnings;
    })
    .slice(0, limit)
    .map(([userId]) => userId);

  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, displayName: true, avatarUrl: true }
  });

  return {
    weekStart: weekStart.toISOString(),
    leaderboard: topUserIds.map(userId => ({
      user: users.find(u => u.id === userId),
      wins: userStats[userId].wins,
      earnings: userStats[userId].earnings
    }))
  };
};

// =============================================
// GET USER CHALLENGE STATS
// =============================================
export const getUserChallengeStats = async (userId: string) => {
  const [totalWins, totalLosses, totalDraws, weeklyWins, totalEarnings] = await Promise.all([
    // Total wins
    prisma.challenge.count({
      where: { winnerId: userId, status: 'COMPLETED' }
    }),
    // Total losses
    prisma.challenge.count({
      where: {
        status: 'COMPLETED',
        AND: [
          { winnerId: { not: null } },
          { winnerId: { not: userId } }
        ],
        OR: [{ challengerId: userId }, { opponentId: userId }]
      }
    }),
    // Total draws
    prisma.challenge.count({
      where: {
        status: 'COMPLETED',
        winnerId: null,
        OR: [{ challengerId: userId }, { opponentId: userId }]
      }
    }),
    // Weekly wins
    prisma.challenge.count({
      where: {
        winnerId: userId,
        status: 'COMPLETED',
        completedAt: {
          gte: (() => {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - diff);
            weekStart.setHours(0, 0, 0, 0);
            return weekStart;
          })()
        }
      }
    }),
    // Total earnings from challenges
    prisma.zionHistory.aggregate({
      where: {
        userId,
        reason: { contains: 'Vitória no desafio 1v1' }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    totalWins,
    totalLosses,
    totalDraws,
    weeklyWins,
    winRate: totalWins + totalLosses > 0 
      ? Math.round((totalWins / (totalWins + totalLosses)) * 100) 
      : 0,
    totalEarnings: totalEarnings._sum.amount || 0
  };
};
