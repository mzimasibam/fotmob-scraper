const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get("/:matchId", async (req, res) => {
    const { matchId } = req.params;

    let browser;

    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process",
                "--no-zygote",
            ],
        });

        const context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            viewport: {
                width: 1366,
                height: 768,
            },
            locale: "en-US",
            timezoneId: "Africa/Johannesburg",
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", {
                get: () => false,
            });

            window.chrome = {
                runtime: {},
            };

            Object.defineProperty(navigator, "plugins", {
                get: () => [1, 2, 3],
            });

            Object.defineProperty(navigator, "languages", {
                get: () => ["en-US", "en"],
            });
        });

        await page.goto(
            `https://www.fotmob.com/match/${matchId}`,
            {
                waitUntil: "networkidle",
                timeout: 60000,
            }
        );

        await page.waitForTimeout(5000);

        const data = await page.evaluate(async (matchId) => {
            const response = await fetch(
                `https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`
            );

            return await response.json();
        }, matchId);

        await browser.close();

        res.json(data);

    } catch (e) {
        console.error(e);

        if (browser) {
            await browser.close();
        }

        res.status(500).json({
            error: e.toString(),
        });
    }
});

app.listen(PORT, () => {
    console.log(`RUNNING ON PORT ${PORT}`);
});