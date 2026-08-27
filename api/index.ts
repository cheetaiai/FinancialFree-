import app, { apiRouter } from '../server/app';

// Ensure routes match whether Vercel preserves or strips /api prefix
app.use(apiRouter);

export default app;
