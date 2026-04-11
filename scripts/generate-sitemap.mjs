import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';

const SUPABASE_URL = 'https://qqyldlfexibvvnykklee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWxkbGZleGlidnZueWtrbGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDYwMjQsImV4cCI6MjA5MDg4MjAyNH0.hjW0cjcCuo0OsnqVShc7dzdPzKmWDgPLw6RRn4eiiPY';

const DOMAIN = 'https://cineflow.top';
const TMDB_KEY = '2804ac77b0ad498e90e19b5d48ea8f6e';
const MAX_URLS_PER_SITEMAP = 5000;

function slugify(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function movieUrl(title) {
  return `${DOMAIN}/filme/assistir-${slugify(title)}-online-gratis`;
}

function serieUrl(title) {
  return `${DOMAIN}/serie/assistir-${slugify(title)}-online-gratis`;
}

function wrapUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function urlEntry(loc, opts = {}) {
  let xml = `  <url>\n    <loc>${loc}</loc>`;
  if (opts.lastmod) xml += `\n    <lastmod>${opts.lastmod}</lastmod>`;
  if (opts.changefreq) xml += `\n    <changefreq>${opts.changefreq}</changefreq>`;
  if (opts.priority) xml += `\n    <priority>${opts.priority}</priority>`;
  xml += `\n  </url>`;
  return xml;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks.length ? chunks : [[]];
}

async function fetchSeasons(tmdbId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`);
    const data = await res.json();
    return data.seasons?.filter(s => s.season_number > 0) || [];
  } catch { return []; }
}

async function fetchEpisodeCount(tmdbId, season) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${TMDB_KEY}&language=pt-BR`);
    const data = await res.json();
    return data.episodes?.length || 0;
  } catch { return 0; }
}

function toDate(d) {
  return d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
}

async function generate() {
  console.log('🗺️  Gerando sitemaps...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [moviesRes, seriesRes] = await Promise.all([
    supabase.from('movies').select('id, title, updated_at, tmdb_id'),
    supabase.from('series').select('id, title, updated_at, tmdb_id'),
  ]);

  const movies = moviesRes.data || [];
  const series = seriesRes.data || [];
  const now = new Date().toISOString().split('T')[0];
  const sitemapEntries = [];

  // 1. Sitemap pages (static)
  const pageUrls = [
    urlEntry(`${DOMAIN}/`, { changefreq: 'daily', priority: '1.0' }),
    urlEntry(`${DOMAIN}/filmes`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${DOMAIN}/series`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${DOMAIN}/sobre`, { changefreq: 'monthly', priority: '0.5' }),
    urlEntry(`${DOMAIN}/dmca`, { changefreq: 'monthly', priority: '0.3' }),
    urlEntry(`${DOMAIN}/termos`, { changefreq: 'monthly', priority: '0.3' }),
    urlEntry(`${DOMAIN}/privacidade`, { changefreq: 'monthly', priority: '0.3' }),
  ];
  writeFileSync('dist/sitemap-pages.xml', wrapUrlset(pageUrls), 'utf-8');
  sitemapEntries.push({ loc: `${DOMAIN}/sitemap-pages.xml`, lastmod: now });
  console.log(`  ✅ sitemap-pages.xml — ${pageUrls.length} URLs`);

  // 2. Sitemap movies — split into chunks of MAX_URLS_PER_SITEMAP
  const movieUrls = movies.map(m =>
    urlEntry(movieUrl(m.title), { lastmod: toDate(m.updated_at), changefreq: 'weekly', priority: '0.8' })
  );
  const movieChunks = chunkArray(movieUrls, MAX_URLS_PER_SITEMAP);
  movieChunks.forEach((chunk, i) => {
    const num = i + 1;
    const filename = `sitemap-filmes-${num}.xml`;
    writeFileSync(`dist/${filename}`, wrapUrlset(chunk), 'utf-8');
    sitemapEntries.push({ loc: `${DOMAIN}/${filename}`, lastmod: now });
    console.log(`  ✅ ${filename} — ${chunk.length} URLs`);
  });

  // 3. Sitemap series + episodes — split into chunks
  const serieUrls = [];
  for (const s of series) {
    const lastmod = toDate(s.updated_at);
    const url = serieUrl(s.title);
    serieUrls.push(urlEntry(url, { lastmod, changefreq: 'weekly', priority: '0.8' }));

    if (s.tmdb_id) {
      const seasons = await fetchSeasons(s.tmdb_id);
      for (const season of seasons) {
        const epCount = await fetchEpisodeCount(s.tmdb_id, season.season_number);
        for (let ep = 1; ep <= epCount; ep++) {
          serieUrls.push(urlEntry(`${url}?t=${season.season_number}&e=${ep}`, { changefreq: 'monthly', priority: '0.6' }));
        }
      }
    }
  }
  const seriesChunks = chunkArray(serieUrls, MAX_URLS_PER_SITEMAP);
  seriesChunks.forEach((chunk, i) => {
    const num = i + 1;
    const filename = `sitemap-series-${num}.xml`;
    writeFileSync(`dist/${filename}`, wrapUrlset(chunk), 'utf-8');
    sitemapEntries.push({ loc: `${DOMAIN}/${filename}`, lastmod: now });
    console.log(`  ✅ ${filename} — ${chunk.length} URLs`);
  });

  // 4. Sitemap index
  const indexEntries = sitemapEntries.map(e =>
    `  <sitemap>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </sitemap>`
  ).join('\n');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries}\n</sitemapindex>`;

  writeFileSync('dist/sitemap.xml', sitemapIndex, 'utf-8');
  const total = pageUrls.length + movieUrls.length + serieUrls.length;
  console.log(`\n🎬 Sitemap index gerado — ${total} URLs totais em ${sitemapEntries.length} sitemaps`);
}

generate().catch(console.error);
