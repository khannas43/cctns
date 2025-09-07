import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { checkDatabaseConnection, listTables, getSampleRows } from './db';

// Load .env from the project root (../.env relative to compiled dist or src)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Fallback to current working directory if needed
dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/db/health', async (_req: Request, res: Response) => {
  const result = await checkDatabaseConnection();
  res.status(result.ok ? 200 : 500).json(result);
});

app.get('/db/tables', async (req: Request, res: Response) => {
  const schema = (req.query.schema as string) || 'public';
  try {
    const tables = await listTables(schema);
    res.json({ schema, tables });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list tables' });
  }
});

app.get('/db/sample', async (req: Request, res: Response) => {
  const schema = (req.query.schema as string) || 'public';
  const table = (req.query.table as string) || '';
  const limitParam = req.query.limit as string | undefined;
  const limit = limitParam ? Number(limitParam) : 10;
  if (!table) {
    return res.status(400).json({ error: 'query param "table" is required' });
  }
  try {
    const rows = await getSampleRows(schema, table, limit);
    res.json({ schema, table, count: rows.length, rows });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch sample rows' });
  }
});

app.listen(port, () => {
  console.log(`CCTNS server running on port ${port}`);
});
 