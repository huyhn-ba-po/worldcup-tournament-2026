// Fastify webapp entry point
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './routes/api.js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = +(process.env.PORT || 3000);

const IS_PROD = process.env.NODE_ENV === 'production';
const app = Fastify({
  logger: IS_PROD
    ? true  // JSON logs in production (cleaner for Railway logs)
    : { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } },
  trustProxy: true, // Railway/Render set X-Forwarded-* headers
});

// Static files
await app.register(fastifyStatic, {
  root: PUBLIC_DIR,
  prefix: '/',
  setHeaders: (res, filepath) => {
    if (IS_PROD) {
      // Production: cache CSS/JS/images, no-cache HTML (so updates show immediately)
      if (filepath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
});

// API routes
await app.register(apiRoutes);

// SPA-style page routes (serve specific HTML files)
const pages = [
  ['/', 'index.html'],
  ['/groups', 'groups.html'],
  ['/teams', 'teams.html'],
  ['/team/:name', 'team-detail.html'],
  ['/players', 'players.html'],
  ['/match/:id', 'match-detail.html'],
  ['/bracket', 'bracket.html'],
  ['/methodology', 'methodology.html'],
  ['/leaderboard', 'leaderboard.html'],
  ['/compare', 'compare.html'],
  ['/data', 'data-explorer.html'],
  ['/about', 'about.html'],
];
for (const [route, file] of pages) {
  app.get(route, (req, reply) => reply.sendFile(file));
}

// Health
app.get('/health', async () => ({ ok: true, ts: Date.now() }));

try {
  await app.listen({ host: HOST, port: PORT });
  console.log(`\n🌍 WC2026 Predictor webapp ready: http://localhost:${PORT}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
