import 'dotenv/config';
import express from 'express';

import matchRoute from './routes/match.js';
import { startKickoffWorker } from './workers/kickoffWorker.js';
import { startLiveWorker } from './workers/liveWorker.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log('📌', req.method, req.originalUrl);
    next();
});

app.get('/', (_, res) => {
    res.send('✅ Server alive');
});

// match details
app.use('/match', matchRoute);


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {

    console.log(`🚀 Running on ${PORT}`);

    startLiveWorker().catch(console.error);

    startKickoffWorker().catch(console.error);

});