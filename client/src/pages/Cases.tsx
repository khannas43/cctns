import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type CaseRow = {
  case_reference: string
  case_type?: string | null
  case_date?: string | null
  investigating_officer?: string | null
  // Unified fields for both views
  district_name?: string | null
  police_station_name?: string | null
  // For non-entity view joins
  districts?: { name?: string | null } | null
  police_stations?: { name?: string | null } | null
  // For entity-linked view
  entity_name?: string | null
  entity_type?: string | null
}

interface CasesProps {
  entityId?: string | null
  entityName?: string | null
  showEntityFilter?: boolean
  preloadedCases?: any[]
}

export default function Cases({
  entityId = null,
  entityName: entityNameProp = null,
  showEntityFilter = true,
  preloadedCases,
}: CasesProps) {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [district, setDistrict] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [districtOptions, setDistrictOptions] = useState<string[]>(['all'])
  const [caseTypeOptions, setCaseTypeOptions] = useState<string[]>(['all'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const queryEntityId = searchParams.get('entityId') || null
  const currentEntityId = entityId ?? queryEntityId
  const entityNameFromQuery = searchParams.get('entityName') || null
  const entityName = entityNameProp ?? entityNameFromQuery
  const preloadedCasesLength = Array.isArray(preloadedCases) ? preloadedCases.length : 0

  useEffect(() => {
    async function loadCases() {
      // Accept preloaded cases via props first, then navigation state
      const stateAny: any = location.state
      const pre = (Array.isArray(preloadedCases) && preloadedCases.length > 0)
        ? preloadedCases
        : (stateAny && Array.isArray(stateAny.preloadedCases) ? stateAny.preloadedCases : null)
      if (pre && pre.length > 0) {
        const transformedPre: CaseRow[] = (pre as any[]).map((row: any) => ({
          case_reference: row.case_reference || row.reference,
          case_type: row.case_type || row.type,
          case_date: row.case_date || row.date,
          investigating_officer: row.investigating_officer || row.investigator || row.io,
          district_name: row.district_name || row.district || row.districts?.name,
          police_station_name: row.police_station_name || row.police_station || row.police_stations?.name,
          entity_name: row.entity_name || row.entity,
          entity_type: row.entity_type || row.type,
        }))
        setCases(transformedPre)
        const names = transformedPre
          .map((c) => ((c.district_name || (c as any)?.districts?.name || '') as string).toString().trim())
          .filter((n) => n.length > 0)
        const uniqDistricts = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
        setDistrictOptions((prev) => {
          const merged = new Set<string>(prev.filter((p) => p && p !== 'all'))
          for (const n of uniqDistricts) merged.add(n)
          return ['all', ...Array.from(merged).sort((a, b) => a.localeCompare(b))]
        })
        const types = transformedPre
          .map((c) => (c.case_type ?? '').toString().trim())
          .filter((t) => t.length > 0)
        const uniqTypes = Array.from(new Set(types)).sort((a, b) => a.localeCompare(b))
        setCaseTypeOptions(['all', ...uniqTypes])

        // If entity-specific, enrich district options from DB as well
        if (currentEntityId) {
          const distinctRes = await supabase
            .from('entity_linked_cases')
            .select('district_name')
            .eq('entity_id', currentEntityId)
            .limit(50000)
          if (!distinctRes.error && Array.isArray(distinctRes.data)) {
            const dnames = distinctRes.data
              .map((r: any) => (r?.district_name || '').toString().trim())
              .filter((n: string) => n.length > 0)
            const uniq = Array.from(new Set(dnames)).sort((a, b) => a.localeCompare(b))
            if (uniq.length > 0) {
              setDistrictOptions((prev) => {
                const merged = new Set<string>(prev.filter((p) => p && p !== 'all'))
                for (const n of uniq) merged.add(n)
                return ['all', ...Array.from(merged).sort((a, b) => a.localeCompare(b))]
              })
            }
          }

          const linksRes = await supabase
            .from('case_entity_links')
            .select('case_id')
            .eq('entity_id', currentEntityId)
            .limit(50000)
          if (!linksRes.error && Array.isArray(linksRes.data) && linksRes.data.length > 0) {
            const caseIds = Array.from(new Set(linksRes.data.map((x: any) => x.case_id).filter(Boolean)))
            if (caseIds.length > 0) {
              const caseRes = await supabase
                .from('cctns_case_data')
                .select('id, districts(name), district_name')
                .in('id', caseIds)
                .limit(50000)
              if (!caseRes.error && Array.isArray(caseRes.data)) {
                const dnames2 = caseRes.data
                  .map((r: any) => ((r?.district_name || r?.districts?.name || '') as string).toString().trim())
                  .filter((n: string) => n.length > 0)
                setDistrictOptions((prev) => {
                  const combined = new Set<string>([...prev, ...dnames2])
                  const merged = Array.from(combined)
                    .filter((n) => n && n !== 'all')
                    .sort((a, b) => a.localeCompare(b))
                  return ['all', ...merged]
                })
              }
            }
          }
        }
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        let data: any[] | null = null
        let error: any = null

        if (currentEntityId) {
          // Preferred RPC with proper locations, pass entity id as string
          const rpcRes = await supabase.rpc('get_entity_cases_with_locations', {
            entity_id_param: String(currentEntityId),
          })
          data = (rpcRes.data as any[] | null) || null
          error = rpcRes.error
          // Additionally fetch from entity_linked_cases and merge to avoid RPC underfetch
          const extraRes = await supabase
            .from('entity_linked_cases')
            .select(
              'case_reference, case_type, case_date, investigating_officer, district_name, police_station_name, entity_name, entity_type, entity_id',
            )
            .eq('entity_id', currentEntityId)
            .limit(50000)
          if (!extraRes.error && Array.isArray(extraRes.data)) {
            const base = Array.isArray(data) ? data : []
            const combined = [...base, ...extraRes.data]
            const seen = new Set<string>()
            data = combined.filter((row: any) => {
              const key = String(row.case_reference || row.reference || '')
              if (!key || seen.has(key)) return false
              seen.add(key)
              return true
            })
          }
          if (error) {
            // Fallback to view/table
            const res = await supabase
              .from('entity_linked_cases')
              .select(
                'case_reference, case_type, case_date, investigating_officer, district_name, police_station_name, entity_name, entity_type, entity_id',
              )
              .eq('entity_id', currentEntityId)
              .limit(50000)
            data = res.data as any[] | null
            error = res.error
          }
        } else {
          // Preferred RPC for all cases with locations
          const rpcAll = await supabase.rpc('get_cases_with_locations')
          data = (rpcAll.data as any[] | null) || null
          error = rpcAll.error
          if (error) {
            const res = await supabase
              .from('cctns_case_data')
              .select(
                'case_reference, case_type, case_date, investigating_officer, districts(name), police_stations(name)'
              )
              .limit(2000)
            data = res.data as any[] | null
            error = res.error
          }
        }

        if (error) throw error

        const transformedData: CaseRow[] = (data || []).map((row: any) => ({
          case_reference: row.case_reference || row.reference,
          case_type: row.case_type || row.type,
          case_date: row.case_date || row.date,
          investigating_officer: row.investigating_officer || row.investigator || row.io,
          district_name: row.district_name || row.district || row.districts?.name,
          police_station_name: row.police_station_name || row.police_station || row.police_stations?.name,
          entity_name: row.entity_name || row.entity,
          entity_type: row.entity_type || row.type,
        }))

        setCases(transformedData)

        const types = transformedData
          .map((c) => (c.case_type ?? '').toString().trim())
          .filter((t) => t.length > 0)
        const uniqTypes = Array.from(new Set(types)).sort((a, b) => a.localeCompare(b))
        setCaseTypeOptions(['all', ...uniqTypes])

        // Build initial district options from loaded data
        const names = transformedData
          .map((c) => ((c.district_name || (c as any)?.districts?.name || '') as string).toString().trim())
          .filter((n) => n.length > 0)
        const uniqDistricts = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
        setDistrictOptions((prev) => {
          const merged = new Set<string>(prev.filter((p) => p && p !== 'all'))
          for (const n of uniqDistricts) merged.add(n)
          return ['all', ...Array.from(merged).sort((a, b) => a.localeCompare(b))]
        })

        // If entity-specific, enrich district options directly from DB for completeness
        if (currentEntityId) {
          const distinctRes = await supabase
            .from('entity_linked_cases')
            .select('district_name')
            .eq('entity_id', currentEntityId)
            .limit(50000)
          if (!distinctRes.error && Array.isArray(distinctRes.data)) {
            const dnames = distinctRes.data
              .map((r: any) => (r?.district_name || '').toString().trim())
              .filter((n: string) => n.length > 0)
            const uniq = Array.from(new Set(dnames)).sort((a, b) => a.localeCompare(b))
            if (uniq.length > 0) {
              setDistrictOptions((prev) => {
                const merged = new Set<string>(prev.filter((p) => p && p !== 'all'))
                for (const n of uniq) merged.add(n)
                return ['all', ...Array.from(merged).sort((a, b) => a.localeCompare(b))]
              })
            }
          }

          // Fallback: derive districts via links → cases join
          const linksRes = await supabase
            .from('case_entity_links')
            .select('case_id')
            .eq('entity_id', currentEntityId)
            .limit(50000)
          if (!linksRes.error && Array.isArray(linksRes.data) && linksRes.data.length > 0) {
            const caseIds = Array.from(new Set(linksRes.data.map((x: any) => x.case_id).filter(Boolean)))
            if (caseIds.length > 0) {
              const caseRes = await supabase
                .from('cctns_case_data')
                .select('id, districts(name), district_name')
                .in('id', caseIds)
                .limit(50000)
              if (!caseRes.error && Array.isArray(caseRes.data)) {
                const dnames2 = caseRes.data
                  .map((r: any) => ((r?.district_name || r?.districts?.name || '') as string).toString().trim())
                  .filter((n: string) => n.length > 0)
                setDistrictOptions((prev) => {
                  const combined = new Set<string>([...prev, ...dnames2])
                  const merged = Array.from(combined)
                    .filter((n) => n && n !== 'all')
                    .sort((a, b) => a.localeCompare(b))
                  return ['all', ...merged]
                })
              }
            }
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load cases', err)
        setCases([])
      } finally {
        setLoading(false)
      }
    }
    loadCases()
  }, [currentEntityId, preloadedCasesLength])

  const districts = districtOptions

  const caseTypes = caseTypeOptions

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch = !search || c.case_reference.toLowerCase().includes(search.toLowerCase())
      const matchesDistrict = district === 'all' || (c.district_name || c.districts?.name) === district
      const matchesType = typeFilter === 'all' || c.case_type === typeFilter
      return matchesSearch && matchesDistrict && matchesType
    })
  }, [cases, search, district, typeFilter])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading cases...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        {currentEntityId && entityName ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Showing cases linked to entity: <strong>{entityName}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentEntityId ? 'Entity-Linked Cases' : 'All Cases'}
            </h1>
            <p className="text-sm text-gray-600">{filtered.length} of {cases.length} cases</p>
          </div>
          {currentEntityId && (
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Back to Network Analytics
            </button>
          )}
        </div>
      </div>

      {showEntityFilter && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Reference</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. FIR-1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {caseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Types' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cases {currentEntityId ? `for ${entityName || 'Entity'}` : ''}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Police Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investigating Officer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr key={c.case_reference} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-blue-700">{c.case_reference}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{c.case_type || 'n/a'}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{c.case_date ? new Date(c.case_date).toLocaleDateString() : 'n/a'}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{c.district_name || c.districts?.name || 'Unknown'}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{c.police_station_name || c.police_stations?.name || 'Unknown'}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{c.investigating_officer || 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}