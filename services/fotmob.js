import * as cheerio from 'cheerio';
import { gotScraping } from 'got-scraping';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();

const client = gotScraping.extend({
    cookieJar: jar,

    throwHttpErrors: false,

    http2: false,

    dnsLookupIpVersion: 4,

    retry: {
        limit: 2,
    },

    timeout: {
        request: 30000,
    },

    headers: {
        'accept-language': 'en-US,en;q=0.9',

        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    },
});

export async function fetchMatch(matchId) {

    const url = `https://www.fotmob.com/match/${matchId}`;

    console.log('🌍 OPENING:', url);

    const response = await client.get(url);

    console.log('STATUS:', response.statusCode);

    const $ = cheerio.load(response.body);

    const nextData = $('#__NEXT_DATA__').html();

    if (!nextData) {
        throw new Error('NEXT_DATA missing');
    }

    const parsed = JSON.parse(nextData);

    return parsed.props.pageProps;
}