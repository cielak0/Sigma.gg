const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = 8080;
const API_KEY = process.env.RIOT_API_KEY;

app.use(cors());

const regionCluster = {
    BR1: 'americas',
    EUN1: 'europe',
    EUW1: 'europe',
    JP1: 'asia',
    KR: 'asia',
    LA1: 'americas',
    LA2: 'americas',
    NA1: 'americas',
    OC1: 'sea',
    TR1: 'europe',
    RU: 'europe',
    PH2: 'sea',
    SG2: 'sea',
    TH2: 'sea',
    TW2: 'sea',
    VN2: 'sea'
};

// Get Riot ID
app.get('/api/account/:region/:gameName/:tagLine', async (req, res) => {
    const {region, gameName, tagLine} = req.params;
    const cluster = regionCluster[region];

    if (!cluster) return res.status(400).json({error: 'Invalid region for account lookup'});

    try {
        const accountRes = await fetch(
            `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`
        );

        if (!accountRes.ok) {
            return res.status(accountRes.status).json({error: 'Account not found'});
        }

        const accountData = await accountRes.json();
        res.json({
            gameName,
            tagLine,
            puuid: accountData.puuid
        });
    } catch (err) {
        console.error('Error fetching account:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Get summoner data
app.get('/api/summoner/:region/:puuid', async (req, res) => {
    const {region, puuid} = req.params;

    try {
        const response = await fetch(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            {headers: {'X-Riot-Token': API_KEY}}
        );

        if (!response.ok) {
            return res.status(response.status).json({error: 'Summoner not found'});
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching summoner data:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Ranked league entries (Solo/Flex etc.) — requires encrypted summoner id from summoner v4
app.get('/api/league/:region/:encryptedSummonerId', async (req, res) => {
    const {region, encryptedSummonerId} = req.params;

    try {
        const response = await fetch(
            `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(encryptedSummonerId)}`,
            {headers: {'X-Riot-Token': API_KEY}}
        );

        if (!response.ok) {
            if (response.status === 404) return res.json([]);
            return res.status(response.status).json({error: 'Could not fetch league'});
        }

        const data = await response.json();
        res.json(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error('Error fetching league:', err);
        res.status(500).json({error: 'Failed to fetch league'});
    }
});

// Get last 20 matches
app.get('/api/matches/:region/:puuid', async (req, res) => {
    const {region, puuid} = req.params;
    const cluster = regionCluster[region];

    if (!cluster) return res.status(400).json({error: 'Invalid region for match history'});

    try {
        const idsRes = await fetch(
            `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${API_KEY}`
        );

        if (!idsRes.ok) {
            return res.status(idsRes.status).json({error: 'Could not get match IDs'});
        }

        const matchIds = await idsRes.json();

        const matchData = await Promise.all(
            matchIds.map(async id => {
                try {
                    const r = await fetch(
                        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${API_KEY}`
                    );
                    if (!r.ok) {
                        console.warn(`Skipping match ${id} (status ${r.status})`);
                        return null;
                    }
                    const data = await r.json();
                    return data?.info ? data : null;
                } catch (err) {
                    console.error(`Error fetching match ${id}:`, err);
                    return null;
                }
            })
        );

        res.json(matchData.filter(m => m !== null));
    } catch (err) {
        console.error('Error fetching matches:', err);
        res.status(500).json({error: 'Failed to fetch matches'});
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
