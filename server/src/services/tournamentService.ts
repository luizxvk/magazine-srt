import prisma from '../utils/prisma';

// ============================================
// TOURNAMENT SERVICE
// ============================================

interface CreateTournamentInput {
    title: string;
    description?: string;
    game?: string;
    imageUrl?: string;
    format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'FREE_FOR_ALL';
    teamSize: number;
    maxTeams: number;
    prizePool?: number;
    rules?: string;
    startDate?: string;
    endDate?: string;
    eventId?: string;
    createdBy: string;
}

/**
 * Create a new tournament
 */
export async function createTournament(input: CreateTournamentInput) {
    return prisma.tournament.create({
        data: {
            title: input.title,
            description: input.description,
            game: input.game,
            imageUrl: input.imageUrl,
            format: input.format,
            teamSize: input.teamSize,
            maxTeams: input.maxTeams,
            prizePool: input.prizePool || 0,
            rules: input.rules,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            eventId: input.eventId,
            createdBy: input.createdBy,
        },
        include: {
            teams: { include: { members: true } },
            matches: true,
            _count: { select: { teams: true } },
        },
    });
}

/**
 * Get all tournaments with optional status filter
 */
export async function getTournaments(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.tournament.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { teams: true, matches: true } },
            teams: {
                take: 5,
                include: {
                    members: {
                        include: {
                            team: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });
}

/**
 * Get tournament by ID with full details
 */
export async function getTournamentById(id: string) {
    return prisma.tournament.findUnique({
        where: { id },
        include: {
            teams: {
                include: {
                    members: true,
                },
                orderBy: { seed: 'asc' },
            },
            matches: {
                include: {
                    team1: { select: { id: true, name: true, seed: true } },
                    team2: { select: { id: true, name: true, seed: true } },
                    winner: { select: { id: true, name: true } },
                },
                orderBy: [{ round: 'asc' }, { position: 'asc' }],
            },
            _count: { select: { teams: true, matches: true } },
        },
    });
}

/**
 * Register a team for a tournament
 */
export async function registerTeam(
    tournamentId: string,
    teamName: string,
    captainId: string,
    memberUserIds: string[]
) {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { _count: { select: { teams: true } } },
    });

    if (!tournament) throw new Error('Torneio não encontrado');
    if (tournament.status !== 'REGISTRATION') throw new Error('Torneio não está em fase de registro');
    if (tournament._count.teams >= tournament.maxTeams) throw new Error('Torneio lotado');

    // Check captain is not already in another team for this tournament
    const existingTeam = await prisma.tournamentTeam.findUnique({
        where: { tournamentId_captainId: { tournamentId, captainId } },
    });
    if (existingTeam) throw new Error('Você já é capitão de um time neste torneio');

    // Check if any member is already in another team
    const allMembers = [captainId, ...memberUserIds.filter(id => id !== captainId)];
    
    if (allMembers.length !== tournament.teamSize) {
        throw new Error(`Time precisa ter exatamente ${tournament.teamSize} membro(s)`);
    }

    const existingMembership = await prisma.tournamentTeamMember.findFirst({
        where: {
            userId: { in: allMembers },
            team: { tournamentId },
        },
    });
    if (existingMembership) throw new Error('Um dos membros já está em outro time neste torneio');

    // Create team with members
    return prisma.tournamentTeam.create({
        data: {
            tournamentId,
            name: teamName,
            captainId,
            members: {
                create: allMembers.map(userId => ({ userId })),
            },
        },
        include: { members: true },
    });
}

/**
 * Leave/unregister from a tournament
 */
export async function unregisterTeam(tournamentId: string, captainId: string) {
    const team = await prisma.tournamentTeam.findUnique({
        where: { tournamentId_captainId: { tournamentId, captainId } },
    });
    if (!team) throw new Error('Time não encontrado');

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (tournament?.status !== 'REGISTRATION') throw new Error('Não é possível sair durante o torneio');

    await prisma.tournamentTeam.delete({ where: { id: team.id } });
    return { success: true };
}

/**
 * Generate brackets (single elimination) and start tournament
 * Seeding: shuffles teams randomly, assigns seeds, and creates round 1 matches
 */
export async function generateBrackets(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { teams: true },
    });

    if (!tournament) throw new Error('Torneio não encontrado');
    if (tournament.status !== 'REGISTRATION') throw new Error('Torneio precisa estar em fase de registro');
    if (tournament.teams.length < 2) throw new Error('Mínimo de 2 times para gerar brackets');

    // Shuffle teams for seeding
    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

    // Pad to next power of 2 for clean brackets
    const totalSlots = nextPowerOfTwo(shuffledTeams.length);
    const totalRounds = Math.log2(totalSlots);

    // Assign seeds
    await Promise.all(
        shuffledTeams.map((team, index) =>
            prisma.tournamentTeam.update({
                where: { id: team.id },
                data: { seed: index + 1 },
            })
        )
    );

    // Create round 1 matches
    const matchesPerRound1 = totalSlots / 2;
    const matches: any[] = [];

    for (let pos = 0; pos < matchesPerRound1; pos++) {
        const team1 = shuffledTeams[pos * 2] || null;
        const team2 = shuffledTeams[pos * 2 + 1] || null;

        // If one team has a bye (no opponent), auto-advance
        const isBye = !team1 || !team2;
        const winner = isBye ? (team1 || team2) : null;

        matches.push({
            tournamentId,
            round: 1,
            position: pos + 1,
            team1Id: team1?.id || null,
            team2Id: team2?.id || null,
            winnerId: winner?.id || null,
            status: isBye ? 'COMPLETED' : 'PENDING',
            completedAt: isBye ? new Date() : null,
        });
    }

    // Create matches for subsequent rounds (empty, to be filled as winners advance)
    for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = totalSlots / Math.pow(2, round);
        for (let pos = 0; pos < matchesInRound; pos++) {
            matches.push({
                tournamentId,
                round,
                position: pos + 1,
                status: 'PENDING',
            });
        }
    }

    // Save all matches
    await prisma.tournamentMatch.createMany({ data: matches });

    // Auto-advance byes to round 2
    await advanceByeWinners(tournamentId);

    // Update tournament status
    await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'IN_PROGRESS' },
    });

    return getTournamentById(tournamentId);
}

/**
 * After generating brackets with byes, auto-advance winners to next round
 */
async function advanceByeWinners(tournamentId: string) {
    const round1Matches = await prisma.tournamentMatch.findMany({
        where: { tournamentId, round: 1, status: 'COMPLETED', winnerId: { not: null } },
        orderBy: { position: 'asc' },
    });

    for (const match of round1Matches) {
        await advanceWinnerToNextRound(tournamentId, match.round, match.position, match.winnerId!);
    }
}

/**
 * Report a match result (admin or captains)
 */
export async function reportMatchResult(
    matchId: string,
    score1: number,
    score2: number,
    reportedBy: string
) {
    const match = await prisma.tournamentMatch.findUnique({
        where: { id: matchId },
        include: {
            team1: { select: { id: true, captainId: true } },
            team2: { select: { id: true, captainId: true } },
            tournament: { select: { id: true, createdBy: true } },
        },
    });

    if (!match) throw new Error('Partida não encontrada');
    if (match.status === 'COMPLETED') throw new Error('Partida já finalizada');
    if (!match.team1Id || !match.team2Id) throw new Error('Partida incompleta (time faltando)');

    // Verify reporter is admin, tournament creator, or team captain
    const isAuthorized =
        match.tournament.createdBy === reportedBy ||
        match.team1?.captainId === reportedBy ||
        match.team2?.captainId === reportedBy;

    // We'll also check admin role in the controller
    if (!isAuthorized) throw new Error('Não autorizado para reportar resultado');

    if (score1 === score2) throw new Error('Empates não são permitidos em eliminação');

    const winnerId = score1 > score2 ? match.team1Id : match.team2Id;

    // Update match
    const updatedMatch = await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
            score1,
            score2,
            winnerId,
            status: 'COMPLETED',
            completedAt: new Date(),
        },
        include: {
            team1: { select: { id: true, name: true } },
            team2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } },
        },
    });

    // Advance winner to next round
    await advanceWinnerToNextRound(
        match.tournamentId,
        match.round,
        match.position,
        winnerId!
    );

    // Check if tournament is finished
    await checkTournamentCompletion(match.tournamentId);

    return updatedMatch;
}

/**
 * Advance winner to next round's bracket slot
 * Even-position matches feed into upper slot, odd into lower
 */
async function advanceWinnerToNextRound(
    tournamentId: string,
    currentRound: number,
    currentPosition: number,
    winnerId: string
) {
    const nextRound = currentRound + 1;
    const nextPosition = Math.ceil(currentPosition / 2);

    const nextMatch = await prisma.tournamentMatch.findUnique({
        where: { tournamentId_round_position: { tournamentId, round: nextRound, position: nextPosition } },
    });

    if (!nextMatch) return; // Final match already - tournament ends

    // Determine if winner goes to team1 or team2 slot
    const isUpperSlot = currentPosition % 2 !== 0; // Odd positions → team1
    const updateData: any = {};

    if (isUpperSlot) {
        updateData.team1Id = winnerId;
    } else {
        updateData.team2Id = winnerId;
    }

    await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: updateData,
    });
}

/**
 * Check if all matches are completed → mark tournament as COMPLETED
 */
async function checkTournamentCompletion(tournamentId: string) {
    const pendingMatches = await prisma.tournamentMatch.count({
        where: { tournamentId, status: { not: 'COMPLETED' } },
    });

    if (pendingMatches === 0) {
        // Find the final match winner
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { matches: { orderBy: { round: 'desc' }, take: 1 } },
        });

        const finalMatch = tournament?.matches[0];

        await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                status: 'COMPLETED',
                endDate: new Date(),
            },
        });

        // Distribute prizes if there's a prize pool
        if (tournament && tournament.prizePool > 0 && finalMatch?.winnerId) {
            await distributePrizes(tournamentId, tournament.prizePool, finalMatch.winnerId);
        }
    }
}

/**
 * Distribute Zions Cash prizes to winning team members
 * 1st place gets full prize pool
 */
async function distributePrizes(tournamentId: string, prizePool: number, winnerTeamId: string) {
    const winnerTeam = await prisma.tournamentTeam.findUnique({
        where: { id: winnerTeamId },
        include: { members: true },
    });

    if (!winnerTeam || winnerTeam.members.length === 0) return;

    const prizePerMember = Math.floor(prizePool / winnerTeam.members.length);

    await Promise.all(
        winnerTeam.members.map(member =>
            prisma.user.update({
                where: { id: member.userId },
                data: { zionsCash: { increment: prizePerMember } },
            })
        )
    );
}

/**
 * Get tournament leaderboard/standings
 */
export async function getLeaderboard(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            teams: {
                include: {
                    members: true,
                    matchesWon: true,
                    matchesAsTeam1: { where: { status: 'COMPLETED' } },
                    matchesAsTeam2: { where: { status: 'COMPLETED' } },
                },
            },
        },
    });

    if (!tournament) throw new Error('Torneio não encontrado');

    // Calculate standings
    const standings = tournament.teams.map(team => {
        const matchesPlayed = team.matchesAsTeam1.length + team.matchesAsTeam2.length;
        const wins = team.matchesWon.length;
        const losses = matchesPlayed - wins;

        // Determine highest round reached
        const allMatches = [...team.matchesAsTeam1, ...team.matchesAsTeam2];
        const highestRound = allMatches.length > 0
            ? Math.max(...allMatches.map(m => m.round))
            : 0;

        return {
            teamId: team.id,
            teamName: team.name,
            seed: team.seed,
            memberCount: team.members.length,
            matchesPlayed,
            wins,
            losses,
            highestRound,
            isEliminated: losses > 0 && tournament.format === 'SINGLE_ELIMINATION',
        };
    });

    // Sort: highest round first, then by wins
    standings.sort((a, b) => b.highestRound - a.highestRound || b.wins - a.wins);

    return standings;
}

/**
 * Admin: Update tournament details
 */
export async function updateTournament(
    tournamentId: string,
    data: Partial<CreateTournamentInput>
) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    delete updateData.createdBy; // Can't change creator

    return prisma.tournament.update({
        where: { id: tournamentId },
        data: updateData,
        include: {
            _count: { select: { teams: true, matches: true } },
        },
    });
}

/**
 * Admin: Cancel tournament
 */
export async function cancelTournament(tournamentId: string) {
    return prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'CANCELLED' },
    });
}

// ============================================
// HELPERS
// ============================================

function nextPowerOfTwo(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}
