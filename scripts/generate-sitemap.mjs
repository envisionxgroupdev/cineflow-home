import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://qqyldlfexibvvnykklee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWxkbGZleGlidnZueWtrbGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDYwMjQsImV4cCI6MjA5MDg4MjAyNH0.hjW0cjcCuo0OsnqVShc7dzdPzKmWDgPLw6RRn4eiiPY';

const DOMAIN = 'https://pipocamax.com';
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

function channelUrl(externalId) {
  return `${DOMAIN}/canal/${externalId}`;
}

function wrapUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function urlEntry(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks.length ? chunks : [[]];
}

async function fetchAll(supabase, table, select) {
  const PAGE_SIZE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error(`Erro ao buscar ${table}:`, error.message); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function generate() {
  console.log('🗺️  Gerando sitemaps...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [movies, allSeries, channels] = await Promise.all([
    fetchAll(supabase, 'movies', 'id, title'),
    fetchAll(supabase, 'series', 'id, title, is_anime'),
    fetchAll(supabase, 'tv_channels', 'external_id, is_active'),
  ]);

  const series = allSeries.filter(s => !s.is_anime);
  const animes = allSeries.filter(s => s.is_anime);
  const activeChannels = channels.filter(c => c.is_active !== false);

  console.log(`  📦 ${movies.length} filmes, ${series.length} séries, ${animes.length} animes, ${activeChannels.length} canais`);

  const now = new Date().toISOString().split('T')[0];
  const sitemapEntries = [];

  // 1. Static pages — canonical URLs only
  const pageUrls = [
    urlEntry(`${DOMAIN}/`),
    urlEntry(`${DOMAIN}/filmes`),
    urlEntry(`${DOMAIN}/series`),
    urlEntry(`${DOMAIN}/animes`),
    urlEntry(`${DOMAIN}/canais`),
    urlEntry(`${DOMAIN}/pedidos`),
    urlEntry(`${DOMAIN}/contato`),
    urlEntry(`${DOMAIN}/sobre`),
    urlEntry(`${DOMAIN}/dmca`),
    urlEntry(`${DOMAIN}/termos`),
    urlEntry(`${DOMAIN}/privacidade`),
  ];
  writeFileSync('dist/sitemap-pages.xml', wrapUrlset(pageUrls), 'utf-8');
  sitemapEntries.push({ loc: `${DOMAIN}/sitemap-pages.xml`, lastmod: now });
  console.log(`  ✅ sitemap-pages.xml — ${pageUrls.length} URLs`);

  // 2. Movies — chunked
  const movieEntries = movies.map(m => urlEntry(movieUrl(m.title)));
  const movieChunks = chunkArray(movieEntries, MAX_URLS_PER_SITEMAP);
  movieChunks.forEach((chunk, i) => {
    const filename = `sitemap-filmes-${i + 1}.xml`;
    writeFileSync(`dist/${filename}`, wrapUrlset(chunk), 'utf-8');
    sitemapEntries.push({ loc: `${DOMAIN}/${filename}`, lastmod: now });
    console.log(`  ✅ ${filename} — ${chunk.length} URLs`);
  });

  // 3. Series — chunked
  const serieEntries = series.map(s => urlEntry(serieUrl(s.title)));
  const seriesChunks = chunkArray(serieEntries, MAX_URLS_PER_SITEMAP);
  seriesChunks.forEach((chunk, i) => {
    const filename = `sitemap-series-${i + 1}.xml`;
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
  const total = pageUrls.length + movieEntries.length + serieEntries.length;
  console.log(`\n🎬 Sitemap index gerado — ${total} URLs totais em ${sitemapEntries.length} sitemaps`);
}

generate().catch(console.error);
