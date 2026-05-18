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

        'cache-control': 'no-cache',

        pragma: 'no-cache',
    },
});

// ----------------------------------------
// SESSION WARMER
// ----------------------------------------
async function warmSession(matchId) {

    const pageUrl =
        `https://www.fotmob.com/match/${matchId}`;

    console.log('🔥 WARMING SESSION:', pageUrl);

    const pageResponse =
        await client.get(pageUrl);

    console.log(
        'WARM STATUS:',
        pageResponse.statusCode
    );

    return pageResponse.statusCode === 200;
}

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

        // STEP 1:
        // OPEN REAL PAGE FIRST
        await warmSession(matchId);

        // STEP 2:
        // CALL API USING SAME COOKIES
        const url =
            `https://www.fotmob.com/api/data/matchOdds?matchId=${matchId}&ccode3=ZAF`;

        console.log('🌍 OPENING API:', url);

        const response =
            await client.get(url);

        console.log('API STATUS:', response.statusCode);

        if (response.statusCode !== 200) {

            return res.status(response.statusCode).json({
                error: 'Blocked by FotMob',
                body: response.body,
            });
        }

        const data =
            JSON.parse(response.body);

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

        // STEP 1:
        // WARM SESSION
        await warmSession(matchId);

        // STEP 2:
        // API CALL
        const url =
            `https://www.fotmob.com/api/data/vote?matchId=${matchId}`;

        console.log('🌍 OPENING API:', url);

        const response =
            await client.get(url);

        console.log('API STATUS:', response.statusCode);

        if (response.statusCode !== 200) {

            return res.status(response.statusCode).json({
                error: 'Blocked by FotMob',
                body: response.body,
            });
        }

        const data =
            JSON.parse(response.body);

        return res.json(data);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message,
        });
    }
});

export default router;