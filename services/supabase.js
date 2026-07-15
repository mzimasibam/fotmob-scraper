import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getLiveMatches() {

    const { data, error } = await supabase
        .from('matches')
        .select('id, match_json, livetime, status')
        .neq('status', 'FT')
        .neq('livetime', '');

    if (error) {
        throw error;
    }

    return data;
}


export async function getLiveMatches() {

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

// Update one match
export async function updateMatch(id, latest) {

    const { error } = await supabase
        .from('matches')
        .update({

            match_json: latest,

            livetime:
                latest.header.status.liveTime?.short ?? '',

            status:
                latest.header.status.finished
                    ? 'FT'
                    : ''

        })
        .eq('id', id);

    if (error)
        throw error;

}

export default supabase;