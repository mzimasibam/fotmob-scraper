import express from 'express';

import { gotScraping } from 'got-scraping';
import { CookieJar } from 'tough-cookie';

import * as cheerio from 'cheerio';

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
    },
});

// ----------------------------------------
// MATCH ROUTE
// ----------------------------------------
router.get('/', async (req, res) => {

    const { matchId } = req.query;

    if (!matchId) {
        return res.status(400).json({
            error: 'matchId required',
        });
    }

    try {

        const url =
            `https://www.fotmob.com/match/${matchId}`;

        console.log('🌍 OPENING:', url);

        const response =
            await client.get(url);

        console.log('STATUS:', response.statusCode);

        const html = response.body;

        const $ = cheerio.load(html);

        const nextData =
            $('#__NEXT_DATA__').html();

        if (!nextData) {

            return res.status(500).json({
                error: 'NEXT_DATA missing',
            });
        }

        const parsed =
            JSON.parse(nextData);

        return res.json(
            parsed.props.pageProps
        );

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message,
        });
    }
});

export default router;