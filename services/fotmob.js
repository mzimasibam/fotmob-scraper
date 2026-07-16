
export async function fetchMatch(matchId) {

    const url =
        `https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`;

    console.log('🌍 FETCHING:', url);

    const response = await client.get(url);

    console.log('STATUS:', response.statusCode);

    if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`);
    }

    return JSON.parse(response.body);
}