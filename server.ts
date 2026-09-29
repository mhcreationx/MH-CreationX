import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads and assets serving
  app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
  app.use('/api/uploads', express.static(path.resolve(__dirname, 'uploads')));
  app.use('/DTLS', express.static(path.resolve(__dirname, 'DTLS')));
  app.use('/public', express.static(path.resolve(__dirname, 'public')));

  // Dynamic fallback for missing project images / customer avatars
  const serveDynamicAssetFallback = (req: express.Request, res: express.Response) => {
    const fullPath = req.originalUrl || req.path;
    const isCustomer = fullPath.includes('/customers/');
    if (isCustomer) {
      const parts = fullPath.split('/');
      const custIdx = parts.findIndex(p => p === 'customers');
      const name = (custIdx !== -1 && parts[custIdx + 1] ? parts[custIdx + 1] : 'CL').toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5"/>
            <stop offset="100%" stop-color="#9333ea"/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="44" fill="url(#g)"/>
        <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${name.slice(0, 4)}</text>
      </svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(svg);
    }

    const filename = fullPath.split('/').pop() || 'POSTER';
    const tag = filename.replace(/\.[^/.]+$/, '').slice(0, 16).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stop-color="#4338ca" stop-opacity="0.45"/>
          <stop offset="45%" stop-color="#312e81" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.98"/>
        </radialGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="#030712"/>
      <rect width="600" height="800" fill="url(#glow)"/>
      <rect x="28" y="28" width="544" height="744" rx="20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
      <circle cx="300" cy="310" r="130" fill="none" stroke="rgba(99,102,241,0.25)" stroke-width="2"/>
      <circle cx="300" cy="310" r="85" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="6,6"/>
      <polygon points="300,245 350,345 250,345" fill="url(#accent)" opacity="0.8"/>
      <text x="300" y="325" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#ffffff" letter-spacing="4" text-anchor="middle">MH CREATION X</text>
      <text x="300" y="355" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="3" text-anchor="middle">CINEMATIC EXHIBIT</text>
      <line x1="220" y1="620" x2="380" y2="620" stroke="url(#accent)" stroke-width="2"/>
      <text x="300" y="650" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="15" fill="#f8fafc" letter-spacing="3" text-anchor="middle">ORIGINAL POSTER</text>
      <text x="300" y="675" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748b" letter-spacing="1.5" text-anchor="middle">ARCHIVE • ${tag}</text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  };

  app.use('/uploads', serveDynamicAssetFallback);
  app.use('/api/uploads', serveDynamicAssetFallback);

  // Mount API router under both /api and root
  app.use('/api', apiRouter);
  app.use(apiRouter);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Studio] MH Creation X server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
