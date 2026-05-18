import express from 'express';
import { chromium } from 'playwright';

const router = express.Router();

// ----------------------------------------
// SINGLE BROWSER INSTANCE
// ----------------------------------------
let browser;

async function getBrowser() {

    if (!browser) {

        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
        });
    }

    return browser;
}

// ----------------------------------------
// FETCH THROUGH REAL BROWSER
// ----------------------------------------
async function fetchFotmobApi(apiUrl, matchUrl) {

    const browser = await getBrowser();

    const context =
        await browser.newContext({

            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',

            locale: 'en-US',
        });

    const page = await context.newPage();

    // STEP 1:
    // OPEN MATCH PAGE
    console.log('🔥 Opening match page');

    await page.goto(matchUrl, {
        waitUntil: 'networkidle',
        timeout: 60000,
    });

    // OPTIONAL:
    // WAIT A LITTLE
    await page.waitForTimeout(3000);

    // STEP 2:
    // CALL API INSIDE BROWSER CONTEXT
    console.log('🌍 Fetching API');

    const data = await page.evaluate(async (url) => {

        const res = await fetch(url, {
            credentials: 'include',
        });

        return {
            status: res.status,
            body: await res.text(),
        };

    }, apiUrl);

    await context.close();

    return data;
}

// ----------------------------------------
// ODDS
// ----------------------------------------
router.get('/odds', async (req, res) => {

    try {

        const { matchId } = req.query;

        if (!matchId) {

            return res.status(400).json({
                error: 'matchId required',
            });
        }

        const matchUrl =
            `https://www.fotmob.com/match/${matchId}`;

        const apiUrl =
            `https://www.fotmob.com/api/data/odds?matchId=${matchId}`;

        const response =
            await fetchFotmobApi(
                apiUrl,
                matchUrl
            );

        console.log(response.status);

        if (response.status !== 200) {

            return res.status(response.status).json({
                error: 'Blocked by FotMob',
                body: response.body,
            });
        }

        return res.json(
            JSON.parse(response.body)
        );

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message,
        });
    }
});

export default router;