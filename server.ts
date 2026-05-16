import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';

const app = express();
export default app;
const PORT = 3000;
const BASE_URL = 'https://anikototv.to';

app.use(cors());

// Custom user agent to prevent basic blocks
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
};

async function fetchWithFallback(url: string, config: any = {}) {
    try {
        const timeoutConfig = { timeout: 4000, ...config };
        const res = await axios.get(url, timeoutConfig);
        return res;
    } catch (e: any) {
        if (e.response && (e.response.status === 404 || e.response.status === 400)) {
            throw e;
        }
        console.warn(`[Fallback] Primary req failed for ${url}, trying proxy...`);
        try {
            const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url);
            const res = await axios.get(proxyUrl, { timeout: 4000 });
            return res;
        } catch (proxyError: any) {
            console.error(`[Fallback] Proxy also failed for ${url}`);
            throw proxyError;
        }
    }
}

// Search & Filter API
app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const page = req.query.page || 1;
        const response = await fetchWithFallback(`${BASE_URL}/filter`, {
            params: { keyword, page },
            headers
        });

        const $ = cheerio.load(response.data);
        const results = [];

        const keywordLower = (typeof keyword === 'string' ? keyword : '').toLowerCase();

        $('.list-items .item, #list-items .item').each((i, el) => {
            const titleElement = $(el).find('.name, .d-title');
            const url = titleElement.attr('href');
            let id = '';
            if (url && url.includes('/watch/')) {
                id = url.split('/watch/')[1];
            } else if (url) {
                id = url.split('/').pop() || '';
            }
            
            const title = titleElement.text().trim();
            const jName = titleElement.attr('data-jname') || $(el).attr('data-jname') || '';
            
            // Generate a score to prioritize exact matches and startsWith
            let score = 0;
            const tLower = title.toLowerCase();
            const jLower = jName.toLowerCase();
            const idLower = id.toLowerCase();
            
            if (tLower === keywordLower || jLower === keywordLower || idLower === keywordLower) {
                score = 100;
            } else if (tLower.startsWith(keywordLower) || jLower.startsWith(keywordLower)) {
                score = 50;
            } else if (tLower.includes(keywordLower) || jLower.includes(keywordLower)) {
                score = 10;
            }

            results.push({
                title,
                url,
                id,
                jName,
                score,
                image: $(el).find('img').attr('src'),
                rating: $(el).find('.score').text().trim(),
                type: $(el).find('.right').text().trim() || $(el).find('.dot').eq(1).text().trim()
            });
        });

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

// Recent/Trending API (using filter landing page)
app.get('/api/recent', async (req, res) => {
    try {
        const response = await fetchWithFallback(`${BASE_URL}/filter`, { headers });
        const $ = cheerio.load(response.data);
        const results = [];

        $('#list-items .item').each((i, el) => {
             const url = $(el).find('a').attr('href');
             let id = '';
             if (url) {
                 if (url.includes('/watch/')) {
                     id = url.split('/watch/')[1];
                 } else {
                     id = url.split('/').pop();
                 }
             }
             
             results.push({
                title: $(el).find('.name').text().trim(),
                url: url,
                id: id,
                image: $(el).find('img').attr('src'),
                type: $(el).find('.right').text().trim()
            });
        });

        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Lists API (for homepage sections)
const scheduleCache: Record<string, { data: any, timestamp: number }> = {};

app.get('/api/schedule', async (req, res) => {
    try {
        const d = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = req.query.day as string || days[d.getDay()];
        
        const now = Date.now();
        if (scheduleCache[currentDay] && (now - scheduleCache[currentDay].timestamp < 60 * 60 * 1000)) {
            return res.json(scheduleCache[currentDay].data);
        }

        const response = await fetchWithFallback(`https://api.jikan.moe/v4/schedules?filter=${currentDay}`);
        
        scheduleCache[currentDay] = {
            data: response.data,
            timestamp: now
        };
        
        res.json(response.data);
    } catch (error) {
        console.error("Jikan schedule error:", error);
        res.json({ data: [] });
    }
});

app.get('/api/lists', async (req, res) => {
    try {
        const type = req.query.type as string;
        const page = req.query.page || 1;
        let url = `${BASE_URL}/filter`;
        if (type === 'new-release') {
            url += '?sort=latest-updated';
        } else if (type === 'new-added') {
            url += '?sort=latest-added';
        } else if (type === 'just-completed') {
            url += '?status[]=finished-airing&sort=latest-updated';
        } else if (type === 'estimated-schedule') {
            url += '?status[]=currently-airing&sort=latest-updated';
        } else if (type === 'az-list') {
            const letter = req.query.letter as string;
            url = `${BASE_URL}/az-list`;
            if (letter && letter !== 'All') {
                url += `/${letter === 'Other' ? 'other' : letter}`;
            }
        } else if (type === 'genre') {
            const genre = req.query.genre as string;
            url = `${BASE_URL}/genre/${genre}`;
        } else if (type === 'filter') {
            const genres = req.query.genres as string;
            const animeTypes = req.query.types as string; // avoid conflict with outer type
            
            let params = [];
            if (genres) {
                genres.split(',').forEach(g => params.push(`genre[]=${g}`));
            }
            if (animeTypes) {
                animeTypes.split(',').forEach(t => params.push(`term_type[]=${t}`));
            }
            if (params.length > 0) {
                 url += '?' + params.join('&');
            }
        }
        
        if (url.includes('?')) {
            url += `&page=${page}`;
        } else {
            url += `?page=${page}`;
        }

        const response = await fetchWithFallback(url, { headers });
        const $ = cheerio.load(response.data);
        const results: any[] = [];

        let items = $('#list-items .item');
        if (items.length === 0) {
            items = $('.scaff.side.items.md a.item');
        }

        items.each((i, el) => {
             const isAnchor = el.tagName.toLowerCase() === 'a';
             const ahref = isAnchor ? $(el).attr('href') : $(el).find('a').attr('href');
             let id = '';
             if (ahref) {
                 if (ahref.includes('/watch/')) {
                     id = ahref.split('/watch/')[1];
                 } else {
                     id = ahref.split('/').pop() || '';
                 }
             }
             
             results.push({
                title: $(el).find('.name').text().trim(),
                url: ahref,
                id: id,
                image: $(el).find('img').attr('src'),
                type: $(el).find('.right').text().trim() || $(el).find('.dot').eq(1).text().trim()
            });
        });

        res.json({ results });
    } catch (error) {
        console.error("Lists API error:", error);
        res.status(500).json({ error: 'Failed getting list' });
    }
});

// Proxy API to bypass X-Frame-Options
app.get('/api/watch', async (req, res) => {
    try {
        const targetUrl = req.query.url as string;
        if (!targetUrl || !targetUrl.startsWith(BASE_URL)) {
            return res.status(400).send('Invalid url');
        }
        const response = await fetchWithFallback(targetUrl, {
            headers,
            responseType: 'text',
            validateStatus: () => true
        });
        
        res.status(response.status);
        
        delete response.headers['x-frame-options'];
        delete response.headers['content-security-policy'];
        delete response.headers['content-encoding'];
        delete response.headers['content-length'];
        delete response.headers['transfer-encoding'];
        
        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });
        
        let html = response.data;
        if (typeof html === 'string') {
            const injectedCss = `
            <style>
                header, footer, #quick-menu, .azlist, .sidebar, #comment, .block_area, .breadcrumb, .right-side { display: none !important; }
                body { background: #000 !important; overflow: hidden !important; }
                #wrapper { padding: 0 !important; margin: 0 !important; }
                .container { max-width: 100% !important; border-radius: 12px; padding: 0 !important; }
                #watch-main { margin: 0 !important; width: 100vw !important; height: 100vh !important; }
                .watch-player { height: 100% !important; padding: 0 !important; border: none !important; }
                #w-player, #player-wrapper, #player { height: 100vh !important; width: 100vw !important; }
                .film-info-detail { display: none !important; }
            </style>
            `;
            html = html.replace(/<base[^>]*>/, '<base href="/">');
            html = html.replace('</head>', injectedCss + '</head>');
        }
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to proxy stream');
    }
});
// Cache system for /api/info
interface CacheEntry {
    data: any;
    timestamp: number;
}
const infoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache (in milliseconds)

app.get('/api/info', async (req, res) => {
    try {
        const id = req.query.id as string; // e.g. "solo-leveling-reawakening-funr1"
        if (!id || id === 'undefined') return res.status(400).json({ error: 'Missing id' });

        // Check cache
        const cached = infoCache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[Cache Hit] /api/info?id=${id}`);
            return res.json(cached.data);
        }

        const url = `${BASE_URL}/watch/${id}`;
        const response = await fetchWithFallback(url, { headers });
        const $ = cheerio.load(response.data);

        let baseId = id;
        if (baseId.includes('/ep-')) {
            baseId = baseId.split('/ep-')[0];
        }

        const title = $('h2.film-name').text().trim() || $('.d-title, .title').first().text().trim() || id;
        const description = $('.film-description').text().trim() || $('.synopsis .content').text().trim() || '';
        const image = $('.film-poster img, .binfo .poster img').attr('src') || '';
        
        const metadata: Record<string, string> = {};
        $('.bmeta .meta div').each((i, el) => {
             const htmlText = $(el).text();
             const splitIndex = htmlText.indexOf(':');
             if (splitIndex !== -1) {
                  const key = htmlText.substring(0, splitIndex).trim();
                  const value = htmlText.substring(splitIndex + 1).replace(/\s+/g, ' ').trim();
                  metadata[key] = value;
             }
        });
        
        const episodes = [];
        const watchDataId = $('#watch-main').attr('data-id');
        console.log("watchDataId:", watchDataId);
        
        if (watchDataId) {
            try {
                const epRes = await fetchWithFallback(`${BASE_URL}/ajax/episode/list/${watchDataId}?vrf=`, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Referer': url
                    }
                });
                
                if (epRes.data && epRes.data.result) {
                    const $ep = cheerio.load(epRes.data.result);
                    $ep('a').each((i, el) => {
                         const epNum = $ep(el).attr('data-num') || $ep(el).attr('data-number');
                         if (epNum) {
                             const epTitle = $ep(el).attr('title') || $ep(el).find('.d-title').text().trim();
                             const text = epTitle.toLowerCase().includes('episode') ? epTitle : `Episode ${epNum}: ${epTitle}`;
                             episodes.push({
                                 num: epNum,
                                 title: epTitle,
                                 id: $ep(el).attr('data-ids'),
                                 url: `${BASE_URL}/watch/${baseId}/ep-${epNum}`,
                                 text: text
                             });
                         }
                    });
                }
            } catch (epError) {
                console.error("Failed to fetch episodes data");
            }
        }

        const recommended: any[] = [];
        const related: any[] = [];
        
        $('.w-side-section').each((i, el) => {
             const sectionTitle = $(el).find('.head .title').text().trim().toLowerCase();
             
             if (sectionTitle === 'recommended' || sectionTitle === 'related') {
                 const arr = sectionTitle === 'recommended' ? recommended : related;
                 $(el).find('.item').each((j, itemEl) => {
                     const ahref = $(itemEl).attr('href');
                     const name = $(itemEl).find('.name').text().trim();
                     const img = $(itemEl).find('img').attr('src');
                     const parts = $(itemEl).find('.meta .dot').map((j, d) => $(d).text().trim()).get();
                     let itemId = '';
                     if (ahref) {
                         itemId = ahref.includes('/watch/') ? ahref.split('/watch/')[1] : ahref.split('/').pop() || '';
                     }
                     if (itemId && name) {
                         arr.push({
                             id: itemId,
                             title: name,
                             image: img,
                             url: ahref,
                             type: parts.join(' ') || ''
                         });
                     }
                 });
             }
        });

        const responseData = {
            title,
            description,
            image,
            metadata,
            episodes,
            recommended,
            related,
            sourceUrl: url,
            watchDataId
        };

        infoCache.set(id, {
            data: responseData,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/servers', async (req, res) => {
    try {
        const epId = req.query.epId as string;
        if (!epId) return res.status(400).json({ error: 'Missing epId' });

        const url = `${BASE_URL}/ajax/server/list?servers=${epId}`;
        const response = await fetchWithFallback(url, { 
            headers: {
                ...headers,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!response.data || !response.data.result) return res.json({ servers: [] });

        const $ = cheerio.load(response.data.result);
        const servers = [];
        $('.server, li').each((i, el) => {
             const svId = $(el).attr('data-sv-id');
             const linkId = $(el).attr('data-link-id');
             const type = $(el).closest('.type').attr('data-type');
             const name = $(el).text().trim();
             if (linkId) {
                 servers.push({ svId, linkId, type, name });
             }
        });
        res.json({ servers });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/server-url', async (req, res) => {
    try {
        const linkId = req.query.linkId as string;
        if (!linkId) return res.status(400).json({ error: 'Missing linkId' });

        const url = `${BASE_URL}/ajax/server?get=${linkId}`;
        const response = await fetchWithFallback(url, { 
            headers: {
                ...headers,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.data && response.data.result) {
            res.json({ url: response.data.result.url });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

const proxyHandler = (basePath: string) => async (req: any, res: any) => {
    try {
        const url = `${BASE_URL}${basePath}${req.url}`;
        
        let proxyReferer = BASE_URL;
        if (req.headers.referer && req.headers.referer.includes('url=')) {
            proxyReferer = decodeURIComponent(req.headers.referer.split('url=')[1]);
        }

        console.log(`[Proxy] ${req.method} ${url} (Referer: ${proxyReferer})`);

        const response = await axios({
            method: req.method,
            url,
            data: Object.keys(req.body || {}).length > 0 ? req.body : undefined,
            headers: {
                ...headers,
                'Referer': proxyReferer,
                'X-Requested-With': 'XMLHttpRequest'
            },
            responseType: 'arraybuffer',
            validateStatus: () => true
        });
        delete response.headers['content-security-policy'];
        delete response.headers['set-cookie'];
        delete response.headers['content-encoding'];
        delete response.headers['content-length'];
        delete response.headers['transfer-encoding'];
        Object.keys(response.headers).forEach(key => res.setHeader(key, response.headers[key]));
        res.send(response.data);
    } catch (e) {
        res.status(500).end();
    }
};

app.use('/ajax', proxyHandler('/ajax'));
app.use('/AnikotoTheme', proxyHandler('/AnikotoTheme'));
app.use('/images', proxyHandler('/images'));
app.use('/anikoto', proxyHandler('/anikoto'));
app.use('/watch', proxyHandler('/watch'));

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
