import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    // Parse the connection string and pass explicit fields to avoid sslmode conflicts
    const url = new URL(databaseUrl);
    pool = new Pool({
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '') || undefined,
      max: 10,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function checkDatabaseConnection(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const pg = getPool();
    const result = await pg.query<{ version: string }>('select version() as version');
    return { ok: true, version: result.rows[0]?.version };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export type TableInfo = { table_schema: string; table_name: string };

export async function listTables(schema: string = 'public'): Promise<TableInfo[]> {
  const pg = getPool();
  const result = await pg.query<TableInfo>(
    `select table_schema, table_name
     from information_schema.tables
     where table_type = 'BASE TABLE' and table_schema = $1
     order by table_name`,
    [schema],
  );
  return result.rows;
}

export async function getSampleRows(
  schema: string,
  table: string,
  limit: number = 10,
): Promise<Record<string, unknown>[]> {
  if (!isValidIdentifier(schema) || !isValidIdentifier(table)) {
    throw new Error('Invalid schema or table');
  }
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.trunc(limit))) : 10;
  const pg = getPool();
  const sql = `select * from "${schema}"."${table}" limit $1`;
  const result = await pg.query(sql, [safeLimit]);
  return result.rows as Record<string, unknown>[];
}


