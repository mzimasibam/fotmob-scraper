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

        const page = await browser.newPage();

        await page.goto(
            `https://www.fotmob.com/match/${matchId}`,
            {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            }
        );

        const data = await page.evaluate(async (matchId) => {
            const response = await fetch(
                `https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`
            );

            return await response.json();
        }, matchId);

        await browser.close();

        res.json(data);

    } catch (e) {
        console.log(e);

        if (browser) {
            await browser.close();
        }

        res.status(500).json({
            error: e.toString(),
        });
    }
});

app.get("/", (_, res) => {
    res.send("FotMob Scraper API Running");
});

app.listen(PORT, () => {
    console.log(`RUNNING ON PORT ${PORT}`);
});