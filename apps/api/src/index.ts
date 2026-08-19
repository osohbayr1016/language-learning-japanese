import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, Variables } from './types';

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import wordRoutes from './routes/words';
import audioRoutes from './routes/audio';
import courseRoutes from './routes/courses';
import gameRoutes from './routes/games';
import cartoonRoutes from './routes/cartoons';
import lessonRoutes from './routes/lessons';
import grammarRoutes from './routes/grammar';
import examRoutes from './routes/exams';
import insightRoutes from './routes/insights';
import { readingRouter } from './routes/reading';
/** Explicit `./routes/admin/index` — do not use `./routes/admin`: a sibling `admin.ts` would shadow this folder and drop `/stats`, `/lesson-tree`, chapters, etc. */
import adminRoutes from './routes/admin/index';
import { examImportApp } from './routes/admin/examImportRoutes';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Middleware ──────────────────────────────────────────────
app.use('*', logger());

function isAllowedOrigin(origin: string, env: Env): boolean {
  if (!origin) return false;
  const fromEnv = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const literals = new Set<string>([
    ...fromEnv,
    'http://localhost:5173',   // Admin Vite dev
    'http://localhost:8081',   // Expo web dev
    'http://localhost:8082',   // Expo web (alternate)
    'http://localhost:8085',   // Expo web dev (alternate port)
    'http://localhost:19000',  // Expo / Metro web
    'http://localhost:19001',
    'http://localhost:19006',  // Older Expo web port
    'exp://localhost:8081',
    'exp://localhost:8082',
  ]);
  if (literals.has(origin)) return true;
  // Allow per-deploy preview subdomains for any *.pages.dev / *.workers.dev
  // project we whitelisted (Cloudflare assigns hashed subdomains per deploy).
  for (const o of fromEnv) {
    try {
      const host = new URL(o).host;
      if (host.endsWith('.pages.dev') || host.endsWith('.workers.dev')) {
        const project = host.replace(/^[^.]+\./, ''); // strip first label
        if (origin.endsWith(`.${project}`) || origin.endsWith(`//${project}`)) return true;
      }
    } catch {
      // skip non-URL entries
    }
  }
  return false;
}

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (isAllowedOrigin(origin, c.env)) return origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Health check ────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// ── Routes ──────────────────────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/user', userRoutes);
app.route('/api/words', wordRoutes);
app.route('/api/audio', audioRoutes);
app.route('/api/courses', courseRoutes);
app.route('/api/games', gameRoutes);
app.route('/api/cartoons', cartoonRoutes);
app.route('/api/lessons', lessonRoutes);
app.route('/api/grammar', grammarRoutes);
app.route('/api/exams', examRoutes);
app.route('/api/insights', insightRoutes);
app.route('/api/reading', readingRouter);
app.route('/api/admin/exams', examImportApp);
app.route('/api/admin', adminRoutes);

// ── 404 handler ─────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route олдсонгүй' }, 404));

// ── Error handler ────────────────────────────────────────────
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Серверт алдаа гарлаа', detail: err.message }, 500);
});

export default app;
