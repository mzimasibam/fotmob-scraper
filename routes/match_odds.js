import express from 'express';
import { gotScraping } from 'got-scraping';
import { CookieJar } from 'tough-cookie';

const router = express.Router();

const jar = new CookieJar();

const client = gotScraping.extend({
    cookieJar: jar,

    throwHttpErrors: false,

    http2: false,

    dnsLookupIpVersion: 4,

    retry: {
        limit: 2,
    },

    timeout: {
        request: 30000,
    },

    headers: {
        'accept-language': 'en-US,en;q=0.9',

        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',

        accept: 'application/json, text/plain, */*',

        referer: 'https://www.fotmob.com/',

        origin: 'https://www.fotmob.com',
    },
});

// ----------------------------------------
// MATCH ODDS
// ----------------------------------------
router.get('/odds', async (req, res) => {
    const { matchId } = req.query;

    if (!matchId) {
        return res.status(400).json({
            error: 'matchId required',
        });
    }

    try {
        const url =
            `https://www.fotmob.com/api/data/matchOdds?matchId=${matchId}&ccode3=ZAF`;

        console.log('🌍 OPENING:', url);

        const response = await client.get(url);

        console.log('STATUS:', response.statusCode);

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).json({
                error: 'Blocked by FotMob',
                body: response.body,
            });
        }

        const data = JSON.parse(response.body);

        return res.json(data);

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: err.message,
        });
    }
});

// ----------------------------------------
// MATCH VOTE
// ----------------------------------------
router.get('/vote', async (req, res) => {
    const { matchId } = req.query;

    if (!matchId) {
        return res.status(400).json({
            error: 'matchId required',
        });
    }

    try {
        const url =
            `https://www.fotmob.com/api/data/vote?matchId=${matchId}`;

        console.log('🌍 OPENING:', url);

        const response = await client.get(url);

        console.log('STATUS:', response.statusCode);

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).json({
                error: 'Blocked by FotMob',
                body: response.body,
            });
        }

        const data = JSON.parse(response.body);

        return res.json(data);

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: err.message,
        });
    }
});

export default router;