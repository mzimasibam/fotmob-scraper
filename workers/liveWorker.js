import equal from 'fast-deep-equal';
import { fetchMatch } from '../services/fotmob.js';
import {
    getLiveMatches,
    updateMatch
} from '../services/supabase.js';

const BATCH_SIZE = 10;

export async function startLiveWorker() {

    console.log('🚀 Poller started');

    while (true) {

        try {

            const matches = await getLiveMatches();

            console.log(`Found ${matches.length} active matches`);

            for (let i = 0; i < matches.length; i += BATCH_SIZE) {

                const batch = matches.slice(i, i + BATCH_SIZE);

                await Promise.all(
                    batch.map(processMatch)
                );

            }

        } catch (err) {

            console.error(err);

        }

        console.log('😴 Sleeping 60 seconds...\n');

        await sleep(60000);

    }

}

async function processMatch(match) {

    try {

        console.log(`⚽ ${match.id}`);

        const latest = await fetchMatch(match.id);

        // Nothing changed
        if (equal(match.match_json, latest)) {

            console.log(`⏭️ ${match.id} unchanged`);

            return;
        }

        console.log(`💾 Updating ${match.id}`);

        await updateMatch(match.id, latest);

        console.log(`✅ Updated ${match.id}`);

    } catch (err) {

        console.error(`❌ ${match.id}`, err.message);

    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}