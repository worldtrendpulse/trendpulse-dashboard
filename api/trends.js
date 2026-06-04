export const config = { runtime: 'edge' };

const GEO_MAP = {
  br: 'BR',
  us: 'US',
  pt: 'PT',
  ar: 'AR',
  global: '',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || 'br';
  const geo = GEO_MAP[country] || 'BR';

  try {
    const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}&hours=4`;
    const rssRes = await fetch(rssUrl);
    const rssText = await rssRes.text();

    const titles = [...rssText.matchAll(/<item>[\s\S]*?<title>(.+?)<\/title>/g)];
    const approx = [...rssText.matchAll(/<ht:approx_traffic>(.+?)<\/ht:approx_traffic>/g)];

    const items = titles.map((m, i) => ({
      rank: i + 1,
      trend: m[1],
      category: 'Trending',
      domain_context: `Trending · ${geo || 'Global'}`,
      status: 'Live',
      age: 0,
      time: new Date().toISOString(),
      traffic: approx[i]?.[1] || '',
    }));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}