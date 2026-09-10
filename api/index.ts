import app from '../server/app';

export default function handler(req: any, res: any) {
  // Restore original request URL if rewritten by Vercel serverless edge
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (matchedPath && typeof matchedPath === 'string') {
    if (req.url === '/' || req.url === '/api' || req.url === '') {
      req.url = matchedPath;
    }
  }
  return app(req, res);
}

