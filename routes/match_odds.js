

const express = require('express');
const router = express.Router();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

let browser;
let page;
let isVerified = false;

async function initBrowser() {
    if (!browser) {
        console.log('🟢 Launching stealth browser (once)...');

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        page = await browser.newPage();

        console.log('🌐 Opening homepage...');
        await page.goto('https://www.fotmob.com/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('⏳ Waiting for Cloudflare verification (first time only)...');
        await new Promise(resolve => setTimeout(resolve, 8000));

        isVerified = true;
        console.log('✅ Browser verified and ready.');
    }
}

router.get('/', async (req, res) => {
    const { matchId } = req.query;

    if (!matchId) {
        return res.status(400).json({ error: 'matchId is required' });
    }

    const apiUrl = `https://www.fotmob.com/api/data/matchOdds?matchId=${matchId}&ccode3=ZAF`;

    try {
        await initBrowser();

        console.log(`📡 Fetching match ${matchId}...`);

        const result = await page.evaluate(async (url) => {
            const r = await fetch(url);
            return {
                status: r.status,
                text: await r.text()
            };
        }, apiUrl);

        console.log('📊 Status:', result.status);

        if (result.status !== 200) {
            return res.status(result.status).send(result.text);
        }

        return res.json(JSON.parse(result.text));

    } catch (err) {
        console.error('❌ Route error:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
