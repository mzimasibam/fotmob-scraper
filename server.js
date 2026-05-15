const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/:matchId", async (req, res) => {
    const { matchId } = req.params;

    let browser;

    try {
        browser = await chromium.launch({
            headless: true,
        });

        const page = await browser.newPage();

        await page.goto(
            `https://www.fotmob.com/match/${matchId}`,
            {
                waitUntil: "domcontentloaded",
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

app.listen(8000, () => {
    console.log("RUNNING ON PORT 8000");
});