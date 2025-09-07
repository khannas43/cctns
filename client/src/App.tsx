import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { API_URL, getHealth, getDbHealth, listTables, getSampleRows, type TableInfo } from './lib/api'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<string>('pending')
  const [dbStatus, setDbStatus] = useState<string>('pending')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selected, setSelected] = useState<{ schema: string; table: string } | null>(null)
  const [sample, setSample] = useState<Record<string, unknown>[]>([])
  const [sampleError, setSampleError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const h = await getHealth()
        if (!cancelled) setApiStatus(h.status)
      } catch (e: any) {
        if (!cancelled) setApiStatus(e?.message || 'error')
      }
      try {
        const d = await getDbHealth()
        if (!cancelled) setDbStatus(d.ok ? d.version || 'ok' : `error: ${d.error || 'unknown'}`)
      } catch (e: any) {
        if (!cancelled) setDbStatus(e?.message || 'error')
      }
      try {
        const t = await listTables('public')
        if (!cancelled) setTables(t)
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to load tables', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function loadSample(schema: string, table: string) {
    setSelected({ schema, table })
    setSample([])
    setSampleError(null)
    try {
      const { rows } = await getSampleRows(schema, table, 10)
      setSample(rows)
    } catch (e: any) {
      setSampleError(e?.message || 'Failed to load sample')
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div style={{ marginTop: 16 }}>
        <p>
          API URL: <code>{API_URL}</code>
        </p>
        <p>
          Backend health: <strong>{apiStatus}</strong>
        </p>
        <p>
          DB health: <strong>{dbStatus}</strong>
        </p>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 16 }}>
        <div>
          <h3>Tables (public)</h3>
          <ul>
            {tables.map((t) => (
              <li key={`${t.table_schema}.${t.table_name}`}>
                <button onClick={() => loadSample(t.table_schema, t.table_name)}>
                  {t.table_schema}.{t.table_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Sample rows {selected ? `(${selected.schema}.${selected.table})` : ''}</h3>
          {sampleError && <p style={{ color: 'red' }}>{sampleError}</p>}
          {sample.length > 0 ? (
            <pre style={{ maxWidth: 600, overflow: 'auto' }}>{JSON.stringify(sample, null, 2)}</pre>
          ) : (
            <p>No data loaded</p>
          )}
        </div>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
