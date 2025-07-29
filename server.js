const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = 3000;
const API_KEY = process.env.RIOT_API_KEY;

// Enable CORS for frontend (e.g., localhost:8080)
app.use(cors());

// Serve static files from /public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Get Riot account by gameName + tagLine
app.get('/api/account/:gameName/:tagLine', async (req, res) => {
    const { gameName, tagLine } = req.params;

    try {
        const accountRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`);

        if (!accountRes.ok) {
            return res.status(accountRes.status).json({ error: "Account not found" });
        }

        const accountData = await accountRes.json();
        res.json({
            gameName: gameName,
            tagLine: tagLine,
            puuid: accountData.puuid
        });
    } catch (err) {
        console.error("Error fetching account:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 🔧 Get summoner data by puuid (this was missing before)
app.get('/api/summoner/:puuid', async (req, res) => {
    const puuid = req.params.puuid;

    try {
        const response = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
            headers: {
                "X-Riot-Token": API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Summoner not found" });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Error fetching summoner data:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get last 5 matches by puuid
app.get('/api/matches/:puuid', async (req, res) => {
    const puuid = req.params.puuid;

    try {
        const idsRes = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10&api_key=${API_KEY}`);

        if (!idsRes.ok) {
            return res.status(idsRes.status).json({ error: "Could not get match IDs" });
        }

        const matchIds = await idsRes.json();

        const matchData = await Promise.all(
            matchIds.map(id =>
                fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${API_KEY}`)
                    .then(r => r.json())
            )
        );

        res.json(matchData);
    } catch (err) {
        console.error("Error fetching matches:", err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get latest League of Legends version
app.get('/api/version', async (req, res) => {
    try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await response.json();
        res.json({ version: versions[0] }); // send latest version
    } catch (err) {
        console.error("Error fetching version:", err);
        res.status(500).json({ error: 'Failed to fetch version' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
