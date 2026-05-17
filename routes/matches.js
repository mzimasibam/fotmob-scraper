
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// helper to format today's date as YYYYMMDD
function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

router.get('/', async (req, res) => {
    const today = getTodayDate();
    const apiUrl = `https://www.fotmob.com/api/data/matches?date=${today}`;

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

        // Capture responses from network
        page.on('response', async (response) => {
            try {
                const url = response.url();
                if (url.includes(`/api/data/matches?date=${today}`)) {
                    const text = await response.text();
                    try {
                        captured = JSON.parse(text);
                    } catch (e) {
                        captured = text;
                    }
                }
            } catch (err) {
                console.error('Error reading response:', err);
            }
        });

        // Safe navigation with retry
        try {
            await page.goto('https://www.fotmob.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navErr) {
            console.warn('⚠️ First navigation failed, retrying...', navErr.message);
            await page.goto('https://www.fotmob.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        // Manual fetch fallback (runs inside browser context)
        const manual = await page.evaluate(async (url) => {
            try {
                const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (!r.ok) return { status: r.status };
                const json = await r.json();
                return { status: r.status, json };
            } catch (e) {
                return { error: e.message };
            }
        }, apiUrl);

        // Wait a bit so response events fire
        await new Promise(resolve => setTimeout(resolve, 3000));

        await browser.close();

        if (manual && manual.json) {
            return res.json({ source: 'manual', data: manual.json });
        } else if (captured) {
            return res.json({ source: 'captured', data: captured });
        } else {
            return res.status(404).json({ error: 'No data captured', date: today });
        }
    } catch (err) {
        console.error('❌ Route error:', err);
        if (browser) await browser.close();
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
