import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import app from './server/app';

dotenv.config();

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStaticFallback(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinancialFree server running on http://localhost:${PORT}`);
  });
}

function expressStaticFallback(distPath: string) {
  return (req: any, res: any, next: any) => {
    // If request is for an API route that wasn't matched, send 404 json
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
    }
    const express = require('express');
    express.static(distPath)(req, res, () => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  };
}

startServer();

