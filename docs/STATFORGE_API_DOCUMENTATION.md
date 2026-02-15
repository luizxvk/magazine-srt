# StatForge - Game Stats API Documentation

> **Last Updated:** February 2026  
> **Purpose:** Integration documentation for StatForge game statistics tracker feature  
> **Target Stack:** Node.js/Express backend integration

---

## Table of Contents

1. [FPS/Tactical Games](#fpstactical-games)
   - [Rainbow Six Siege](#1-rainbow-six-siege)
   - [Counter-Strike 2](#2-counter-strike-2-cs2)
   - [Valorant](#3-valorant)
   - [Apex Legends](#4-apex-legends)
   - [Overwatch 2](#5-overwatch-2)
   - [Call of Duty](#6-call-of-duty-warzonemw)
2. [Battle Royale](#battle-royale)
   - [Fortnite](#7-fortnite)
   - [PUBG](#8-pubg)
3. [MOBA](#moba)
   - [League of Legends](#9-league-of-legends)
   - [Dota 2](#10-dota-2)
   - [Teamfight Tactics](#11-teamfight-tactics-tft)
4. [Gaming Platforms](#gaming-platforms)
   - [Steam](#12-steam)
   - [Xbox Live](#13-xbox-live)
   - [PlayStation Network](#14-playstation-network-psn)
   - [Nintendo](#15-nintendo)
   - [Epic Games](#16-epic-games)
5. [Other Games](#other-games)
   - [Rocket League](#17-rocket-league)
   - [Minecraft](#18-minecraft)
   - [EA FC (FIFA)](#19-ea-fc-fifa)
6. [Third-Party Aggregators](#third-party-aggregators)
7. [Implementation Recommendations](#implementation-recommendations)

---

## FPS/Tactical Games

### 1. Rainbow Six Siege

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Ubisoft |
| **Platform** | PC, Xbox, PlayStation |

#### Official API

Ubisoft does **not** provide a public API for Rainbow Six Siege. All stats access is restricted to internal use and authorized partners only.

#### Authentication (N/A)

No official authentication flow available for developers.

#### Alternative/Unofficial APIs

| Service | URL | Method | Limitations |
|---------|-----|--------|-------------|
| **Tracker.gg** | https://tracker.gg/developers | API Key | Rate limited, requires approval |
| **R6Stats** | https://r6stats.com/ | Web Scraping | Unofficial, may break |
| **R6Tab** | https://r6tab.com/ | Scraping | Unofficial |
| **Tabstats** | https://tabstats.com/ | Scraping | Anti-cheat focus |

#### Best Alternative: Tracker.gg R6 API

```
Developer Portal: https://tracker.gg/developers
Authentication: API Key (X-TRN-Api-Key header)
Rate Limit: 30 requests/minute (free tier)
Cost: Free tier available, paid plans for higher limits
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://public-api.tracker.gg/v2/r6siege/standard/profile/uplay/PlayerName',
  {
    headers: {
      'TRN-Api-Key': process.env.TRACKER_GG_API_KEY
    }
  }
);
```

**Data Available:**
- Overall stats (K/D, W/L, playtime)
- Ranked stats and MMR
- Operator statistics
- Seasonal performance
- Match history (limited)

**Sample Response Structure:**
```json
{
  "data": {
    "platformInfo": {
      "platformSlug": "uplay",
      "platformUserId": "player-id",
      "platformUserHandle": "PlayerName"
    },
    "segments": [
      {
        "type": "overview",
        "stats": {
          "kills": { "value": 15000, "displayValue": "15,000" },
          "deaths": { "value": 12000, "displayValue": "12,000" },
          "kd": { "value": 1.25, "displayValue": "1.25" },
          "wins": { "value": 500, "displayValue": "500" },
          "losses": { "value": 400, "displayValue": "400" },
          "wlRatio": { "value": 1.25, "displayValue": "1.25" }
        }
      }
    ]
  }
}
```

---

### 2. Counter-Strike 2 (CS2)

| Attribute | Details |
|-----------|---------|
| **API Status** | ⚠️ Limited (via Steam API) |
| **Publisher** | Valve |
| **Platform** | PC (Steam) |

#### Official API

CS2 uses **Steam Web API** for basic stats. However, detailed match history and ranked stats are limited.

#### Authentication

```
Method: API Key
Developer Portal: https://steamcommunity.com/dev/apikey
Cost: Free
Rate Limit: 100,000 requests/day
```

#### Key Endpoints

| Endpoint | Data | Status |
|----------|------|--------|
| `ISteamUserStats/GetUserStatsForGame` | Player stats | ✅ Works |
| `ICSGOServers_730/GetGameServersStatus` | Server status | ✅ Works |
| `IDOTA2Match_570/GetMatchHistory` | Match history | ❌ CS2 not supported |

**Sample Request:**
```javascript
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = '76561198012345678';
const CS2_APP_ID = '730'; // Same as CSGO

const response = await axios.get(
  `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/`,
  {
    params: {
      key: STEAM_API_KEY,
      steamid: STEAM_ID,
      appid: CS2_APP_ID
    }
  }
);
```

**Data Available (via Steam):**
- Total kills, deaths
- Weapon-specific stats
- Map wins
- MVP stars
- Total playtime
- ❌ NO ranked/Premier stats
- ❌ NO match history
- ❌ NO Elo/Rating

#### Alternative APIs

| Service | URL | Method | Data |
|---------|-----|--------|------|
| **Tracker.gg** | https://tracker.gg/cs2 | API Key | Premier rating, leaderboards |
| **Leetify** | https://leetify.com/ | Scraping | Advanced analytics |
| **FACEIT** | https://developers.faceit.com/ | OAuth2 | Third-party ranked |
| **ESEA** | N/A | No API | League stats |

#### FACEIT API (Recommended for Competitive)

```
Developer Portal: https://developers.faceit.com/
Authentication: OAuth2 or API Key
Rate Limit: 10 requests/second
Cost: Free tier available
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://open.faceit.com/data/v4/players',
  {
    params: { nickname: 'PlayerName', game: 'cs2' },
    headers: {
      'Authorization': `Bearer ${process.env.FACEIT_API_KEY}`
    }
  }
);
```

---

### 3. Valorant

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official API Available |
| **Publisher** | Riot Games |
| **Platform** | PC |

#### Official API

Riot Games provides a **comprehensive official API** for Valorant.

#### Authentication

```
Method: API Key (Development) + RSO OAuth2 (Production)
Developer Portal: https://developer.riotgames.com/
Cost: Free
Rate Limits:
  - Development: 20 requests/second, 100 requests/2 minutes
  - Production: 500+ requests/10 seconds (varies by endpoint)
```

#### Registration Process

1. Create account at https://developer.riotgames.com/
2. Register application
3. Get Development API Key (24h expiry, auto-renews)
4. Apply for Production API Key (requires app review)

#### Key Endpoints

| Endpoint | Description | Auth Level |
|----------|-------------|------------|
| `GET /val/content/v1/contents` | Game content (agents, maps) | Dev |
| `GET /val/match/v1/matches/{matchId}` | Match details | Production |
| `GET /val/match/v1/matchlists/by-puuid/{puuid}` | Match history | Production |
| `GET /val/ranked/v1/leaderboards/by-act/{actId}` | Leaderboards | Dev |
| `GET /val/status/v1/platform-data` | Service status | Dev |

**Sample Request:**
```javascript
const response = await axios.get(
  `https://br.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${actId}`,
  {
    headers: {
      'X-Riot-Token': process.env.RIOT_API_KEY
    },
    params: {
      size: 100,
      startIndex: 0
    }
  }
);
```

**Data Available:**
- ✅ Match history
- ✅ Competitive rank
- ✅ Agent statistics
- ✅ Leaderboards
- ✅ K/D/A per match
- ⚠️ Detailed player stats require Production key

#### Alternative APIs

| Service | URL | Data |
|---------|-----|------|
| **Henrik's API** | https://docs.henrikdev.xyz/valorant.html | Unofficial, comprehensive |
| **Tracker.gg** | https://tracker.gg/valorant | Profile stats |
| **Blitz.gg** | https://blitz.gg/valorant | Live game data |

#### Henrik's Unofficial API (Popular Alternative)

```
Base URL: https://api.henrikdev.xyz
Authentication: None (public) or API key for higher limits
Rate Limit: 30 requests/minute (free), higher with key
Cost: Free tier, Patreon for more
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.henrikdev.xyz/valorant/v1/account/name/tag'
);
```

**Sample Response:**
```json
{
  "status": 200,
  "data": {
    "puuid": "xxx-xxx-xxx",
    "region": "br",
    "account_level": 150,
    "name": "PlayerName",
    "tag": "BR1",
    "card": {
      "small": "url",
      "large": "url"
    },
    "last_update": "2026-02-15T10:30:00Z"
  }
}
```

---

### 4. Apex Legends

| Attribute | Details |
|-----------|---------|
| **API Status** | ⚠️ Limited Official API |
| **Publisher** | EA / Respawn |
| **Platform** | PC, Xbox, PlayStation |

#### Official API

EA provides a **limited API** through their EA Developer Portal. Access is heavily restricted.

#### Authentication

```
Method: OAuth2
Developer Portal: https://developer.ea.com/
Status: Invite-only / Partner program
Cost: Free (if approved)
Rate Limit: Unknown (NDA protected)
```

#### Alternative APIs (Recommended)

| Service | URL | Method | Status |
|---------|-----|--------|--------|
| **Mozambique Here! API** | https://apexlegendsapi.com/ | API Key | ✅ Best option |
| **Tracker.gg** | https://tracker.gg/apex | API Key | ✅ Available |
| **Apex.tracker.gg** | https://apex.tracker.gg/apex/api | Scraping | Works |

#### Mozambique Here! API (Recommended)

```
Developer Portal: https://apexlegendsapi.com/
Authentication: API Key (URL parameter)
Rate Limit: 2 requests/second (free), 5/sec (paid)
Cost: Free tier (limited), $5-20/month for more
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.mozambiquehe.re/bridge',
  {
    params: {
      auth: process.env.APEX_API_KEY,
      player: 'PlayerName',
      platform: 'PC'
    }
  }
);
```

**Data Available:**
- ✅ Account level
- ✅ Ranked stats (BR & Arenas)
- ✅ Legend-specific stats (equipped trackers only)
- ✅ Current equipped badges
- ✅ Battle Pass level
- ⚠️ Only stats player has equipped as trackers
- ❌ Match history not available

**Sample Response:**
```json
{
  "global": {
    "name": "PlayerName",
    "uid": "1234567890",
    "platform": "PC",
    "level": 500,
    "toNextLevelPercent": 45,
    "rank": {
      "rankScore": 12500,
      "rankName": "Diamond",
      "rankDiv": 4,
      "rankImg": "url"
    }
  },
  "legends": {
    "selected": {
      "LegendName": "Wraith",
      "data": [
        { "name": "Kills", "value": 15000 },
        { "name": "Damage", "value": 5000000 }
      ]
    }
  }
}
```

---

### 5. Overwatch 2

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Blizzard Entertainment |
| **Platform** | PC, Xbox, PlayStation, Switch |

#### Official API

Blizzard **discontinued** the original Overwatch API. Overwatch 2 has **no public API**.

#### Authentication (N/A)

No official authentication available.

#### Alternative APIs

| Service | URL | Method | Status |
|---------|-----|--------|--------|
| **OverFast API** | https://overfast-api.tekrop.fr/ | REST | ✅ Active |
| **Ovrstat** | https://ovrstat.com/ | Scraping | ⚠️ Unreliable |
| **Tracker.gg** | https://tracker.gg/overwatch | API | ✅ Available |

#### OverFast API (Recommended)

```
Base URL: https://overfast-api.tekrop.fr/
Authentication: None required
Rate Limit: 30 requests/minute
Cost: Free (open source)
GitHub: https://github.com/TeKrop/overfast-api
```

**Note:** Requires player profile to be set to **public** in-game.

**Sample Request:**
```javascript
// URL encode the BattleTag (replace # with -)
const battletag = 'PlayerName-1234';

const response = await axios.get(
  `https://overfast-api.tekrop.fr/players/${battletag}/summary`
);
```

**Data Available:**
- ✅ Player level/endorsement
- ✅ Competitive ranks (all roles)
- ✅ Hero playtime
- ✅ Win rates
- ✅ K/D/A stats
- ⚠️ Requires public profile
- ❌ Match history not available

**Sample Response:**
```json
{
  "username": "PlayerName",
  "avatar": "url",
  "namecard": "url",
  "title": "Champion",
  "endorsement": {
    "level": 3,
    "frame": "url"
  },
  "competitive": {
    "pc": {
      "tank": { "division": "diamond", "tier": 2, "icon": "url" },
      "damage": { "division": "master", "tier": 5, "icon": "url" },
      "support": { "division": "platinum", "tier": 1, "icon": "url" }
    }
  }
}
```

---

### 6. Call of Duty (Warzone/MW)

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Activision |
| **Platform** | PC, Xbox, PlayStation |

#### Official API

Activision does **not** provide a public API. The internal API requires authentication via Activision account SSO.

#### Authentication

The unofficial method involves:
1. Logging into callofduty.com
2. Extracting auth cookies (ACT_SSO_COOKIE)
3. Using cookies for API requests

**⚠️ Warning:** This violates TOS and tokens expire frequently.

#### Alternative APIs

| Service | URL | Method | Status |
|---------|-----|--------|--------|
| **COD Tracker** | https://cod.tracker.gg/ | Web | ✅ For viewing |
| **wzstats.gg** | https://wzstats.gg/ | Web | ✅ For viewing |
| **CODAPI (Unofficial)** | npm packages | Auth bypass | ⚠️ Risky |

#### Tracker.gg COD API

```
Developer Portal: https://tracker.gg/developers
Authentication: API Key
Rate Limit: 30 requests/minute
Cost: Free tier, paid for more
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://public-api.tracker.gg/v2/warzone/standard/profile/atvi/PlayerName',
  {
    headers: {
      'TRN-Api-Key': process.env.TRACKER_GG_API_KEY
    }
  }
);
```

**Data Available (via Tracker.gg):**
- ✅ K/D ratio
- ✅ Win percentage
- ✅ Kills, deaths
- ✅ Matches played
- ⚠️ May not be real-time
- ❌ Match history limited

---

## Battle Royale

### 7. Fortnite

| Attribute | Details |
|-----------|---------|
| **API Status** | ⚠️ Internal API Only |
| **Publisher** | Epic Games |
| **Platform** | All platforms |

#### Official API

Epic Games does **not** provide a public Fortnite API. The internal API requires OAuth2 authentication using Epic credentials.

#### Authentication (Internal/Unofficial)

```
Method: OAuth2 (device auth flow)
Rate Limit: Unknown
TOS: Unauthorized API use violates TOS
```

#### Alternative APIs

| Service | URL | Method | Status |
|---------|-----|--------|--------|
| **FortniteAPI.io** | https://fortniteapi.io/ | API Key | ✅ Recommended |
| **Fortnite-API.com** | https://fortnite-api.com/ | API Key | ✅ Cosmetics/shop |
| **Tracker.gg** | https://tracker.gg/fortnite | API Key | ✅ Stats |

#### FortniteAPI.io (Recommended)

```
Developer Portal: https://fortniteapi.io/
Authentication: API Key
Rate Limit: 3 requests/second
Cost: Free tier (1000 req/day), paid plans available
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://fortniteapi.io/v1/stats',
  {
    params: {
      account: 'epic_username'
    },
    headers: {
      'Authorization': process.env.FORTNITE_API_KEY
    }
  }
);
```

**Data Available:**
- ✅ Overall stats (wins, kills, matches)
- ✅ Stats by mode (solo, duo, squad)
- ✅ Account level
- ✅ Battle Pass level
- ✅ Item shop (cosmetics)
- ✅ News and events
- ⚠️ Match history limited
- ⚠️ Competitive stats may be delayed

**Sample Response:**
```json
{
  "result": true,
  "account": {
    "id": "account_id",
    "name": "PlayerName"
  },
  "global_stats": {
    "solo": {
      "placetop1": 150,
      "kills": 5000,
      "matchesplayed": 2000,
      "winrate": 7.5,
      "kd": 2.78
    },
    "duo": { "..." },
    "squad": { "..." }
  }
}
```

---

### 8. PUBG

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official API Available |
| **Publisher** | Krafton |
| **Platform** | PC, Xbox, PlayStation, Mobile |

#### Official API

PUBG provides a **comprehensive official API** for developers.

#### Authentication

```
Method: API Key (JWT Bearer Token)
Developer Portal: https://developer.pubg.com/
Cost: Free
Rate Limits:
  - 10 requests/minute per API key
  - Varies by endpoint
```

#### Registration Process

1. Sign up at https://developer.pubg.com/
2. Create an app
3. Get API key immediately
4. No approval required

#### Key Endpoints

| Endpoint | Description | Rate Limit |
|----------|-------------|------------|
| `GET /shards/{shard}/players` | Search players | 10/min |
| `GET /shards/{shard}/players/{id}` | Player details | 10/min |
| `GET /shards/{shard}/players/{id}/seasons/{seasonId}` | Season stats | 10/min |
| `GET /shards/{shard}/matches/{id}` | Match details | 10/min |
| `GET /shards/{shard}/seasons` | List seasons | 10/min |
| `GET /shards/{shard}/leaderboards/{gameMode}/{seasonId}` | Leaderboards | 10/min |

**Shards:** `steam`, `kakao`, `psn`, `xbox`, `console`

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.pubg.com/shards/steam/players',
  {
    params: {
      'filter[playerNames]': 'PlayerName'
    },
    headers: {
      'Authorization': `Bearer ${process.env.PUBG_API_KEY}`,
      'Accept': 'application/vnd.api+json'
    }
  }
);
```

**Data Available:**
- ✅ Player profile and ID
- ✅ Season/lifetime stats
- ✅ Match history (last 14 days)
- ✅ Detailed match telemetry
- ✅ Leaderboards
- ✅ Ranked stats
- ✅ Weapon mastery

**Sample Response (Player Stats):**
```json
{
  "data": {
    "type": "playerSeason",
    "attributes": {
      "gameModeStats": {
        "solo": {
          "assists": 50,
          "boosts": 200,
          "dBNOs": 0,
          "dailyKills": 5,
          "damageDealt": 150000,
          "days": 100,
          "headshotKills": 500,
          "kills": 2000,
          "longestKill": 450.5,
          "losses": 1800,
          "maxKillStreaks": 15,
          "roundMostKills": 20,
          "roundsPlayed": 2000,
          "wins": 200
        }
      }
    }
  }
}
```

---

## MOBA

### 9. League of Legends

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official API Available |
| **Publisher** | Riot Games |
| **Platform** | PC |

#### Official API

Riot Games provides an **excellent official API** for League of Legends.

#### Authentication

```
Method: API Key
Developer Portal: https://developer.riotgames.com/
Cost: Free
Rate Limits:
  - Development: 20 requests/second, 100 requests/2 minutes
  - Production: Varies by app (500-3000+ requests/10sec)
```

#### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /lol/summoner/v4/summoners/by-name/{name}` | Summoner by name |
| `GET /lol/summoner/v4/summoners/by-puuid/{puuid}` | Summoner by PUUID |
| `GET /lol/league/v4/entries/by-summoner/{id}` | Ranked stats |
| `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` | Match history |
| `GET /lol/match/v5/matches/{matchId}` | Match details |
| `GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}` | Champion mastery |

**Regions:** `br1`, `eun1`, `euw1`, `jp1`, `kr`, `la1`, `la2`, `na1`, `oc1`, `tr1`, `ru`, `ph2`, `sg2`, `th2`, `tw2`, `vn2`

**Sample Request:**
```javascript
const response = await axios.get(
  `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent('PlayerName')}`,
  {
    headers: {
      'X-Riot-Token': process.env.RIOT_API_KEY
    }
  }
);
```

**Data Available:**
- ✅ Summoner profile
- ✅ Ranked stats (all queues)
- ✅ Match history (unlimited)
- ✅ Match details & timeline
- ✅ Champion mastery
- ✅ Live game data
- ✅ Clash tournaments
- ✅ Challenges

**Sample Response (Ranked):**
```json
[
  {
    "leagueId": "xxx",
    "queueType": "RANKED_SOLO_5x5",
    "tier": "DIAMOND",
    "rank": "IV",
    "summonerId": "xxx",
    "summonerName": "PlayerName",
    "leaguePoints": 75,
    "wins": 150,
    "losses": 120,
    "veteran": false,
    "inactive": false,
    "freshBlood": false,
    "hotStreak": true
  }
]
```

#### Alternative APIs

| Service | URL | Notes |
|---------|-----|-------|
| **OP.GG** | https://op.gg/ | Best UI, no public API |
| **U.GG** | https://u.gg/ | Meta stats, no API |
| **League of Graphs** | https://www.leagueofgraphs.com/ | Statistics |

---

### 10. Dota 2

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official + Community APIs |
| **Publisher** | Valve |
| **Platform** | PC (Steam) |

#### Official API (Steam Web API)

```
Method: API Key
Developer Portal: https://steamcommunity.com/dev/apikey
Cost: Free
Rate Limit: 100,000 requests/day
```

#### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /IDOTA2Match_570/GetMatchHistory/v1/` | Match history |
| `GET /IDOTA2Match_570/GetMatchDetails/v1/` | Match details |
| `GET /IEconDOTA2_570/GetHeroes/v1/` | Hero list |
| `GET /IDOTA2Match_570/GetLiveLeagueGames/v1/` | Live pro matches |

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/',
  {
    params: {
      key: process.env.STEAM_API_KEY,
      account_id: 'player_account_id'
    }
  }
);
```

#### OpenDota API (Recommended)

```
Base URL: https://api.opendota.com/api
Authentication: Optional API key (higher limits)
Rate Limit: 60 requests/minute (free), 1200/min (key)
Cost: Free tier, $4.99/month for premium
Docs: https://docs.opendota.com/
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.opendota.com/api/players/account_id'
);
```

**Data Available:**
- ✅ Player profile & MMR
- ✅ Match history
- ✅ Hero statistics
- ✅ Win/Loss by hero
- ✅ Recent matches
- ✅ Word cloud (all-chat)
- ✅ Peers (frequent teammates)
- ✅ Pro match data

**Sample Response:**
```json
{
  "profile": {
    "account_id": 123456789,
    "personaname": "PlayerName",
    "avatar": "url",
    "steamid": "76561198xxx"
  },
  "rank_tier": 75,
  "leaderboard_rank": null,
  "mmr_estimate": {
    "estimate": 5500
  }
}
```

#### Alternative: STRATZ API

```
Base URL: https://api.stratz.com/graphql
Authentication: Bearer Token
Type: GraphQL
Docs: https://docs.stratz.com/
```

---

### 11. Teamfight Tactics (TFT)

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official API Available |
| **Publisher** | Riot Games |
| **Platform** | PC, Mobile |

#### Official API

Part of the Riot Games API ecosystem.

#### Authentication

```
Method: API Key
Developer Portal: https://developer.riotgames.com/
Cost: Free
Rate Limits: Same as LoL API
```

#### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /tft/summoner/v1/summoners/by-name/{name}` | Summoner info |
| `GET /tft/league/v1/entries/by-summoner/{id}` | Ranked stats |
| `GET /tft/match/v1/matches/by-puuid/{puuid}/ids` | Match IDs |
| `GET /tft/match/v1/matches/{matchId}` | Match details |

**Sample Request:**
```javascript
const response = await axios.get(
  `https://br1.api.riotgames.com/tft/league/v1/entries/by-summoner/${summonerId}`,
  {
    headers: {
      'X-Riot-Token': process.env.RIOT_API_KEY
    }
  }
);
```

**Data Available:**
- ✅ Ranked tier/division
- ✅ LP and games played
- ✅ Match history
- ✅ Placement per match
- ✅ Composition used
- ✅ Items built
- ✅ Augments selected

**Sample Response:**
```json
[
  {
    "queueType": "RANKED_TFT",
    "tier": "MASTER",
    "rank": "I",
    "leaguePoints": 200,
    "wins": 80,
    "losses": 60
  }
]
```

---

## Gaming Platforms

### 12. Steam

| Attribute | Details |
|-----------|---------|
| **API Status** | ✅ Official API Available |
| **Publisher** | Valve |
| **Cost** | Free |

#### Authentication

```
Method: API Key
Developer Portal: https://steamcommunity.com/dev/apikey
Rate Limit: 100,000 requests/day
```

#### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `ISteamUser` | Player profiles, friends |
| `IPlayerService` | Owned games, playtime |
| `ISteamUserStats` | Game achievements, stats |
| `ISteamNews` | Game news |

#### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /ISteamUser/GetPlayerSummaries/v2/` | Player profile |
| `GET /IPlayerService/GetOwnedGames/v1/` | Owned games |
| `GET /IPlayerService/GetRecentlyPlayedGames/v1/` | Recent games |
| `GET /ISteamUserStats/GetUserStatsForGame/v2/` | Game stats |
| `GET /ISteamUserStats/GetPlayerAchievements/v1/` | Achievements |
| `GET /ISteamUser/GetFriendList/v1/` | Friends list |

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
  {
    params: {
      key: process.env.STEAM_API_KEY,
      steamids: '76561198012345678'
    }
  }
);
```

**Data Available:**
- ✅ Profile info (name, avatar, status)
- ✅ Owned games list
- ✅ Playtime per game
- ✅ Recent activity
- ✅ Achievement progress
- ✅ Game-specific stats
- ✅ Friends list (if public)
- ✅ Game news

**Sample Response:**
```json
{
  "response": {
    "players": [
      {
        "steamid": "76561198012345678",
        "personaname": "PlayerName",
        "profileurl": "https://steamcommunity.com/id/player/",
        "avatar": "url",
        "avatarmedium": "url",
        "avatarfull": "url",
        "personastate": 1,
        "communityvisibilitystate": 3,
        "lastlogoff": 1708000000,
        "gameextrainfo": "Counter-Strike 2",
        "gameid": "730"
      }
    ]
  }
}
```

---

### 13. Xbox Live

| Attribute | Details |
|-----------|---------|
| **API Status** | ⚠️ Limited Public Access |
| **Publisher** | Microsoft |
| **Cost** | Varies |

#### Official API (Azure PlayFab)

Microsoft provides Xbox services through **Azure PlayFab** for registered developers.

```
Developer Portal: https://developer.microsoft.com/en-us/games/xbox
Alternatives: https://playfab.com/
Authentication: OAuth2 (Xbox Live)
Status: Partner program required for full access
```

#### Limited Public Access

Microsoft Graph API provides **basic Xbox profile info** for authenticated users.

```
API: Microsoft Graph API
Endpoint: https://graph.microsoft.com/beta/me/profile
Auth: Azure AD OAuth2
Scope: User.Read, XboxLive.SignIn
```

#### Alternative APIs

| Service | URL | Method |
|---------|-----|--------|
| **OpenXBL** | https://xbl.io/ | API Key |
| **XAPI** | https://xapi.us/ | Deprecated |

#### OpenXBL (Recommended)

```
Developer Portal: https://xbl.io/
Authentication: API Key
Rate Limit: 50 requests/hour (free), more on paid
Cost: Free tier, $5/month for more
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://xbl.io/api/v2/player/summary',
  {
    headers: {
      'X-Authorization': process.env.OPENXBL_API_KEY
    },
    params: {
      gamertag: 'PlayerGamertag'
    }
  }
);
```

**Data Available:**
- ✅ Gamertag and profile
- ✅ Gamerscore
- ✅ Recent games
- ✅ Achievement progress
- ✅ Presence (online/offline)
- ⚠️ Rate limited

---

### 14. PlayStation Network (PSN)

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Sony |
| **Platform** | PlayStation 4/5 |

#### Official API

Sony does **not** provide a public API for PSN. Developer access requires:
- PlayStation Partners program membership
- NDAs and contracts

#### Alternative APIs

| Service | URL | Method |
|---------|-----|--------|
| **PSNProfiles** | https://psnprofiles.com/ | Scraping |
| **Unofficial PSN API** | npm: psn-api | Auth bypass |

#### PSN-API (Unofficial Node.js Library)

```
npm: psn-api
GitHub: https://github.com/achievements-app/psn-api
Auth: NPSSO token (from browser)
Stability: Works but may break
```

**Sample Usage:**
```javascript
import { 
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName 
} from 'psn-api';

// Get NPSSO from browser cookies after PlayStation login
const npsso = process.env.PSN_NPSSO;
const authCode = await exchangeNpssoForCode(npsso);
const auth = await exchangeCodeForAccessToken(authCode);

const profile = await getProfileFromUserName(auth, 'PlayerName');
```

**Data Available:**
- ✅ Profile info
- ✅ Trophy list
- ✅ Trophy progress
- ⚠️ Requires manual NPSSO refresh
- ⚠️ May violate TOS

---

### 15. Nintendo

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Public API |
| **Publisher** | Nintendo |
| **Platform** | Nintendo Switch |

#### Official API

Nintendo provides **no public API** whatsoever. All stats services require:
- Nintendo Developer Program membership
- Console-level integration

#### Alternative Methods

| Method | Viability | Data |
|--------|-----------|------|
| **NSO App scraping** | ⚠️ Difficult | Splatoon 3, Smash stats |
| **SplatNet 3** | ⚠️ Unofficial | Splatoon 3 stats |
| **stat.ink** | ✅ Community | Splatoon history |

#### stat.ink (Splatoon Only)

```
Base URL: https://stat.ink/api/v3/
Authentication: Personal API key
Cost: Free
```

**Note:** Users must manually upload their data or use tools like s3s.

---

### 16. Epic Games

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Public Stats API |
| **Publisher** | Epic Games |
| **Platform** | PC, Consoles |

#### Official API

Epic provides **no public API** for player stats. The Epic Games Store has a catalog API but no player data.

#### Epic Online Services (EOS)

```
Portal: https://dev.epicgames.com/portal
Status: Game developer integration only
Use: For integrating EOS into your own game
```

#### Launcher/Store API

Basic Epic launcher APIs exist but require authentication:

```javascript
// Unofficial - OAuth2 via device code
const auth = await axios.post('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token', {
  grant_type: 'device_auth',
  // ... credentials
});
```

**⚠️ This violates TOS and is not recommended.**

#### Alternatives

| Game | Alternative |
|------|-------------|
| Fortnite | FortniteAPI.io |
| Rocket League | Tracker.gg, calculated.gg |
| Fall Guys | Community trackers |

---

## Other Games

### 17. Rocket League

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Psyonix / Epic Games |
| **Platform** | PC, Xbox, PlayStation, Switch |

#### Official API

Psyonix does **not** provide a public API. Internal APIs require authentication.

#### Alternative APIs

| Service | URL | Method | Status |
|---------|-----|--------|--------|
| **Tracker.gg** | https://rocketleague.tracker.network/ | API | ✅ Best option |
| **Calculated.gg** | https://calculated.gg/ | Replay analysis | ✅ Replay data |
| **Ballchasing** | https://ballchasing.com/ | Replay API | ✅ Community |

#### Tracker.gg Rocket League API

```
Developer Portal: https://tracker.gg/developers
Authentication: API Key
Rate Limit: 30 requests/minute
Cost: Free tier available
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://public-api.tracker.gg/v2/rocket-league/standard/profile/epic/PlayerName',
  {
    headers: {
      'TRN-Api-Key': process.env.TRACKER_GG_API_KEY
    }
  }
);
```

**Data Available:**
- ✅ Competitive ranks (all playlists)
- ✅ MMR history
- ✅ Win/Loss stats
- ✅ Goals, assists, saves
- ✅ MVP awards
- ⚠️ Match history limited

**Sample Response:**
```json
{
  "data": {
    "platformInfo": {
      "platformSlug": "epic",
      "platformUserHandle": "PlayerName"
    },
    "segments": [
      {
        "type": "playlist",
        "metadata": {
          "name": "Ranked Doubles 2v2"
        },
        "stats": {
          "tier": { "value": 19, "displayValue": "Champion III" },
          "division": { "value": 2, "displayValue": "Div. II" },
          "rating": { "value": 1400, "displayValue": "1,400" },
          "wins": { "value": 500 }
        }
      }
    ]
  }
}
```

#### Ballchasing.com API

```
Base URL: https://ballchasing.com/api
Authentication: API Key (from profile)
Rate Limit: 1000 requests/hour
Cost: Free
Use: Upload and analyze replays
```

---

### 18. Minecraft

| Attribute | Details |
|-----------|---------|
| **API Status** | ⚠️ Limited Official APIs |
| **Publisher** | Microsoft / Mojang |
| **Platform** | All platforms |

#### Mojang API

```
Base URL: https://api.mojang.com
Authentication: None required for basic queries
Rate Limit: 600 requests/10 minutes
Cost: Free
```

#### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /users/profiles/minecraft/{username}` | UUID lookup |
| `GET /user/profile/{uuid}` | Profile + skin |
| `GET /session/minecraft/profile/{uuid}` | Session profile |

**Sample Request:**
```javascript
// Get UUID from username
const response = await axios.get(
  `https://api.mojang.com/users/profiles/minecraft/${username}`
);

// Get profile with skin
const profile = await axios.get(
  `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
);
```

**Data Available:**
- ✅ UUID
- ✅ Username history
- ✅ Skin/Cape
- ❌ No gameplay stats (vanilla)
- ❌ No server stats

#### Server-Specific Stats

Minecraft stats depend on the server. Popular servers have APIs:

| Server | API |
|--------|-----|
| **Hypixel** | https://api.hypixel.net/ |
| **Wynncraft** | https://api.wynncraft.com/ |
| **Mineplex** | No public API |

#### Hypixel API

```
Base URL: https://api.hypixel.net/
Authentication: API Key (get in-game: /api new)
Rate Limit: 120 requests/minute
Cost: Free
```

**Sample Request:**
```javascript
const response = await axios.get(
  'https://api.hypixel.net/player',
  {
    params: {
      key: process.env.HYPIXEL_API_KEY,
      uuid: 'player-uuid'
    }
  }
);
```

**Data Available (Hypixel):**
- ✅ Network level
- ✅ Karma
- ✅ Game-specific stats (Bedwars, Skywars, etc.)
- ✅ Guild info
- ✅ Achievements

---

### 19. EA FC (FIFA)

| Attribute | Details |
|-----------|---------|
| **API Status** | ❌ No Official Public API |
| **Publisher** | Electronic Arts |
| **Platform** | PC, Xbox, PlayStation |

#### Official API

EA does **not** provide a public API for FIFA/EA FC. The internal API (Companion App) is protected.

#### Alternative Methods

| Service | URL | Data |
|---------|-----|------|
| **FUTBIN** | https://www.futbin.com/ | Player DB, prices |
| **FUTWIZ** | https://www.futwiz.com/ | Player DB |
| **Tracker.gg** | No EA FC support | - |

#### FUTBIN API (Unofficial)

FUTBIN has no official API, but data can be scraped:

```javascript
// Player database (scraping)
const response = await axios.get(
  'https://www.futbin.com/24/player/123/player-name'
);
// Parse HTML for stats
```

#### EA API (Internal - Not Recommended)

The Companion App API requires:
1. Origin authentication
2. 2FA bypass
3. Endpoint discovery

**⚠️ Violates TOS and will result in bans.**

**Data Available (Community Sites):**
- ✅ Player card database
- ✅ Market prices
- ✅ SBC solutions
- ❌ Personal stats unavailable
- ❌ Match history unavailable

---

## Third-Party Aggregators

### Tracker.gg

| Attribute | Details |
|-----------|---------|
| **URL** | https://tracker.gg/developers |
| **Cost** | Free tier + paid plans |
| **Rate Limit** | 30 req/min (free) |

**Supported Games:**
- Apex Legends
- Call of Duty (Warzone, MW, CW)
- Counter-Strike 2
- Destiny 2
- Division 2
- Fall Guys
- Fortnite
- Halo Infinite
- Hyper Scape
- Overwatch 2
- Rainbow Six Siege
- Rocket League
- Splitgate
- The Finals
- Valorant

**Authentication:**
```javascript
headers: {
  'TRN-Api-Key': 'your-api-key'
}
```

---

### Overwolf Developer Platform

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.overwolf.com/developers |
| **Method** | Desktop app integration |
| **Data** | Real-time game events |

Overwolf provides real-time game events through their desktop platform. Useful for live tracking.

---

## Implementation Recommendations

### Priority Tiers for StatForge

#### Tier 1: Official APIs (Best Support)
| Game | API | Reliability |
|------|-----|-------------|
| League of Legends | Riot API | ⭐⭐⭐⭐⭐ |
| Valorant | Riot API | ⭐⭐⭐⭐⭐ |
| TFT | Riot API | ⭐⭐⭐⭐⭐ |
| PUBG | Official API | ⭐⭐⭐⭐⭐ |
| Dota 2 | OpenDota | ⭐⭐⭐⭐⭐ |
| Steam | Steam API | ⭐⭐⭐⭐⭐ |

#### Tier 2: Good Unofficial APIs
| Game | API | Reliability |
|------|-----|-------------|
| Fortnite | FortniteAPI.io | ⭐⭐⭐⭐ |
| Apex Legends | Mozambique Here | ⭐⭐⭐⭐ |
| CS2 | Tracker.gg + FACEIT | ⭐⭐⭐⭐ |
| Rocket League | Tracker.gg | ⭐⭐⭐⭐ |
| R6 Siege | Tracker.gg | ⭐⭐⭐⭐ |
| Overwatch 2 | OverFast API | ⭐⭐⭐⭐ |
| Xbox | OpenXBL | ⭐⭐⭐⭐ |

#### Tier 3: Limited/Risky
| Game | Method | Reliability |
|------|--------|-------------|
| Call of Duty | Tracker.gg | ⭐⭐⭐ |
| Minecraft (Hypixel) | Hypixel API | ⭐⭐⭐ |
| PSN | psn-api (unofficial) | ⭐⭐ |

#### Tier 4: Not Recommended
| Platform | Reason |
|----------|--------|
| Nintendo | No viable API |
| EA FC | No public data |
| Epic Games (general) | TOS violations required |

---

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     StatForge Service                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Rate Limiter │  │   Cache      │  │  Queue       │       │
│  │  (Redis)     │  │  (Redis)     │  │  (Bull)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Provider Layer (Adapters)                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  RiotProvider   │  SteamProvider  │  TrackerGGProvider │ │
│  │  PUBGProvider   │  OpenDotaProvider │  FortniteProvider │ │
│  │  ApexProvider   │  XboxProvider   │  OverwatchProvider │ │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

```env
# Riot Games (LoL, Valorant, TFT)
RIOT_API_KEY=RGAPI-xxx

# Steam (CS2, Dota 2)
STEAM_API_KEY=xxx

# Tracker.gg (Multi-game fallback)
TRACKER_GG_API_KEY=xxx

# FACEIT (CS2 competitive)
FACEIT_API_KEY=xxx

# PUBG
PUBG_API_KEY=xxx

# Fortnite
FORTNITE_API_KEY=xxx

# Apex Legends
APEX_API_KEY=xxx

# Xbox
OPENXBL_API_KEY=xxx

# Minecraft (Hypixel)
HYPIXEL_API_KEY=xxx
```

### Caching Strategy

```typescript
// Recommended cache TTL by data type
const CACHE_TTL = {
  playerProfile: 60 * 15,        // 15 minutes
  rankedStats: 60 * 5,           // 5 minutes
  matchHistory: 60 * 2,          // 2 minutes
  leaderboards: 60 * 60,         // 1 hour
  staticContent: 60 * 60 * 24,   // 24 hours (heroes, maps, etc.)
};
```

---

## Legal Considerations

### Terms of Service Compliance

| API | Commercial Use | Attribution Required | TOS Link |
|-----|----------------|---------------------|----------|
| Riot Games | ✅ With approval | ✅ Yes | [Riot Developer Policies](https://developer.riotgames.com/policies.html) |
| Steam | ✅ Yes | ⚠️ Recommended | [Steam API TOS](https://steamcommunity.com/dev/apiterms) |
| PUBG | ✅ Yes | ✅ Yes | [PUBG API TOS](https://developer.pubg.com/tos) |
| Tracker.gg | ✅ With plan | ⚠️ Check terms | Contact directly |
| OpenDota | ✅ Yes | ✅ Yes | [OpenDota TOS](https://docs.opendota.com/) |

### Attribution Examples

```html
<!-- Riot Games -->
<p>Data provided by Riot Games API. 
   This product is not endorsed by Riot Games.</p>

<!-- Steam -->
<p>Powered by Steam. Valve and Steam are trademarks 
   of Valve Corporation.</p>

<!-- PUBG -->
<p>Data provided by PUBG Corporation.</p>
```

---

## Appendix: API Response Normalization

### Unified Player Stats Interface

```typescript
interface StatForgePlayer {
  // Identity
  id: string;
  username: string;
  platform: 'pc' | 'xbox' | 'playstation' | 'switch' | 'mobile';
  avatarUrl?: string;
  
  // Game-specific
  game: GameType;
  region?: string;
  
  // Stats (normalized)
  stats: {
    general: {
      level?: number;
      playtime?: number; // minutes
      lastOnline?: Date;
    };
    competitive?: {
      rank?: string;
      rankTier?: number;
      rankDivision?: number;
      rating?: number;
      peakRating?: number;
    };
    performance?: {
      wins?: number;
      losses?: number;
      winRate?: number;
      kills?: number;
      deaths?: number;
      assists?: number;
      kdRatio?: number;
    };
  };
  
  // Meta
  lastUpdated: Date;
  dataSource: string;
}

type GameType = 
  | 'lol' | 'valorant' | 'tft'
  | 'cs2' | 'r6siege' | 'apex' | 'overwatch' | 'cod'
  | 'fortnite' | 'pubg'
  | 'dota2' | 'rocketleague' | 'minecraft';
```

---

## Summary Matrix

| Game | Official API | Best Alternative | Auth | Cost | Data Quality |
|------|--------------|------------------|------|------|--------------|
| R6 Siege | ❌ | Tracker.gg | API Key | Free+ | ⭐⭐⭐⭐ |
| CS2 | ⚠️ Steam | Tracker.gg/FACEIT | API Key | Free | ⭐⭐⭐⭐ |
| Valorant | ✅ Riot | Henrik API | API Key | Free | ⭐⭐⭐⭐⭐ |
| Apex | ⚠️ EA | Mozambique Here | API Key | Free+ | ⭐⭐⭐⭐ |
| Overwatch 2 | ❌ | OverFast API | None | Free | ⭐⭐⭐ |
| CoD | ❌ | Tracker.gg | API Key | Free+ | ⭐⭐⭐ |
| Fortnite | ❌ | FortniteAPI.io | API Key | Free+ | ⭐⭐⭐⭐ |
| PUBG | ✅ | - | API Key | Free | ⭐⭐⭐⭐⭐ |
| LoL | ✅ Riot | - | API Key | Free | ⭐⭐⭐⭐⭐ |
| Dota 2 | ✅ Steam | OpenDota | API Key | Free | ⭐⭐⭐⭐⭐ |
| TFT | ✅ Riot | - | API Key | Free | ⭐⭐⭐⭐⭐ |
| Steam | ✅ | - | API Key | Free | ⭐⭐⭐⭐⭐ |
| Xbox | ⚠️ | OpenXBL | API Key | Free+ | ⭐⭐⭐ |
| PSN | ❌ | psn-api | Manual token | Free | ⭐⭐ |
| Nintendo | ❌ | N/A | - | - | ❌ |
| Epic | ❌ | Per-game | - | - | ❌ |
| Rocket League | ❌ | Tracker.gg | API Key | Free+ | ⭐⭐⭐⭐ |
| Minecraft | ⚠️ Mojang | Hypixel API | API Key | Free | ⭐⭐⭐ |
| EA FC | ❌ | N/A | - | - | ❌ |

---

*Document generated for Magazine SRT - StatForge Feature*  
*For implementation support, see the project's backend services documentation.*
