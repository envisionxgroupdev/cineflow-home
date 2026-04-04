import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://qqyldlfexibvvnykklee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWxkbGZleGlidnZueWtrbGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDYwMjQsImV4cCI6MjA5MDg4MjAyNH0.hjW0cjcCuo0OsnqVShc7dzdPzKmWDgPLw6RRn4eiiPY';

const DOMAIN = 'https://cineflow.top';
const TMDB_KEY = '2804ac77b0ad498e90e19b5d48ea8f6e';

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function contentUrl(type, title) {
  const prefix = type === 'movie' ? 'filme' : 'serie';
  return `${DOMAIN}/${prefix}/assistir-${slugify(title)}-online-gratis`;
}

async function getSeasonCount(tmdbId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`);
    const data = await res.json();
    return data.seasons?.filter(s => s.season_number > 0) || [];
  } catch {
    return [];
  }
}

async function getEpisodeCount(tmdbId, seasonNumber) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_KEY}&language=pt-BR`);
    const data = await res.json();
    return data.episodes?.length || 0;
  } catch {
    return 0;
  }
}

async function generateSitemap() {
  console.log('🗺️  Gerando sitemap dinâmico...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [moviesRes, seriesRes] = await Promise.all([
    supabase.from('movies').select('id, title, updated_at, tmdb_id'),
    supabase.from('series').select('id, title, updated_at, tmdb_id'),
  ]);

  const movies = moviesRes.data || [];
  const series = seriesRes.data || [];

  const staticPages = [
    { loc: `${DOMAIN}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${DOMAIN}/filmes`, changefreq: 'daily', priority: '0.9' },
    { loc: `${DOMAIN}/series`, changefreq: 'daily', priority: '0.9' },
    { loc: `${DOMAIN}/sobre`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${DOMAIN}/dmca`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${DOMAIN}/termos`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${DOMAIN}/privacidade`, changefreq: 'monthly', priority: '0.3' },
  ];

  let urls = staticPages.map(p =>
    `  <url>\n    <loc>${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
  );

  // Movies
  for (const movie of movies) {
    const lastmod = movie.updated_at ? new Date(movie.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    urls.push(`  <url>\n    <loc>${contentUrl('movie', movie.title)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  }

  // Series + episodes
  for (const s of series) {
    const lastmod = s.updated_at ? new Date(s.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const serieUrl = contentUrl('series', s.title);
    urls.push(`  <url>\n    <loc>${serieUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);

    // Fetch seasons/episodes from TMDB
    if (s.tmdb_id) {
      const seasons = await getSeasonCount(s.tmdb_id);
      for (const season of seasons) {
        const epCount = await getEpisodeCount(s.tmdb_id, season.season_number);
        for (let ep = 1; ep <= epCount; ep++) {
          urls.push(`  <url>\n    <loc>${serieUrl}?t=${season.season_number}&e=${ep}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
        }
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  writeFileSync('dist/sitemap.xml', xml, 'utf-8');
  console.log(`✅ Sitemap gerado com ${urls.length} URLs`);
}

generateSitemap().catch(console.error);
