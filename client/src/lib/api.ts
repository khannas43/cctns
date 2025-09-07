const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export { API_URL }

export async function getHealth(): Promise<{ status: string }> {
  const resp = await fetch(`${API_URL}/health`, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`Health request failed: ${resp.status}`)
  return resp.json()
}

export async function getDbHealth(): Promise<{ ok: boolean; version?: string; error?: string }> {
  const resp = await fetch(`${API_URL}/db/health`, { headers: { Accept: 'application/json' } })
  // Server returns 200 or 500 with JSON; parse either way
  const data = (await resp.json().catch(() => ({}))) as {
    ok?: boolean
    version?: string
    error?: string
  }
  return {
    ok: Boolean(data.ok),
    version: data.version,
    error: data.error,
  }
}

export type TableInfo = { table_schema: string; table_name: string }

export async function listTables(schema: string = 'public'): Promise<TableInfo[]> {
  const url = new URL(`${API_URL}/db/tables`)
  url.searchParams.set('schema', schema)
  const resp = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`List tables failed: ${resp.status}`)
  const json = (await resp.json()) as { schema: string; tables: TableInfo[] }
  return json.tables
}

export async function getSampleRows(
  schema: string,
  table: string,
  limit: number = 10,
): Promise<{ rows: Record<string, unknown>[]; count: number }> {
  const url = new URL(`${API_URL}/db/sample`)
  url.searchParams.set('schema', schema)
  url.searchParams.set('table', table)
  url.searchParams.set('limit', String(limit))
  const resp = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`Get sample failed: ${resp.status}`)
  const json = (await resp.json()) as { rows: Record<string, unknown>[]; count: number }
  return { rows: json.rows, count: json.count }
}

// Optional backend fallbacks for Network Analytics if Supabase RPC is not available
export async function fetchNetworkEntities(): Promise<any[]> {
  try {
    const url = new URL(`${API_URL}/db/sample`)
    url.searchParams.set('schema', 'public')
    url.searchParams.set('table', 'entities')
    url.searchParams.set('limit', '100')
    const resp = await fetch(url)
    if (!resp.ok) return []
    const json = (await resp.json()) as { rows?: any[] }
    return json.rows ?? []
  } catch {
    return []
  }
}

export async function fetchNetworkRelationships(): Promise<any[]> {
  try {
    const url = new URL(`${API_URL}/db/sample`)
    url.searchParams.set('schema', 'public')
    url.searchParams.set('table', 'relationships')
    url.searchParams.set('limit', '200')
    const resp = await fetch(url)
    if (!resp.ok) return []
    const json = (await resp.json()) as { rows?: any[] }
    return json.rows ?? []
  } catch {
    return []
  }
}


