import express from 'express';
import { fetchMatch } from '../services/fotmob.js';

const router = express.Router();

router.get('/', async (req, res) => {

    const { matchId } = req.query;

    if (!matchId) {
        return res.status(400).json({
            error: 'matchId required',
        });
    }

    try {

        const match = await fetchMatch(matchId);

        return res.json(match);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message,
        });
    }

});

export default router;