const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/', async (req, res) => {
    const { leagueId } = req.query;

    if (!leagueId) {
        return res.status(400).json({ error: 'leagueId is required' });
    }

    const apiUrl = `https://www.fotmob.com/api/data/leagues?id=${leagueId}`;

    let browser;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ],
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
        );

        let captured = null;

        page.on('response', async (response) => {
            try {
                const url = response.url();
                if (url.includes(`leagueId=${leagueId}`)) {
                    const text = await response.text();
                    captured = JSON.parse(text);
                }
            } catch (err) {
                console.error('Error reading response:', err);
            }
        });

        await page.goto('https://www.fotmob.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        const manual = await page.evaluate(async (url) => {
            const r = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (!r.ok) {
                return { status: r.status };
            }

            return { status: r.status, json: await r.json() };
        }, apiUrl);

        await new Promise(resolve => setTimeout(resolve, 3000));

        await browser.close();

        if (manual?.json) {
            return res.json({ source: 'manual', data: manual.json });
        }

        if (captured) {
            return res.json({ source: 'captured', data: captured });
        }

        return res.status(404).json({ error: 'No data captured' });

    } catch (err) {
        console.error('Route error:', err);

        if (browser) await browser.close();

        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
