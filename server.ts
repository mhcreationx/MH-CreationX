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
