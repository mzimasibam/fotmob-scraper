import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getLiveMatches() {

    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or('livetime.neq.,extra_polls.gt.0');

    if (error) throw error;

    return data;
}


export async function getUpcomingMatches() {

    const in30Minutes =
        new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('matches')
        .select('id, match_json, livetime, status')
        .neq('status', 'FT')
        .neq('livetime', '')
        .lte('match_time', in30Minutes);;

    if (error) {
        throw error;
    }

    return data;
}

export async function updateMatch(match, latest) {

    const update = {
        match_json: latest,

        livetime:
            latest.header.status.liveTime?.short ?? '',

        status:
            latest.header.status.finished
                ? 'FT'
                : ''
    };

    // Match just finished
    if (
        latest.header.status.finished &&
        match.extra_polls === 0
    ) {
        update.extra_polls = 2;
    } else if (
        latest.header.status.finished &&
        match.extra_polls > 0
    ) {
        update.extra_polls = match.extra_polls - 1;
    }

    const { error } = await supabase
        .from('matches')
        .update(update)
        .eq('id', match.id);

    if (error) throw error;
}

export default supabase;