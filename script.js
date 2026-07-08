let cachedVersion = null;
let runesData = null;
let arenaAugmentsData = null;

async function getLatestLeagueVersion() {
    if (cachedVersion) return cachedVersion;
    try {
        const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await res.json();
        cachedVersion = versions[0];
        return cachedVersion;
    } catch (err) {
        console.error("Failed to get latest League version:", err);
        return "15.15.1";
    }
}

async function fetchRunesData() {
    if (runesData) return runesData;
    const version = await getLatestLeagueVersion();
    try {
        const runeRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`);
        runesData = await runeRes.json();
        return runesData;
    } catch (err) {
        console.error("Failed to fetch rune data:", err);
        return null;
    }
}

async function fetchArenaAugmentsData() {
    if (arenaAugmentsData) return arenaAugmentsData;
    const version = await getLatestLeagueVersion();
    try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/arenaaugments.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        arenaAugmentsData = json;
        return arenaAugmentsData;
    } catch (err) {
        console.error("Failed to fetch arena augments data:", err);
        arenaAugmentsData = {};
        return null;
    }
}

function getRuneIconUrl(runeId) {
    if (!runesData) return null;
    for (const tree of runesData) {
        for (const slot of tree.slots) {
            const foundRune = slot.runes.find(rune => rune.id === runeId);
            if (foundRune) {
                return `https://ddragon.leagueoflegends.com/cdn/img/${foundRune.icon}`;
            }
        }
        const foundBonusRune = tree.runes?.find(rune => rune.id === runeId);
        if (foundBonusRune) {
            return `https://ddragon.leagueoflegends.com/cdn/img/${foundBonusRune.icon}`;
        }
    }
    return null;
}

function getSecondaryTreeIcon(styleId) {
    if (!runesData) return null;
    const tree = runesData.find(t => t.id === styleId);
    if (tree && tree.icon) {
        return `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`;
    }
    return null;
}

function getAugmentIconUrl(augmentId, version) {
    if (!arenaAugmentsData) return null;
    const augment = arenaAugmentsData.data?.[augmentId];
    if (augment && augment.icon) {
        return `https://ddragon.leagueoflegends.com/cdn/${version}/img/misc/${augment.icon}`;
    }
    return null;
}

// Normalize champion names to match DDragon
function normalizeChampionName(name) {
    const mappings = {
        "FiddleSticks": "Fiddlesticks",
        "MonkeyKing": "Wukong",
    };
    return mappings[name] || name;
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setProfileHistory(gameName, tag, region, mode) {
    const state = { gameName, tag, region };
    const url = new URL(window.location.href);
    url.searchParams.set('gameName', gameName);
    url.searchParams.set('tag', tag);
    url.searchParams.set('region', region);

    if (mode === 'push') {
        history.pushState(state, '', url);
    } else if (mode === 'replace') {
        history.replaceState(state, '', url);
    }
}

function clearProfileHistory() {
    const url = new URL(window.location.href);
    url.searchParams.delete('gameName');
    url.searchParams.delete('tag');
    url.searchParams.delete('region');
    history.replaceState(null, '', url.pathname + url.search);
}

function initProfileFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const gameName = params.get('gameName');
    const tag = params.get('tag');
    const region = params.get('region');
    if (!gameName || !tag) return;

    if (region) document.getElementById('regionSelect').value = region;
    document.getElementById('riotId').value = `${gameName}#${tag}`;
    fetchAccount(`${gameName}#${tag}`, { historyMode: 'replace' });
}

async function fetchAccount(riotIdOverride, options = {}) {
    const { historyMode = 'push' } = options;
    const riotId = (riotIdOverride ?? document.getElementById("riotId").value).trim();
    if (riotIdOverride) {
        document.getElementById("riotId").value = riotId;
    }
    const region = document.getElementById("regionSelect").value;
    const resultDiv = document.getElementById("result");

    if (!riotId) {
        resultDiv.innerHTML = '<div class="message-box message-box--info">Please enter a Riot ID (e.g. Name#Tag).</div>';
        return;
    }

    let [name, tag] = riotId.split('#');
    if (!tag) {
        resultDiv.innerHTML = '<div class="message-box message-box--info">Invalid format. Use Name#Tag (e.g. cielak0#123).</div>';
        return;
    }
    name = name.trim();
    tag = tag.trim();

    resultDiv.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Fetching summoner data…</span>
        </div>
    `;

    try {
        await fetchRunesData();
        await fetchArenaAugmentsData();

        const response = await fetch(`http://localhost:8080/api/account/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = `<div class="message-box message-box--error">${data.error}</div>`;
            return;
        }

        const summonerResponse = await fetch(`http://localhost:8080/api/summoner/${region}/${data.puuid}`);
        const summonerData = await summonerResponse.json();

        if (summonerData.error) {
            resultDiv.innerHTML = `<div class="message-box message-box--error">${summonerData.error}</div>`;
            return;
        }

        let soloRankedEntry = null;
        let flexRankedEntry = null;
        if (summonerData.id) {
            try {
                const leagueRes = await fetch(`http://localhost:8080/api/league/${region}/${encodeURIComponent(summonerData.id)}`);
                const leagueEntries = await leagueRes.json();
                if (Array.isArray(leagueEntries)) {
                    soloRankedEntry = leagueEntries.find(e => e.queueType === 'RANKED_SOLO_5x5') || null;
                    flexRankedEntry = leagueEntries.find(e => e.queueType === 'RANKED_FLEX_5x5') || null;
                }
            } catch (e) {
                console.warn('League fetch failed', e);
            }
        }

        const profileIconId = summonerData.profileIconId;
        const summonerLevel = summonerData.summonerLevel;
        const leagueVersion = await getLatestLeagueVersion();

        resultDiv.innerHTML = `
            <div class="profile-card">
                <div class="profile-icon-wrapper">
                    <img src="https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/profileicon/${profileIconId}.png" alt="Profile Icon" class="profile-icon">
                    <div class="summoner-level">${summonerLevel}</div>
                </div>
                <div class="profile-info">
                    <h2>${data.gameName}<span class="profile-tag">#${data.tagLine}</span></h2>
                    <span class="profile-region">${getRegionLabel(region)}</span>
                </div>
            </div>
        `;

        const matchRes = await fetch(`http://localhost:8080/api/matches/${region}/${data.puuid}`);
        const matches = await matchRes.json();
        const overallStats = calculateOverallStats(matches, data.puuid);
        const championStats = calculateChampionStats(matches, data.puuid);
        const roleStats = calculateRoleStats(matches, data.puuid);
        const playedWithStats = calculatePlayedWithStats(matches, data.puuid);

        resultDiv.innerHTML += `
            <div class="profile-body">
                <aside class="profile-sidebar">
                    ${renderRankedSoloHTML(soloRankedEntry, leagueVersion)}
                    ${renderChampionPerformanceHTML(championStats, leagueVersion)}
                    ${renderRolePerformanceHTML(roleStats)}
                    ${renderPlayedWithHTML(playedWithStats)}
                </aside>
                <div class="profile-main">
            <div class="overall-performance">
                <h3>Overall Performance (Last 20 Games)</h3>
                <div class="performance-layout">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.avgScore}</div>
                        <div class="stat-label">Average Score</div>
                        <div class="stat-grade ${getGradeClass(overallStats.avgScore)}">${getGrade(overallStats.avgScore)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.winRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.avgKDA}</div>
                        <div class="stat-label">Avg KDA</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.avgCS}</div>
                        <div class="stat-label">Avg CS/min</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.avgKP}%</div>
                        <div class="stat-label">Avg Kill Participation</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.avgGoldPerMin}</div>
                        <div class="stat-label">Gold / min</div>
                    </div>
                </div>
                    <div class="radar-panel">
                        <h4 class="radar-panel-title">vs Challenger benchmark</h4>
                        <p class="radar-panel-subtitle">Outer ring = Challenger average · ${overallStats.totalGames} games analyzed</p>
                        <div id="performance-radar" class="radar-chart"></div>
                    </div>
                </div>
            </div>
            <section class="matches-section">
                <h2 class="section-title">Recent Matches</h2>
                <div class="match-list"></div>
            </section>
                </div>
            </div>
        `;

        const radarEl = document.getElementById('performance-radar');
        if (radarEl && overallStats.totalGames > 0) {
            renderPerformanceRadar(radarEl, overallStats.radar);
        } else if (radarEl) {
            radarEl.innerHTML = '<p class="radar-empty">Not enough ranked games to chart (remakes excluded).</p>';
        }

        const matchListDiv = document.querySelector('.match-list');
        const sortedMatches = [...matches]
            .filter(m => m.info && m.info.participants.some(p => p.puuid === data.puuid))
            .sort((a, b) => (b.info.gameCreation || 0) - (a.info.gameCreation || 0));

        let lastDayKey = null;
        for (const match of sortedMatches) {
            const info = match.info;
            const player = info.participants.find(p => p.puuid === data.puuid);
            if (!player) continue;

            const dayKey = getLocalDateKey(info.gameCreation);
            if (dayKey !== lastDayKey) {
                matchListDiv.innerHTML += renderMatchDayHeader(info.gameCreation);
                lastDayKey = dayKey;
            }

            const matchScore = calculateMatchScore(player, info);
            const matchHTML = getMatchHTML(player, info, leagueVersion, matchScore, data.puuid, soloRankedEntry, flexRankedEntry);
            matchListDiv.innerHTML += matchHTML;
        }

        if (historyMode !== 'none') {
            setProfileHistory(data.gameName, data.tagLine, region, historyMode);
        }

    } catch (err) {
        console.error("Fetch error:", err);
        resultDiv.innerHTML = '<div class="message-box message-box--error">Something went wrong while fetching your data. Is the server running?</div>';
    }
}

function getRegionLabel(regionCode) {
    const labels = {
        EUW1: 'Europe West', NA1: 'North America', KR: 'Korea', EUN1: 'Europe Nordic & East',
        BR1: 'Brazil', JP1: 'Japan', TR1: 'Turkey'
    };
    return labels[regionCode] || regionCode;
}

document.getElementById('result').addEventListener('click', (e) => {
    const summonerLink = e.target.closest('.summoner-link');
    if (summonerLink) {
        e.preventDefault();
        e.stopPropagation();
        const gameName = summonerLink.dataset.gameName;
        const tagLine = summonerLink.dataset.tagLine;
        if (gameName && tagLine) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            fetchAccount(`${gameName}#${tagLine}`, { historyMode: 'push' });
        }
        return;
    }

    const header = e.target.closest('.match-header');
    if (!header) return;
    header.closest('.match-container')?.classList.toggle('expanded');
});

window.addEventListener('popstate', (event) => {
    if (event.state?.gameName && event.state?.tag) {
        document.getElementById('regionSelect').value = event.state.region || 'EUW1';
        document.getElementById('riotId').value = `${event.state.gameName}#${event.state.tag}`;
        fetchAccount(`${event.state.gameName}#${event.state.tag}`, { historyMode: 'none' });
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const gameName = params.get('gameName');
    const tag = params.get('tag');
    if (gameName && tag) {
        const region = params.get('region') || 'EUW1';
        document.getElementById('regionSelect').value = region;
        document.getElementById('riotId').value = `${gameName}#${tag}`;
        fetchAccount(`${gameName}#${tag}`, { historyMode: 'none' });
        return;
    }

    document.getElementById('result').innerHTML = '';
    clearProfileHistory();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileFromUrl);
} else {
    initProfileFromUrl();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        fetchAccount(undefined, { historyMode: 'push' });
    }
}

const ROLE_CONFIG = {
    TOP: { label: 'TOP', icon: 'TopLane.png', order: 0 },
    JUNGLE: { label: 'JUNGLE', icon: 'Jungle.png', order: 1 },
    MID: { label: 'MID', icon: 'MidLane.png', order: 2 },
    ADC: { label: 'ADC', icon: 'BotLane.png', order: 3 },
    SUPPORT: { label: 'SUPPORT', icon: 'Support.png', order: 4 }
};

function mapTeamPositionToRole(teamPosition) {
    const map = {
        TOP: 'TOP',
        JUNGLE: 'JUNGLE',
        MIDDLE: 'MID',
        MID: 'MID',
        BOTTOM: 'ADC',
        UTILITY: 'SUPPORT'
    };
    return map[teamPosition] || null;
}

function getWinRateClass(winRate) {
    if (winRate >= 60) return 'insight-wr--gold';
    if (winRate >= 50) return 'insight-wr--good';
    return 'insight-wr--low';
}

function iteratePlayerMatches(matches, puuid, callback) {
    matches.forEach(match => {
        const info = match.info;
        const player = info.participants.find(p => p.puuid === puuid);
        if (!player || info.gameDuration < 300) return;
        callback(player, info);
    });
}

function calculateChampionStats(matches, puuid) {
    const champs = {};

    iteratePlayerMatches(matches, puuid, (player, info) => {
        const name = player.championName;
        if (!champs[name]) {
            champs[name] = {
                championName: name,
                games: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                csTotal: 0,
                durationMin: 0
            };
        }
        const c = champs[name];
        const mins = info.gameDuration / 60;
        c.games += 1;
        if (player.win) c.wins += 1;
        c.kills += player.kills;
        c.deaths += player.deaths;
        c.assists += player.assists;
        c.csTotal += player.totalMinionsKilled + player.neutralMinionsKilled;
        c.durationMin += mins;
    });

    return Object.values(champs)
        .map(c => {
            const kdaRatio = (c.kills + c.assists) / Math.max(1, c.deaths);
            const avgK = (c.kills / c.games).toFixed(1);
            const avgD = (c.deaths / c.games).toFixed(1);
            const avgA = (c.assists / c.games).toFixed(1);
            const csPerMin = c.durationMin > 0 ? c.csTotal / c.durationMin : 0;
            const winRate = Math.round((c.wins / c.games) * 100);
            return {
                ...c,
                kdaRatio,
                kdaLine: `${avgK} / ${avgD} / ${avgA}`,
                csPerMin: csPerMin.toFixed(1),
                winRate
            };
        })
        .sort((a, b) => b.games - a.games);
}

function calculateRoleStats(matches, puuid) {
    const roles = {};

    iteratePlayerMatches(matches, puuid, (player) => {
        const role = mapTeamPositionToRole(player.teamPosition);
        if (!role) return;
        if (!roles[role]) roles[role] = { role, games: 0, wins: 0 };
        roles[role].games += 1;
        if (player.win) roles[role].wins += 1;
    });

    return Object.values(roles)
        .map(r => ({
            ...r,
            winRate: Math.round((r.wins / r.games) * 100)
        }))
        .sort((a, b) => (ROLE_CONFIG[a.role]?.order ?? 99) - (ROLE_CONFIG[b.role]?.order ?? 99));
}

function getMatchTeamKey(p, gameMode) {
    if (gameMode === 'CHERRY') return getArenaTeamKey(p);
    return p.teamId;
}

function calculatePlayedWithStats(matches, puuid) {
    const allies = {};

    iteratePlayerMatches(matches, puuid, (player, info) => {
        const teamKey = getMatchTeamKey(player, info.gameMode);
        info.participants.forEach(p => {
            if (p.puuid === puuid) return;
            if (getMatchTeamKey(p, info.gameMode) !== teamKey) return;

            const id = p.puuid;
            if (!allies[id]) {
                allies[id] = {
                    gameName: p.riotIdGameName,
                    tagLine: p.riotIdTagline,
                    summonerName: p.summonerName,
                    games: 0,
                    wins: 0
                };
            }
            allies[id].games += 1;
            if (player.win) allies[id].wins += 1;
        });
    });

    return Object.values(allies)
        .map(a => ({
            ...a,
            winRate: Math.round((a.wins / a.games) * 100),
            displayName: a.gameName && a.tagLine
                ? `${a.gameName}#${a.tagLine}`
                : (a.summonerName || 'Unknown')
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 10);
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLocalDateKey(gameCreationMs) {
    if (gameCreationMs == null || !Number.isFinite(gameCreationMs)) return 'unknown';
    const d = new Date(gameCreationMs);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatMatchDayLabel(gameCreationMs) {
    const d = new Date(gameCreationMs);
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${MONTH_SHORT[d.getMonth()]}`;
}

function renderMatchDayHeader(gameCreationMs) {
    const label = formatMatchDayLabel(gameCreationMs);
    return `
        <div class="match-day-header">
            <span class="match-day-date">${label}</span>
        </div>
    `;
}

function formatSoloRankTitle(entry) {
    if (!entry || !entry.tier) return 'Unranked';
    const t = entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase();
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(entry.tier)) {
        return t;
    }
    const div = entry.rank || '';
    return div ? `${t} ${div}` : t;
}

function renderRankedSoloHTML(entry, ddragonVersion) {
    const headerTitle = 'Ranked Solo';

    if (!entry) {
        return `
            <div class="insight-card ranked-card">
                <div class="insight-card-header">
                    <span class="insight-icon">🏅</span>
                    <span>${headerTitle}</span>
                </div>
                <div class="ranked-body ranked-body--unranked">
                    <div class="ranked-unranked-label">Unranked</div>
                    <p class="ranked-unranked-hint">No ranked solo/duo entry yet for this account.</p>
                    <div class="ranked-stats-grid">
                        <div>
                            <div class="ranked-stat-val">—</div>
                            <div class="ranked-stat-lbl">Win rate</div>
                        </div>
                        <div>
                            <div class="ranked-stat-val">—</div>
                            <div class="ranked-stat-lbl">Matches</div>
                        </div>
                        <div>
                            <div class="ranked-stat-val">—</div>
                            <div class="ranked-stat-lbl">Current LP</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const total = (entry.wins || 0) + (entry.losses || 0);
    const wr = total > 0 ? Math.round(((entry.wins || 0) / total) * 100) : 0;
    const tierUrl = entry.tier
        ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/tier/${entry.tier}.png`
        : '';
    const lp = entry.leaguePoints ?? 0;
    const rankLpLine = `${formatSoloRankTitle(entry)} ${lp} LP`.toUpperCase();
    const wlDash = `${entry.wins ?? 0}W - ${entry.losses ?? 0}L`;

    return `
        <div class="insight-card ranked-card">
            <div class="insight-card-header">
                <span class="insight-icon">🏅</span>
                <span>${headerTitle}</span>
            </div>
            <div class="ranked-body">
                <div class="ranked-tier-row">
                    ${tierUrl ? `<img class="ranked-tier-icon" src="${tierUrl}" alt="" />` : ''}
                    <div class="ranked-tier-meta">
                        <div class="ranked-rank-lp ranked-rank-lp--${entry.tier}">${rankLpLine}</div>
                        <div class="ranked-wl-detail">${wlDash} (${wr}%)</div>
                    </div>
                </div>
                <div class="ranked-stats-grid">
                    <div>
                        <div class="ranked-stat-val">${wr}%</div>
                        <div class="ranked-stat-lbl">Win rate</div>
                    </div>
                    <div>
                        <div class="ranked-stat-val">${total}</div>
                        <div class="ranked-stat-lbl">Matches</div>
                    </div>
                    <div>
                        <div class="ranked-stat-val ranked-stat-val--lp">${lp}</div>
                        <div class="ranked-stat-lbl">Current LP</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderChampionPerformanceHTML(champions, version) {
    const rows = champions.length === 0
        ? '<tr><td colspan="4" class="insight-empty">No champion data</td></tr>'
        : champions.slice(0, 6).map(c => {
            const champFile = normalizeChampionName(c.championName);
            const icon = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champFile}.png`;
            return `
                <tr class="insight-row">
                    <td class="insight-champ-cell">
                        <img class="insight-champ-icon" src="${icon}" alt="${escapeHtml(c.championName)}" />
                        <div class="insight-champ-kda">
                            <span class="insight-kda-main">${c.kdaRatio.toFixed(1)}</span>
                            <span class="insight-kda-sub">${c.kdaLine}</span>
                        </div>
                    </td>
                    <td>${c.csPerMin}</td>
                    <td>${c.games}</td>
                    <td class="insight-wr ${getWinRateClass(c.winRate)}">${c.winRate}%</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="insight-card">
            <div class="insight-card-header">
                <span class="insight-icon">✦</span>
                <span>Champion Performance</span>
            </div>
            <table class="insight-table">
                <thead>
                    <tr>
                        <th>KDA</th>
                        <th>CS/m</th>
                        <th>Games</th>
                        <th>WR</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderRolePerformanceHTML(roles) {
    const rows = roles.length === 0
        ? '<tr><td colspan="3" class="insight-empty">No role data (SR games only)</td></tr>'
        : roles.map(r => {
            const cfg = ROLE_CONFIG[r.role] || { label: r.role, icon: null };
            const iconHtml = cfg.icon
                ? `<img src="assets/lanes/${cfg.icon}" class="insight-role-icon" alt="" />`
                : '';
            return `
                <tr class="insight-row">
                    <td class="insight-role-cell">
                        ${iconHtml}
                        <span>${cfg.label}</span>
                    </td>
                    <td>${r.games}</td>
                    <td class="insight-wr ${getWinRateClass(r.winRate)}">${r.winRate}%</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="insight-card">
            <div class="insight-card-header">
                <span class="insight-icon">🌿</span>
                <span>Role Performance</span>
            </div>
            <table class="insight-table insight-table--role">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Games</th>
                        <th>WR</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderPlayedWithHTML(allies) {
    const rows = allies.length === 0
        ? '<tr><td colspan="3" class="insight-empty">No repeated teammates</td></tr>'
        : allies.map(a => {
            const nameHtml = a.gameName && a.tagLine
                ? `<a href="#" class="summoner-link insight-player-link" data-game-name="${escapeHtml(a.gameName)}" data-tag-line="${escapeHtml(a.tagLine)}">${escapeHtml(a.gameName)}<span class="summoner-link-tag">#${escapeHtml(a.tagLine)}</span></a>`
                : escapeHtml(a.displayName);
            return `
                <tr class="insight-row">
                    <td class="insight-player-cell">${nameHtml}</td>
                    <td>${a.games}</td>
                    <td class="insight-wr ${getWinRateClass(a.winRate)}">${a.winRate}%</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="insight-card">
            <div class="insight-card-header">
                <span class="insight-icon">👥</span>
                <span>Played With</span>
            </div>
            <table class="insight-table insight-table--played">
                <thead>
                    <tr>
                        <th>Summoner</th>
                        <th>Games</th>
                        <th>WR</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

const CHALLENGER_BENCHMARKS = {
    kda: 3.8,
    dmgPerMin: 820,
    goldPerMin: 420,
    kpPercent: 67,
    visionPerMin: 1.35
};

function calculateOverallStats(matches, puuid) {
    let totalScore = 0, wins = 0, totalKDA = 0, totalCS = 0, totalKP = 0;
    let totalGoldPerMin = 0, totalDmgPerMin = 0, totalVisionPerMin = 0, validGames = 0;

    matches.forEach(match => {
        const info = match.info;
        const player = info.participants.find(p => p.puuid === puuid);
        if (!player || info.gameDuration < 300) return;

        const score = calculateMatchScore(player, info);
        totalScore += score;
        if (player.win) wins++;

        const gameDurationMin = info.gameDuration / 60;
        const kda = (player.kills + player.assists) / Math.max(1, player.deaths);
        totalKDA += kda;

        const cs = (player.totalMinionsKilled + player.neutralMinionsKilled) / gameDurationMin;
        totalCS += cs;

        const teamKills = info.participants
            .filter(p => p.teamId === player.teamId)
            .reduce((sum, p) => sum + p.kills, 0);
        const killParticipation = teamKills > 0
            ? ((player.kills + player.assists) / teamKills) * 100
            : 0;
        totalKP += killParticipation;

        totalGoldPerMin += (player.goldEarned || 0) / gameDurationMin;
        totalDmgPerMin += (player.totalDamageDealtToChampions || 0) / gameDurationMin;
        totalVisionPerMin += (player.visionScore || 0) / gameDurationMin;

        validGames++;
    });

    const radarKda = validGames > 0 ? totalKDA / validGames : 0;
    const radarDmgPerMin = validGames > 0 ? totalDmgPerMin / validGames : 0;
    const radarGoldPerMin = validGames > 0 ? totalGoldPerMin / validGames : 0;
    const radarKp = validGames > 0 ? totalKP / validGames : 0;
    const radarVisionPerMin = validGames > 0 ? totalVisionPerMin / validGames : 0;

    return {
        avgScore: validGames > 0 ? Math.round(totalScore / validGames) : 0,
        winRate: validGames > 0 ? Math.round((wins / validGames) * 100) : 0,
        avgKDA: validGames > 0 ? (totalKDA / validGames).toFixed(1) : '0.0',
        avgCS: validGames > 0 ? (totalCS / validGames).toFixed(1) : '0.0',
        avgKP: validGames > 0 ? Math.round(totalKP / validGames) : 0,
        avgGoldPerMin: validGames > 0 ? Math.round(totalGoldPerMin / validGames) : 0,
        totalGames: validGames,
        radar: {
            kda: radarKda,
            dmgPerMin: radarDmgPerMin,
            goldPerMin: radarGoldPerMin,
            kpPercent: radarKp,
            visionPerMin: radarVisionPerMin
        }
    };
}

function radarPercent(value, benchmark) {
    if (!benchmark || benchmark <= 0) return 0;
    return Math.min(100, (value / benchmark) * 100);
}

function renderPerformanceRadar(container, playerStats) {
    const axes = [
        { label: 'KDA', value: playerStats.kda, benchmark: CHALLENGER_BENCHMARKS.kda, format: v => v.toFixed(1) },
        { label: 'DMG/min', value: playerStats.dmgPerMin, benchmark: CHALLENGER_BENCHMARKS.dmgPerMin, format: v => String(Math.round(v)) },
        { label: 'Gold/min', value: playerStats.goldPerMin, benchmark: CHALLENGER_BENCHMARKS.goldPerMin, format: v => String(Math.round(v)) },
        { label: 'KP%', value: playerStats.kpPercent, benchmark: CHALLENGER_BENCHMARKS.kpPercent, format: v => `${Math.round(v)}%` },
        { label: 'Vision/min', value: playerStats.visionPerMin, benchmark: CHALLENGER_BENCHMARKS.visionPerMin, format: v => v.toFixed(2) }
    ];

    const size = 300;
    const center = size / 2;
    const radius = size * 0.36;
    const count = axes.length;

    const pointAt = (axisIndex, percent) => {
        const angle = (Math.PI * 2 * axisIndex) / count - Math.PI / 2;
        const r = radius * Math.min(percent, 1);
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const toPath = points =>
        points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    const gridLevels = [0.25, 0.5, 0.75, 1];
    const gridPaths = gridLevels.map(level => {
        const pts = axes.map((_, i) => pointAt(i, level));
        return `<path d="${toPath(pts)}" class="radar-grid-ring"/>`;
    }).join('');

    const axisLines = axes.map((_, i) => {
        const end = pointAt(i, 1);
        return `<line x1="${center}" y1="${center}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" class="radar-axis-line"/>`;
    }).join('');

    const labels = axes.map((axis, i) => {
        const pos = pointAt(i, 1.18);
        return `<text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" class="radar-axis-label" text-anchor="middle" dominant-baseline="middle">${axis.label}</text>`;
    }).join('');

    const challengerPts = axes.map((_, i) => pointAt(i, 1));
    const playerPts = axes.map((axis, i) =>
        pointAt(i, radarPercent(axis.value, axis.benchmark) / 100)
    );

    const legendRows = axes.map(axis => {
        const pct = Math.round(radarPercent(axis.value, axis.benchmark));
        return `
            <div class="radar-legend-row">
                <span class="radar-legend-label">${axis.label}</span>
                <span class="radar-legend-values">
                    <strong>${axis.format(axis.value)}</strong>
                    <span class="radar-legend-vs">/ ${axis.format(axis.benchmark)}</span>
                </span>
                <span class="radar-legend-pct ${pct >= 100 ? 'radar-legend-pct--high' : ''}">${pct}%</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="radar-wrap">
            <svg class="radar-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Performance comparison vs Challenger benchmark">
                ${gridPaths}
                ${axisLines}
                <path d="${toPath(challengerPts)}" class="radar-polygon radar-polygon--challenger"/>
                <path d="${toPath(playerPts)}" class="radar-polygon radar-polygon--player"/>
                ${labels}
            </svg>
            <div class="radar-legend">
                <div class="radar-legend-title">Stat breakdown</div>
                ${legendRows}
                <div class="radar-legend-key">
                    <span><i class="radar-swatch radar-swatch--player"></i> You</span>
                    <span><i class="radar-swatch radar-swatch--challenger"></i> Challenger (100%)</span>
                </div>
            </div>
        </div>
    `;
}

/** Arena duo/trio key — must match grouping in normalizeArenaTeams. */
function getArenaTeamKey(p) {
    const sub = p.playerSubteamId;
    if (sub != null && sub > 0) {
        return `${p.teamId ?? 0}-${sub}`;
    }
    if (p.placement != null && p.placement > 0) {
        return `place-${p.placement}`;
    }
    return `solo-${p.puuid}`;
}

function getTeammatesForMatchScore(player, info) {
    if (info.gameMode === 'CHERRY') {
        const key = getArenaTeamKey(player);
        return info.participants.filter(p => getArenaTeamKey(p) === key);
    }
    return info.participants.filter(p => p.teamId === player.teamId);
}

function calculateMatchScore(player, info) {
    let score = 50;
    const gameDurationMin = info.gameDuration / 60;
    const cs = (player.totalMinionsKilled + player.neutralMinionsKilled) / gameDurationMin;
    const kda = (player.kills + player.assists) / Math.max(1, player.deaths);
    const teammates = getTeammatesForMatchScore(player, info);
    const teamKills = teammates.reduce((sum, p) => sum + p.kills, 0);
    const killParticipation = teamKills > 0 ? ((player.kills + player.assists) / teamKills) * 100 : 0;

    if (kda >= 5) score += 25;
    else if (kda >= 3) score += 18;
    else if (kda >= 2) score += 10;
    else if (kda >= 1) score += 5;
    else score -= 10;

    if (cs >= 9) score += 15;
    else if (cs >= 8) score += 10;
    else if (cs >= 7) score += 5;
    else if (cs >= 6) score += 2;
    else if (cs < 5) score -= 5;

    if (killParticipation >= 70) score += 15;
    else if (killParticipation >= 60) score += 10;
    else if (killParticipation >= 50) score += 5;
    else if (killParticipation < 30) score -= 5;

    if (player.win) score += 10;
    else score -= 10;

    const avgVision = (player.visionScore || 0) / gameDurationMin;
    if (avgVision >= 1.5) score += 10;
    else if (avgVision >= 1.0) score += 5;
    else if (avgVision >= 0.5) score += 2;

    const teamDamage = teammates.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
    const damageParticipation = teamDamage > 0 ? (player.totalDamageDealtToChampions / teamDamage) * 100 : 0;
    if (damageParticipation >= 30) score += 10;
    else if (damageParticipation >= 25) score += 5;
    else if (damageParticipation >= 20) score += 2;

    const objectives = (player.dragonKills || 0) + (player.baronKills || 0) + (player.towerKills || 0);
    if (objectives >= 3) score += 5;
    else if (objectives >= 2) score += 3;
    else if (objectives >= 1) score += 1;

    return Math.min(100, Math.max(0, Math.round(score)));
}

function getGrade(score) {
    if (score >= 90) return "S+";
    if (score >= 80) return "S";
    if (score >= 70) return "A";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 40) return "D";
    return "F";
}

function getGradeClass(score) {
    if (score >= 80) return "grade-s";
    if (score >= 70) return "grade-a";
    if (score >= 60) return "grade-b";
    if (score >= 50) return "grade-c";
    return "grade-d";
}


function computeMatchParticipantRatings(info) {
    const participants = info.participants || [];
    const scored = participants.map(p => ({
        puuid: p.puuid,
        score: calculateMatchScore(p, info),
        ka: p.kills + p.assists
    }));
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.ka - a.ka;
    });
    const map = {};
    scored.forEach((row, idx) => {
        const rank = idx + 1;
        map[row.puuid] = {
            rank,
            score: row.score,
            grade: getGrade(row.score),
            gradeClass: getGradeClass(row.score)
        };
    });
    return map;
}

const summonerSpells = {
    21: "SummonerBarrier", 1: "SummonerBoost", 14: "SummonerDot", 3: "SummonerExhaust", 4: "SummonerFlash",
    6: "SummonerHaste", 7: "SummonerHeal", 13: "SummonerMana", 30: "SummonerPoroRecall", 31: "SummonerPoroThrow",
    11: "SummonerSmite", 39: "SummonerSnowURFSnowball_Mark", 32: "SummonerSnowball", 12: "SummonerTeleport",
    54: "Summoner_UltBookPlaceholder", 55: "Summoner_UltBookSmitePlaceholder"
};

function normalizeArenaTeams(participants) {
    const buckets = {};

    for (const p of participants) {
        const key = getArenaTeamKey(p);
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(p);
    }

    let teams = Object.values(buckets);

    const ARENA_TEAM_SIZE = 3;

    if (teams.some(t => t.length > ARENA_TEAM_SIZE)) {
        const byPlacement = {};
        for (const p of participants) {
            const pl = p.placement ?? 0;
            if (!byPlacement[pl]) byPlacement[pl] = [];
            byPlacement[pl].push(p);
        }

        teams = [];
        Object.keys(byPlacement)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach(pl => {
                const group = byPlacement[pl].sort((a, b) => a.participantId - b.participantId);
                for (let i = 0; i < group.length; i += ARENA_TEAM_SIZE) {
                    teams.push(group.slice(i, i + ARENA_TEAM_SIZE));
                }
            });
    }

    teams.sort((a, b) => {
        const pa = Math.min(...a.map(p => p.placement ?? 99));
        const pb = Math.min(...b.map(p => p.placement ?? 99));
        return pa - pb;
    });

    return teams.map((players, index) => ({
        teamKey: getArenaTeamKey(players[0]) || `arena-${index}`,
        players
    }));
}

function groupParticipantsByTeam(participants, gameMode) {
    if (gameMode === 'CHERRY') {
        return normalizeArenaTeams(participants);
    }

    const teams = {};
    for (const p of participants) {
        if (!teams[p.teamId]) teams[p.teamId] = [];
        teams[p.teamId].push(p);
    }

    const teamKeys = Object.keys(teams).map(Number).sort((a, b) => a - b);
    return teamKeys.map(teamKey => ({ teamKey, players: teams[teamKey] }));
}

function getTeamLabel(teamKey, players, gameMode) {
    if (gameMode === 'CHERRY') {
        const placement = Math.min(...players.map(p => p.placement ?? 99));
        const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';
        const outcome = placement <= 4 ? 'Victory' : 'Defeat';
        const duoNames = players
            .map(p => p.riotIdGameName || p.summonerName || 'Unknown')
            .join(' & ');
        return `#${placement}${suffix} · ${duoNames} · ${outcome}`;
    }
    if (Number(teamKey) === 100) return 'Blue Team';
    if (Number(teamKey) === 200) return 'Red Team';
    return `Team ${teamKey}`;
}

function getParticipantName(p) {
    if (p.riotIdGameName && p.riotIdTagline) {
        return `${p.riotIdGameName}#${p.riotIdTagline}`;
    }
    return p.summonerName || 'Unknown';
}

function getParticipantNameHtml(p) {
    const displayName = getParticipantName(p);
    if (p.riotIdGameName && p.riotIdTagline) {
        return `<a href="#" class="summoner-link" data-game-name="${escapeHtml(p.riotIdGameName)}" data-tag-line="${escapeHtml(p.riotIdTagline)}">${escapeHtml(p.riotIdGameName)}<span class="summoner-link-tag">#${escapeHtml(p.riotIdTagline)}</span></a>`;
    }
    return escapeHtml(displayName);
}

function getParticipantItemIcons(p, version) {
    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect width='28' height='28' fill='%23222222'/%3E%3C/svg%3E";
    return Array.from({ length: 7 }, (_, i) => {
        const itemId = p[`item${i}`];
        const iconUrl = itemId > 0
            ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`
            : placeholder;
        return `<img class="detail-item-icon" src="${iconUrl}" alt="" />`;
    }).join('');
}

function getMatchDetailsHTML(info, version, searchedPuuid) {
    const ratings = computeMatchParticipantRatings(info);
    const teams = groupParticipantsByTeam(info.participants, info.gameMode);
    const gameDurationMin = info.gameDuration / 60;

    const teamSections = teams.map(({ teamKey, players }) => {
        const isSearchedTeam = players.some(p => p.puuid === searchedPuuid);
        const placement = info.gameMode === 'CHERRY'
            ? Math.min(...players.map(p => p.placement ?? 99))
            : null;
        const teamWon = info.gameMode === 'CHERRY' ? placement <= 4 : players.some(p => p.win);
        const teamClass = info.gameMode === 'CHERRY'
            ? (teamWon ? 'team-win' : 'team-lose')
            : (Number(teamKey) === 100 ? 'team-blue' : 'team-red');

        const playerRows = players.map(p => {
            const champName = normalizeChampionName(p.championName);
            const champIcon = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champName}.png`;
            const cs = Math.round(((p.totalMinionsKilled + p.neutralMinionsKilled) / gameDurationMin) * 10) / 10;
            const kda = ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(1);
            const teamKills = players.reduce((sum, mate) => sum + mate.kills, 0);
            const kp = teamKills > 0 ? Math.round(((p.kills + p.assists) / teamKills) * 100) : 0;
            const dmg = Math.round(p.totalDamageDealtToChampions / 1000);
            const isSearched = p.puuid === searchedPuuid;
            const r = ratings[p.puuid] || { rank: '-', score: 0, grade: '?', gradeClass: 'grade-d' };
            const mvpClass = r.rank === 1 ? ' participant-rank--mvp' : '';

            return `
                <div class="participant-row ${isSearched ? 'participant-highlight' : ''}">
                    <div class="participant-rank${mvpClass}">
                        <span class="participant-rank-num">#${r.rank}</span>
                        ${r.rank === 1 ? '<span class="participant-mvp-badge">MVP</span>' : ''}
                    </div>
                    <div class="participant-rating-cell">
                        <span class="participant-rating-score">${r.score}</span>
                        <span class="participant-rating-grade ${r.gradeClass}">${r.grade}</span>
                    </div>
                    <div class="participant-champ">
                        <img class="participant-champ-icon" src="${champIcon}" alt="${p.championName}" />
                        <span class="participant-champ-name">${p.championName}</span>
                    </div>
                    <div class="participant-name">${getParticipantNameHtml(p)}</div>
                    <div class="participant-kda">
                        <span class="kills">${p.kills}</span>/<span class="deaths">${p.deaths}</span>/<span class="assists">${p.assists}</span>
                        <span class="participant-kda-ratio">${kda}</span>
                    </div>
                    <div class="participant-stats">
                        <span>${cs} CS/m</span>
                        <span>${kp}% KP</span>
                        <span>${dmg}k DMG</span>
                    </div>
                    <div class="participant-items">${getParticipantItemIcons(p, version)}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="team-section ${teamClass} ${isSearchedTeam ? 'team-highlight' : ''}">
                <div class="team-header">${getTeamLabel(teamKey, players, info.gameMode)}</div>
                <div class="team-players">${playerRows}</div>
            </div>
        `;
    }).join('');

    const layoutClass = info.gameMode === 'CHERRY' ? 'match-details-arena' : 'match-details-standard';

    return `
        <div class="match-details ${layoutClass}">
            <div class="match-details-header">
                <span>Rank</span>
                <span>Rating</span>
                <span>Champion</span>
                <span>Summoner</span>
                <span>KDA</span>
                <span>Stats</span>
                <span>Items</span>
            </div>
            ${teamSections}
        </div>
    `;
}

function formatGameMode(gameMode) {
    const modes = {
        CHERRY: 'Arena',
        CLASSIC: "Summoner's Rift",
        ARAM: 'ARAM',
        URF: 'URF',
        NEXUSBLITZ: 'Nexus Blitz',
        ODIN: 'Dominion',
        ONEFORALL: 'One for All',
        TUTORIAL: 'Tutorial',
        ULTBOOK: 'Ultimate Spellbook'
    };
    return modes[gameMode] || gameMode.replace(/_/g, ' ');
}

const QUEUE_RANKED_SOLO = 420;
const QUEUE_RANKED_FLEX = 440;

function getRankedQueueLabel(queueId) {
    if (queueId === QUEUE_RANKED_SOLO) return 'Ranked Solo';
    if (queueId === QUEUE_RANKED_FLEX) return 'Ranked Flex';
    return null;
}

/**
 * Riot Match-V5 does not include LP gained/lost per game.
 * Rough tier-based estimate for UI only (MMR, promos, and dodge penalties change real values).
 */
function estimateRankedLpDelta(isWin, tier) {
    const t = (tier || 'GOLD').toUpperCase();
    if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(t)) return isWin ? 11 : -13;
    if (t === 'DIAMOND' || t === 'EMERALD') return isWin ? 17 : -18;
    if (t === 'PLATINUM') return isWin ? 18 : -17;
    if (t === 'GOLD') return isWin ? 18 : -18;
    if (t === 'SILVER' || t === 'BRONZE' || t === 'IRON') return isWin ? 20 : -18;
    return isWin ? 18 : -17;
}

function getMatchHTML(player, info, version, score, searchedPuuid, soloRankedEntry = null, flexRankedEntry = null) {
    const resultColor = player.win ? 'match win' : (info.gameDuration < 300 ? 'match remake' : 'match lose');
    const grade = getGrade(score);
    const gradeClass = getGradeClass(score);
    const gameDurationMin = info.gameDuration / 60;
    const cs = (player.totalMinionsKilled + player.neutralMinionsKilled) / gameDurationMin;
    const kda = ((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(1);
    const teammates = getTeammatesForMatchScore(player, info);
    const teamKills = teammates.reduce((sum, p) => sum + p.kills, 0);
    const killParticipation = teamKills > 0 ? Math.round(((player.kills + player.assists) / teamKills) * 100) : 0;

    const queueLabel = getRankedQueueLabel(info.queueId);
    const gameTypeDisplay = queueLabel || formatGameMode(info.gameMode);
    let rankedMatchStrip = '';
    if (queueLabel && info.gameDuration >= 300) {
        const tierForLp = queueLabel === 'Ranked Solo'
            ? (soloRankedEntry?.tier || null)
            : (flexRankedEntry?.tier || null);
        const delta = estimateRankedLpDelta(player.win, tierForLp);
        const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        rankedMatchStrip = `
            <div class="match-ranked-strip">
                <span class="match-queue-badge">${queueLabel}</span>
                <span class="match-lp-est" title="Approximate LP change for this queue tier. Riot's API does not return exact LP per match.">${deltaStr} LP <span class="match-lp-est-tag">est.</span></span>
            </div>
        `;
    }

    const champName = normalizeChampionName(player.championName);
    const champIcon = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champName}.png`;
    let leftInnerHtml = '';

    if (info.gameMode === 'CHERRY') {
        // Arena: show 4 augments in 2x2 grid
        const augmentIcons = [];
        for (let i = 0; i < 4; i++) {
            const augId = player.augments?.[i];
            if (augId) {
                let iconUrl = null;
                try {
                    iconUrl = getAugmentIconUrl(augId, version);
                } catch(e) { console.warn(e); }
                if (iconUrl) {
                    augmentIcons.push(`<img class="augment-icon" src="${iconUrl}" alt="Augment" title="Augment ${augId}" />`);
                } else {
                    augmentIcons.push(`<div class="augment-placeholder" title="Augment ${augId}">?</div>`);
                }
            } else {
                augmentIcons.push(`<div class="augment-placeholder empty">—</div>`);
            }
        }
        leftInnerHtml = `
            <div class="spell-rune-wrapper arena-augments">
                <div class="spell-icons augment-row">
                    ${augmentIcons[0]}
                    ${augmentIcons[1]}
                </div>
                <div class="rune-icons augment-row">
                    ${augmentIcons[2]}
                    ${augmentIcons[3]}
                </div>
            </div>
        `;
    } else {
        // Normal mode
        const spell1 = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${summonerSpells[player.summoner1Id]}.png`;
        const spell2 = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${summonerSpells[player.summoner2Id]}.png`;
        const primaryRuneId = player.perks?.styles[0]?.selections[0]?.perk;
        const secondaryStyleId = player.perks?.styles[1]?.style;
        const keystoneIcon = getRuneIconUrl(primaryRuneId) || '';
        const secondaryTreeIcon = getSecondaryTreeIcon(secondaryStyleId) || '';

        leftInnerHtml = `
            <div class="spell-rune-wrapper">
                <div class="spell-icons">
                    <img class="spell-icon" src="${spell1}" alt="Spell 1" />
                    <img class="spell-icon" src="${spell2}" alt="Spell 2" />
                </div>
                <div class="rune-icons">
                    <img class="rune-icon" src="${keystoneIcon}" alt="Keystone" />
                    <img class="rune-icon" src="${secondaryTreeIcon}" alt="Secondary Path" />
                </div>
            </div>
        `;
    }

    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23222222'/%3E%3C/svg%3E";
    const itemIcons = Array.from({ length: 7 }, (_, i) => {
        const itemId = player[`item${i}`];
        const iconUrl = itemId > 0 ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png` : placeholder;
        return `<img class="item-icon" src="${iconUrl}" alt="Item ${itemId || 'empty'}" />`;
    }).join("");

    const detailsHTML = getMatchDetailsHTML(info, version, searchedPuuid);

    return `
        <div class="match-container">
        <div class="${resultColor} match-box match-header">
            <div class="expand-arrow" aria-hidden="true">▶</div>
            <div class="left-section">
                <div class="icon-wrapper">
                    <img class="champion-icon" src="${champIcon}" alt="${player.championName}" />
                    <div class="champion-level">${player.champLevel}</div>
                    ${info.gameMode !== 'CHERRY' ? `<div class="lane-label">${getLaneIcon(player.teamPosition)}</div>` : ''}
                </div>
                ${leftInnerHtml}
            </div>
            <div class="match-info">
                <div class="game-type">${gameTypeDisplay}</div>
                ${rankedMatchStrip}
                <div class="game-result ${player.win ? 'victory' : 'defeat'}">${player.win ? "Victory" : "Defeat"}</div>
                <div class="game-duration">${Math.floor(info.gameDuration / 60)}:${(info.gameDuration % 60).toString().padStart(2, '0')}</div>
            </div>
            <div class="kda-section">
                <div class="kda-numbers">
                    <span class="kills">${player.kills}</span>/
                    <span class="deaths">${player.deaths}</span>/
                    <span class="assists">${player.assists}</span>
                </div>
                <div class="kda-ratio">${kda}:1 KDA</div>
                <div class="stats-line">
                    <span>${Math.round(cs * 10) / 10} CS/m</span>
                    <span>${killParticipation}% KP</span>
                </div>
            </div>
            <div class="items-section">
                <div class="items">${itemIcons}</div>
            </div>
            <div class="score-section-right">
                <div class="match-score ${gradeClass}">${score}</div>
                <div class="match-grade">${grade}</div>
            </div>
        </div>
        ${detailsHTML}
        </div>
    `;
}

function getLaneIcon(position) {
    if (!position) return '';
    const iconMap = {
        'TOP': 'TopLane.png',
        'JUNGLE': 'Jungle.png',
        'MIDDLE': 'MidLane.png',
        'BOTTOM': 'BotLane.png',
        'UTILITY': 'Support.png'
    };
    const fileName = iconMap[position];
    if (fileName) {
        return `<img src="assets/lanes/${fileName}" class="lane-icon" alt="${position}" />`;
    }
    return '';
}