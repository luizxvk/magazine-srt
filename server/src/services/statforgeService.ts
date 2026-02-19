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
