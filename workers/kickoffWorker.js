import equal from 'fast-deep-equal';
import { fetchMatch } from '../services/fotmob.js';
import { getUpcomingMatches, updateMatch } from '../services/supabase.js';

export async function startKickoffWorker() {

    console.log('🚀 Kickoff Worker');

    while (true) {

        try {

            const matches =
                await getUpcomingMatches();

            console.log(
                `Upcoming: ${matches.length}`
            );

            for (const match of matches) {

                const latest =
                    await fetchMatch(match.id);

                if (
                    equal(match.match_json, latest)
                ) {

                    continue;

                }

                await updateMatch(
                    match,
                    latest
                );

                console.log(
                    `🎉 Match Started ${match.id}`
                );

            }

        } catch (err) {

            console.error(err);

        }

        await sleep(600000);

    }

}

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}