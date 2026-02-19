/**
 * StatForge External API Integration Service
 * 
 * This service handles fetching game statistics from external APIs:
 * - Riot Games (League of Legends, Valorant, TFT)
 * - PUBG (Krafton API)
 * - Dota 2 (OpenDota API)
 * - Steam (Steam Web API)
 */

import axios from 'axios';

// ============================================
// API CLIENTS & CONFIG
// ============================================

const RIOT_API_KEY = process.env.RIOT_API_KEY || '';
const PUBG_API_KEY = process.env.PUBG_API_KEY || '';
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const TRACKER_GG_API_KEY = process.env.TRACKER_GG_API_KEY || '';

// Riot Americas router for accounts API
const RIOT_AMERICAS = 'https://americas.api.riotgames.com';
const RIOT_BR = 'https://br1.api.riotgames.com';
const RIOT_LA = 'https://la1.api.riotgames.com';

// PUBG API
const PUBG_API = 'https://api.pubg.com';

// OpenDota (free, no key required)
const OPENDOTA_API = 'https://api.opendota.com/api';

// Steam API
const STEAM_API = 'https://api.steampowered.com';

// Tracker.gg API (R6, Apex, etc.)
const TRACKER_GG_API = 'https://public-api.tracker.gg/v2';

// ============================================
// TYPES
// ============================================

export interface GameStats {
  rank?: string;
  rankTier?: number;
  level?: number;
  kd?: number;
  winRate?: number;
  totalMatches?: number;
  totalWins?: number;
  totalKills?: number;
  totalDeaths?: number;
  hoursPlayed?: number;
  score?: number;
  stats?: Record<string, any>;
}

export interface FetchResult {
  success: boolean;
  data?: GameStats;
  error?: string;
}

// ============================================
// RIOT GAMES (LoL, Valorant, TFT)
// ============================================

/**
 * Fetch LoL ranked stats
 */
export async function fetchLoLStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!RIOT_API_KEY) {
      return { success: false, error: 'RIOT_API_KEY not configured' };
    }

    // Parse gamertag (Name#Tag format)
    const [gameName, tagLine] = gamertag.split('#');
    if (!gameName || !tagLine) {
      return { success: false, error: 'Invalid gamertag format. Use Name#Tag' };
    }

    // Get PUUID from account API
    const accountRes = await axios.get(
      `${RIOT_AMERICAS}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const puuid = accountRes.data.puuid;

    // Get summoner info
    const summonerRes = await axios.get(
      `${RIOT_BR}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const summoner = summonerRes.data;

    // Get ranked stats
    const rankedRes = await axios.get(
      `${RIOT_BR}/lol/league/v4/entries/by-summoner/${summoner.id}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    
    // Find solo/duo queue
    const soloQueue = rankedRes.data.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
    
    const stats: GameStats = {
      level: summoner.summonerLevel,
      rank: soloQueue ? `${soloQueue.tier} ${soloQueue.rank}` : 'Unranked',
      rankTier: soloQueue ? calculateRiotRankTier(soloQueue.tier, soloQueue.rank) : 0,
      totalWins: soloQueue?.wins || 0,
      totalMatches: soloQueue ? (soloQueue.wins + soloQueue.losses) : 0,
      winRate: soloQueue ? Math.round((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100) : 0,
      stats: {
        leaguePoints: soloQueue?.leaguePoints || 0,
        hotStreak: soloQueue?.hotStreak || false,
        veteran: soloQueue?.veteran || false,
        freshBlood: soloQueue?.freshBlood || false,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] LoL fetch error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.status?.message || 'Failed to fetch LoL stats' };
  }
}

/**
 * Fetch Valorant stats
 */
export async function fetchValorantStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!RIOT_API_KEY) {
      return { success: false, error: 'RIOT_API_KEY not configured' };
    }

    // Parse gamertag (Name#Tag format)
    const [gameName, tagLine] = gamertag.split('#');
    if (!gameName || !tagLine) {
      return { success: false, error: 'Invalid gamertag format. Use Name#Tag' };
    }

    // Get PUUID
    const accountRes = await axios.get(
      `${RIOT_AMERICAS}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const puuid = accountRes.data.puuid;

    // Valorant API is more limited - get match history
    const matchlistRes = await axios.get(
      `${RIOT_BR}/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    const recentMatches = matchlistRes.data.history?.slice(0, 20) || [];
    
    const stats: GameStats = {
      totalMatches: recentMatches.length,
      stats: {
        puuid,
        recentMatchCount: recentMatches.length,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Valorant fetch error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.status?.message || 'Failed to fetch Valorant stats' };
  }
}

/**
 * Fetch TFT stats
 */
export async function fetchTFTStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!RIOT_API_KEY) {
      return { success: false, error: 'RIOT_API_KEY not configured' };
    }

    // Parse gamertag (Name#Tag format)
    const [gameName, tagLine] = gamertag.split('#');
    if (!gameName || !tagLine) {
      return { success: false, error: 'Invalid gamertag format. Use Name#Tag' };
    }

    // Get PUUID
    const accountRes = await axios.get(
      `${RIOT_AMERICAS}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const puuid = accountRes.data.puuid;

    // Get TFT summoner
    const summonerRes = await axios.get(
      `${RIOT_BR}/tft/summoner/v1/summoners/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const summoner = summonerRes.data;

    // Get TFT ranked
    const rankedRes = await axios.get(
      `${RIOT_BR}/tft/league/v1/entries/by-summoner/${summoner.id}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    const rankedEntry = rankedRes.data?.[0];
    
    const stats: GameStats = {
      level: summoner.summonerLevel,
      rank: rankedEntry ? `${rankedEntry.tier} ${rankedEntry.rank}` : 'Unranked',
      rankTier: rankedEntry ? calculateRiotRankTier(rankedEntry.tier, rankedEntry.rank) : 0,
      totalWins: rankedEntry?.wins || 0,
      totalMatches: rankedEntry ? (rankedEntry.wins + rankedEntry.losses) : 0,
      winRate: rankedEntry ? Math.round((rankedEntry.wins / (rankedEntry.wins + rankedEntry.losses)) * 100) : 0,
      stats: {
        leaguePoints: rankedEntry?.leaguePoints || 0,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] TFT fetch error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.status?.message || 'Failed to fetch TFT stats' };
  }
}

// ============================================
// PUBG (Krafton API)
// ============================================

/**
 * Fetch PUBG stats
 */
export async function fetchPUBGStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!PUBG_API_KEY) {
      return { success: false, error: 'PUBG_API_KEY not configured' };
    }

    // Map platform to PUBG shard
    const shard = platform === 'xbox' ? 'xbox-na' : platform === 'playstation' ? 'psn' : 'steam';

    // Get player ID
    const playerRes = await axios.get(
      `${PUBG_API}/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(gamertag)}`,
      { 
        headers: { 
          'Authorization': `Bearer ${PUBG_API_KEY}`,
          'Accept': 'application/vnd.api+json'
        } 
      }
    );

    const player = playerRes.data.data?.[0];
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Get season stats
    const seasonsRes = await axios.get(
      `${PUBG_API}/shards/${shard}/seasons`,
      { 
        headers: { 
          'Authorization': `Bearer ${PUBG_API_KEY}`,
          'Accept': 'application/vnd.api+json'
        } 
      }
    );

    const currentSeason = seasonsRes.data.data.find((s: any) => s.attributes.isCurrentSeason);
    if (!currentSeason) {
      return { success: true, data: { stats: { playerId: player.id } } };
    }

    const statsRes = await axios.get(
      `${PUBG_API}/shards/${shard}/players/${player.id}/seasons/${currentSeason.id}/ranked`,
      { 
        headers: { 
          'Authorization': `Bearer ${PUBG_API_KEY}`,
          'Accept': 'application/vnd.api+json'
        } 
      }
    );

    const rankedStats = statsRes.data.data?.attributes?.rankedGameModeStats?.['squad-fpp'];
    
    const stats: GameStats = {
      rank: rankedStats?.currentTier?.tier || 'Unranked',
      rankTier: rankedStats?.currentRankPoint || 0,
      totalMatches: rankedStats?.roundsPlayed || 0,
      totalWins: rankedStats?.wins || 0,
      totalKills: rankedStats?.kills || 0,
      totalDeaths: rankedStats?.deaths || 0,
      kd: rankedStats?.deaths > 0 ? parseFloat((rankedStats.kills / rankedStats.deaths).toFixed(2)) : rankedStats?.kills || 0,
      winRate: rankedStats?.roundsPlayed > 0 ? Math.round((rankedStats.wins / rankedStats.roundsPlayed) * 100) : 0,
      stats: {
        damageDealt: rankedStats?.damageDealt || 0,
        avgRank: rankedStats?.avgRank || 0,
        top10s: rankedStats?.top10s || 0,
        assists: rankedStats?.assists || 0,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] PUBG fetch error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.errors?.[0]?.title || 'Failed to fetch PUBG stats' };
  }
}

// ============================================
// DOTA 2 (OpenDota - Free API)
// ============================================

/**
 * Fetch Dota 2 stats via OpenDota
 */
export async function fetchDota2Stats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    // gamertag should be Steam ID / account_id for Dota
    const accountId = gamertag.replace(/[^0-9]/g, '');
    
    if (!accountId) {
      return { success: false, error: 'Invalid account ID. Use your Steam32 ID or vanity URL' };
    }

    // Get player profile
    const playerRes = await axios.get(`${OPENDOTA_API}/players/${accountId}`);
    const player = playerRes.data;

    if (player.profile?.account_id === undefined) {
      return { success: false, error: 'Player not found or profile is private' };
    }

    // Get win/loss
    const wlRes = await axios.get(`${OPENDOTA_API}/players/${accountId}/wl`);
    const wl = wlRes.data;

    // Get totals
    const totalsRes = await axios.get(`${OPENDOTA_API}/players/${accountId}/totals`);
    const totals = totalsRes.data;

    const totalMatches = (wl.win || 0) + (wl.lose || 0);
    const killsTotal = totals.find((t: any) => t.field === 'kills')?.sum || 0;
    const deathsTotal = totals.find((t: any) => t.field === 'deaths')?.sum || 0;

    const stats: GameStats = {
      rank: player.rank_tier ? getMedalName(player.rank_tier) : 'Unranked',
      rankTier: player.rank_tier || 0,
      totalMatches,
      totalWins: wl.win || 0,
      totalKills: killsTotal,
      totalDeaths: deathsTotal,
      kd: deathsTotal > 0 ? parseFloat((killsTotal / deathsTotal).toFixed(2)) : killsTotal,
      winRate: totalMatches > 0 ? Math.round((wl.win / totalMatches) * 100) : 0,
      stats: {
        mmrEstimate: player.mmr_estimate?.estimate || null,
        soloCompetitiveRank: player.solo_competitive_rank || null,
        competitiveRank: player.competitive_rank || null,
        leaderboardRank: player.leaderboard_rank || null,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Dota 2 fetch error:', error.response?.data || error.message);
    return { success: false, error: 'Failed to fetch Dota 2 stats' };
  }
}

// ============================================
// STEAM
// ============================================

/**
 * Fetch Steam profile stats
 */
export async function fetchSteamStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!STEAM_API_KEY) {
      return { success: false, error: 'STEAM_API_KEY not configured' };
    }

    // gamertag can be Steam64 ID or vanity URL
    let steamId = gamertag;

    // If not a numeric ID, try to resolve vanity URL
    if (!/^\d+$/.test(gamertag)) {
      try {
        const vanityRes = await axios.get(
          `${STEAM_API}/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${encodeURIComponent(gamertag)}`
        );
        if (vanityRes.data.response.success === 1) {
          steamId = vanityRes.data.response.steamid;
        } else {
          return { success: false, error: 'Could not resolve Steam vanity URL' };
        }
      } catch {
        return { success: false, error: 'Invalid Steam ID or vanity URL' };
      }
    }

    // Get player summary
    const summaryRes = await axios.get(
      `${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
    );
    const player = summaryRes.data.response.players?.[0];

    if (!player) {
      return { success: false, error: 'Steam profile not found' };
    }

    // Get owned games
    const gamesRes = await axios.get(
      `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_played_free_games=1`
    );
    const gamesData = gamesRes.data.response;

    // Get recent playtime
    const recentRes = await axios.get(
      `${STEAM_API}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}`
    );
    const recentGames = recentRes.data.response;

    const totalPlaytime = gamesData.games?.reduce((acc: number, g: any) => acc + (g.playtime_forever || 0), 0) || 0;
    const hoursPlayed = Math.round(totalPlaytime / 60);

    const stats: GameStats = {
      level: player.level || 0,
      hoursPlayed,
      totalMatches: gamesData.game_count || 0,
      stats: {
        personaName: player.personaname,
        avatarUrl: player.avatarfull,
        profileUrl: player.profileurl,
        countryCode: player.loccountrycode,
        gamesOwned: gamesData.game_count || 0,
        recentGamesCount: recentGames.total_count || 0,
        recentPlaytimeMinutes: recentGames.games?.reduce((acc: number, g: any) => acc + (g.playtime_2weeks || 0), 0) || 0,
      }
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Steam fetch error:', error.response?.data || error.message);
    return { success: false, error: 'Failed to fetch Steam stats' };
  }
}

// ============================================
// TRACKER.GG (R6 Siege, Apex Legends, etc.)
// ============================================

/**
 * Fetch R6 Siege stats via Tracker.gg
 */
export async function fetchR6SiegeStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!TRACKER_GG_API_KEY) {
      return { success: false, error: 'TRACKER_GG_API_KEY not configured' };
    }

    // Map platform to Tracker.gg format
    const platformMap: Record<string, string> = {
      'pc': 'uplay',
      'xbox': 'xbl',
      'playstation': 'psn',
    };
    const trnPlatform = platformMap[platform] || 'uplay';

    const response = await axios.get(
      `${TRACKER_GG_API}/r6siege/standard/profile/${trnPlatform}/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'TRN-Api-Key': TRACKER_GG_API_KEY,
        },
      }
    );

    const data = response.data.data;
    const overview = data.segments?.find((s: any) => s.type === 'overview');

    if (!overview) {
      return { success: false, error: 'No overview data found' };
    }

    const stats: GameStats = {
      level: overview.stats?.level?.value || 0,
      kd: overview.stats?.kd?.value || 0,
      winRate: overview.stats?.wlPercentage?.value || 0,
      totalMatches: overview.stats?.matchesPlayed?.value || 0,
      totalWins: overview.stats?.wins?.value || 0,
      totalKills: overview.stats?.kills?.value || 0,
      totalDeaths: overview.stats?.deaths?.value || 0,
      hoursPlayed: Math.round((overview.stats?.timePlayed?.value || 0) / 3600),
      rank: overview.stats?.rankName?.value || 'Unranked',
      rankTier: overview.stats?.maxRank?.value || 0,
      stats: {
        headshots: overview.stats?.headshots?.value || 0,
        headshotPercentage: overview.stats?.headshotPercentage?.value || 0,
        assists: overview.stats?.assists?.value || 0,
        revives: overview.stats?.revives?.value || 0,
        melee: overview.stats?.meleeKills?.value || 0,
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] R6 Siege fetch error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return { success: false, error: 'Player not found on R6 Siege' };
    }
    return { success: false, error: 'Failed to fetch R6 Siege stats' };
  }
}

/**
 * Fetch Apex Legends stats via Tracker.gg
 */
export async function fetchApexStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!TRACKER_GG_API_KEY) {
      return { success: false, error: 'TRACKER_GG_API_KEY not configured' };
    }

    // Map platform to Tracker.gg format
    const platformMap: Record<string, string> = {
      'pc': 'origin',
      'xbox': 'xbl',
      'playstation': 'psn',
    };
    const trnPlatform = platformMap[platform] || 'origin';

    const response = await axios.get(
      `${TRACKER_GG_API}/apex/standard/profile/${trnPlatform}/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'TRN-Api-Key': TRACKER_GG_API_KEY,
        },
      }
    );

    const data = response.data.data;
    const overview = data.segments?.find((s: any) => s.type === 'overview');

    if (!overview) {
      return { success: false, error: 'No overview data found' };
    }

    const stats: GameStats = {
      level: overview.stats?.level?.value || 0,
      totalKills: overview.stats?.kills?.value || 0,
      totalMatches: overview.stats?.matchesPlayed?.value || 0,
      rank: overview.stats?.rankName?.value || data.metadata?.activeLegendName || 'Unknown',
      rankTier: overview.stats?.rankScore?.value || 0,
      stats: {
        activeLegend: data.metadata?.activeLegendName,
        damage: overview.stats?.damage?.value || 0,
        headshots: overview.stats?.headshots?.value || 0,
        arenas: {
          kills: overview.stats?.arenasKills?.value || 0,
          damage: overview.stats?.arenasDamage?.value || 0,
        },
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Apex fetch error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return { success: false, error: 'Player not found on Apex Legends' };
    }
    return { success: false, error: 'Failed to fetch Apex stats' };
  }
}

/**
 * Fetch Counter-Strike 2 stats via Tracker.gg
 */
export async function fetchCS2Stats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!TRACKER_GG_API_KEY) {
      return { success: false, error: 'TRACKER_GG_API_KEY not configured' };
    }

    // CS2 uses Steam platform identifier
    const response = await axios.get(
      `${TRACKER_GG_API}/cs2/standard/profile/steam/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'TRN-Api-Key': TRACKER_GG_API_KEY,
        },
      }
    );

    const data = response.data.data;
    const overview = data.segments?.find((s: any) => s.type === 'overview');

    if (!overview) {
      return { success: false, error: 'No overview data found' };
    }

    const stats: GameStats = {
      kd: overview.stats?.kd?.value || 0,
      winRate: overview.stats?.winPercentage?.value || 0,
      totalMatches: overview.stats?.matchesPlayed?.value || 0,
      totalWins: overview.stats?.wins?.value || 0,
      totalKills: overview.stats?.kills?.value || 0,
      totalDeaths: overview.stats?.deaths?.value || 0,
      hoursPlayed: Math.round((overview.stats?.timePlayed?.value || 0) / 3600),
      rank: overview.stats?.rank?.metadata?.name || 'Unranked',
      rankTier: overview.stats?.rank?.value || 0,
      stats: {
        headshots: overview.stats?.headshots?.value || 0,
        headshotPercentage: overview.stats?.headshotPct?.value || 0,
        damage: overview.stats?.damage?.value || 0,
        damagePerRound: overview.stats?.damagePerRound?.value || 0,
        roundsPlayed: overview.stats?.roundsPlayed?.value || 0,
        mvps: overview.stats?.mvps?.value || 0,
        adr: overview.stats?.adr?.value || 0,
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] CS2 fetch error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return { success: false, error: 'Player not found on CS2' };
    }
    return { success: false, error: 'Failed to fetch CS2 stats' };
  }
}

/**
 * Fetch Fortnite stats via Tracker.gg
 */
export async function fetchFortniteStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!TRACKER_GG_API_KEY) {
      return { success: false, error: 'TRACKER_GG_API_KEY not configured' };
    }

    // Map platform to Tracker.gg format
    const platformMap: Record<string, string> = {
      'pc': 'epic',
      'xbox': 'xbl',
      'playstation': 'psn',
    };
    const trnPlatform = platformMap[platform] || 'epic';

    const response = await axios.get(
      `${TRACKER_GG_API}/fortnite/standard/profile/${trnPlatform}/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'TRN-Api-Key': TRACKER_GG_API_KEY,
        },
      }
    );

    const data = response.data.data;
    const overview = data.segments?.find((s: any) => s.type === 'overview');

    if (!overview) {
      return { success: false, error: 'No overview data found' };
    }

    const stats: GameStats = {
      level: overview.stats?.level?.value || 0,
      kd: overview.stats?.kd?.value || 0,
      winRate: overview.stats?.winRate?.value || 0,
      totalMatches: overview.stats?.matchesPlayed?.value || 0,
      totalWins: overview.stats?.wins?.value || 0,
      totalKills: overview.stats?.kills?.value || 0,
      totalDeaths: overview.stats?.deaths?.value || 0,
      score: overview.stats?.score?.value || 0,
      stats: {
        top3: overview.stats?.top3?.value || 0,
        top5: overview.stats?.top5?.value || 0,
        top10: overview.stats?.top10?.value || 0,
        top25: overview.stats?.top25?.value || 0,
        minutesPlayed: overview.stats?.minutesPlayed?.value || 0,
        killsPerMatch: overview.stats?.killsPerMatch?.value || 0,
        killsPerMin: overview.stats?.killsPerMin?.value || 0,
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Fortnite fetch error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return { success: false, error: 'Player not found on Fortnite' };
    }
    return { success: false, error: 'Failed to fetch Fortnite stats' };
  }
}

/**
 * Fetch Rocket League stats via Tracker.gg
 */
export async function fetchRocketLeagueStats(gamertag: string, platform: string): Promise<FetchResult> {
  try {
    if (!TRACKER_GG_API_KEY) {
      return { success: false, error: 'TRACKER_GG_API_KEY not configured' };
    }

    // Map platform to Tracker.gg format
    const platformMap: Record<string, string> = {
      'pc': 'steam',
      'xbox': 'xbl',
      'playstation': 'psn',
      'epic': 'epic',
    };
    const trnPlatform = platformMap[platform] || 'steam';

    const response = await axios.get(
      `${TRACKER_GG_API}/rocket-league/standard/profile/${trnPlatform}/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'TRN-Api-Key': TRACKER_GG_API_KEY,
        },
      }
    );

    const data = response.data.data;
    const overview = data.segments?.find((s: any) => s.type === 'overview');

    if (!overview) {
      return { success: false, error: 'No overview data found' };
    }

    // Find ranked 3v3 or 2v2 for rank
    const ranked3v3 = data.segments?.find((s: any) => s.metadata?.name === 'Ranked Standard 3v3');
    const ranked2v2 = data.segments?.find((s: any) => s.metadata?.name === 'Ranked Doubles 2v2');
    const rankedPlaylist = ranked3v3 || ranked2v2;

    const stats: GameStats = {
      totalWins: overview.stats?.wins?.value || 0,
      totalMatches: overview.stats?.matches?.value || 0,
      rank: rankedPlaylist?.stats?.tier?.metadata?.name || 'Unranked',
      rankTier: rankedPlaylist?.stats?.rating?.value || 0,
      score: rankedPlaylist?.stats?.rating?.value || overview.stats?.seasonRewardLevel?.value || 0,
      stats: {
        goals: overview.stats?.goals?.value || 0,
        assists: overview.stats?.assists?.value || 0,
        mvps: overview.stats?.mVPs?.value || 0,
        saves: overview.stats?.saves?.value || 0,
        shots: overview.stats?.shots?.value || 0,
        goalShotRatio: overview.stats?.goalShotRatio?.value || 0,
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('[StatForge] Rocket League fetch error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return { success: false, error: 'Player not found on Rocket League' };
    }
    return { success: false, error: 'Failed to fetch Rocket League stats' };
  }
}

// ============================================
// MAIN DISPATCHER
// ============================================

/**
 * Fetch game stats based on game type
 */
export async function fetchGameStats(game: string, gamertag: string, platform: string): Promise<FetchResult> {
  switch (game.toLowerCase()) {
    case 'lol':
      return fetchLoLStats(gamertag, platform);
    case 'valorant':
      return fetchValorantStats(gamertag, platform);
    case 'tft':
      return fetchTFTStats(gamertag, platform);
    case 'pubg':
      return fetchPUBGStats(gamertag, platform);
    case 'dota2':
      return fetchDota2Stats(gamertag, platform);
    case 'steam':
      return fetchSteamStats(gamertag, platform);
    case 'r6siege':
      return fetchR6SiegeStats(gamertag, platform);
    case 'apex':
      return fetchApexStats(gamertag, platform);
    case 'cs2':
      return fetchCS2Stats(gamertag, platform);
    case 'fortnite':
      return fetchFortniteStats(gamertag, platform);
    case 'rocketleague':
      return fetchRocketLeagueStats(gamertag, platform);
    default:
      return { success: false, error: `Game "${game}" is not yet supported for automatic sync` };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculate Riot rank tier as a number for comparison
 */
function calculateRiotRankTier(tier: string, rank: string): number {
  const tiers: Record<string, number> = {
    'IRON': 0,
    'BRONZE': 400,
    'SILVER': 800,
    'GOLD': 1200,
    'PLATINUM': 1600,
    'EMERALD': 2000,
    'DIAMOND': 2400,
    'MASTER': 2800,
    'GRANDMASTER': 3200,
    'CHALLENGER': 3600,
  };
  
  const ranks: Record<string, number> = {
    'IV': 0,
    'III': 100,
    'II': 200,
    'I': 300,
  };

  return (tiers[tier.toUpperCase()] || 0) + (ranks[rank] || 0);
}

/**
 * Convert Dota 2 rank tier to medal name
 */
function getMedalName(rankTier: number): string {
  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  
  const medals = ['', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
  const medalName = medals[tier] || 'Unknown';
  
  return stars > 0 ? `${medalName} ${stars}` : medalName;
}
