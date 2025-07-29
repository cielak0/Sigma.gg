async function fetchAccount() {
    const name = document.getElementById("riotName").value.trim();
    const tag = document.getElementById("riotTag").value.trim();
    const resultDiv = document.getElementById("result");

    if (!name || !tag) {
        resultDiv.innerHTML = "<p>Please enter both Riot ID and Tagline.</p>";
        return;
    }

    resultDiv.innerHTML = "Loading...";

    try {
        const versionRes = await fetch("http://localhost:3000/api/version");
        const versionData = await versionRes.json();
        const leagueVersion = versionData.version;

        const response = await fetch(`http://localhost:3000/api/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        const summonerResponse = await fetch(`http://localhost:3000/api/summoner/${data.puuid}`);
        const summonerData = await summonerResponse.json();

        const profileIconId = summonerData.profileIconId;
        const summonerLevel = summonerData.summonerLevel;

        resultDiv.innerHTML = `
            <h2>${data.gameName}#${data.tagLine}</h2>
            <div class="profile-icon-wrapper">
                <img src="https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/profileicon/${profileIconId}.png" alt="Profile Icon" class="profile-icon">
                <div class="summoner-level">${summonerLevel}</div>
            </div>
            <hr />
        `;

        const matchRes = await fetch(`http://localhost:3000/api/matches/${data.puuid}`);
        const matches = await matchRes.json();

        const matchHtml = matches.map(match => {
            const info = match.info;
            const player = info.participants.find(p => p.puuid === data.puuid);
            if (!player) return "";
            return getMatchHTML(player, info, leagueVersion);
        }).join("");

        resultDiv.innerHTML += `
            <h2>Recent Matches</h2>
            <div class="match-list">${matchHtml}</div>
        `;

    } catch (err) {
        console.error("Fetch error:", err);
        resultDiv.innerHTML = "<p>Something went wrong while fetching your data.</p>";
    }
}

const summonerSpells = {
    21: "SummonerBarrier", 1: "SummonerBoost", 14: "SummonerDot", 3: "SummonerExhaust", 4: "SummonerFlash",
    6: "SummonerHaste", 7: "SummonerHeal", 13: "SummonerMana", 30: "SummonerPoroRecall", 31: "SummonerPoroThrow",
    11: "SummonerSmite", 39: "SummonerSnowURFSnowball_Mark", 32: "SummonerSnowball", 12: "SummonerTeleport",
    54: "Summoner_UltBookPlaceholder", 55: "Summoner_UltBookSmitePlaceholder"
};

function getMatchHTML(player, info, version) {
    const resultColor = player.win ? 'match win' : (info.gameDuration < 300 ? 'match remake' : 'match lose');

    const champIcon = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${player.championName}.png`;
    const spell1 = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${summonerSpells[player.summoner1Id]}.png`;
    const spell2 = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${summonerSpells[player.summoner2Id]}.png`;

    const primaryRuneId = player.perks.styles[0]?.selections[0]?.perk;
    const primaryStyleId = player.perks.styles[0]?.style;
    const subStyleId = player.perks.styles[1]?.style;

    const runeBase = "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles";

    const keystoneFile = getKeystoneIcon(primaryRuneId);
    const keystoneFolder = (primaryRuneId === 8008) ? "LethalTempo" : keystoneFile;
    const keystoneIcon = `${runeBase}/${getRunePath(primaryStyleId)}/${keystoneFolder}/${keystoneFile}.png`;

    const secondaryIcon = getSecondaryIcon(subStyleId);

    return `
        <div class="${resultColor} match-box">
            <div class="left-section">
                <div class="icon-wrapper">
                    <img class="champion-icon" src="${champIcon}" alt="${player.championName}" />
                    <div class="champion-level">${player.champLevel}</div>
                </div>
                <div class="spell-rune-wrapper">
                    <div class="spell-icons">
                        <img class="spell-icon" src="${spell1}" alt="Spell 1" />
                        <img class="spell-icon" src="${spell2}" alt="Spell 2" />
                    </div>
                    <div class="rune-icons">
                        <img class="rune-icon" src="${keystoneIcon}" alt="Keystone" />
                        <img class="rune-icon" src="${secondaryIcon}" alt="Secondary Path" />
                    </div>
                </div>
            </div>
            <div class="right-section">
                <div><strong>${info.gameMode}</strong> • ${player.win ? "Victory" : (info.gameDuration < 300 ? "Remake" : "Defeat")}</div>
                <div>KDA: ${player.kills}/${player.deaths}/${player.assists}</div>
                <div>CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}</div>
            </div>
        </div>
    `;
}

function getRunePath(id) {
    const paths = {
        8000: "Precision",
        8100: "Domination",
        8200: "Sorcery",
        8300: "Inspiration",
        8400: "Resolve"
    };
    return paths[id] || "Unknown";
}

function getKeystoneIcon(id) {
    const runeIcons = {
        // Domination
        8112: "Electrocute",
        8128: "DarkHarvest",
        9923: "HailOfBlades",
        // Precision
        8005: "PressTheAttack",
        8008: "LethalTempoTemp", // Special folder override
        8021: "FleetFootwork",
        8010: "Conqueror",
        // Sorcery
        8214: "SummonAery",
        8229: "ArcaneComet",
        8230: "PhaseRush",
        // Resolve
        8437: "GraspOfTheUndying",
        8439: "Aftershock",
        8465: "Guardian",
        // Inspiration
        8351: "GlacialAugment",
        8360: "UnsealedSpellbook",
        8369: "FirstStrike"
    };
    return runeIcons[id] || "Unknown";
}

function getSecondaryIcon(styleId) {
    const path = getRunePath(styleId);
    return `assets/runes/${path}.png`;
}
