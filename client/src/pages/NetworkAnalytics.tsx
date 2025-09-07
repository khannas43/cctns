import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchNetworkEntities, fetchNetworkRelationships } from '../lib/api'
import InteractiveNetworkGraph from '../components/InteractiveNetworkGraph'

type Entity = {
  id: string
  label: string
  type: string
  district?: string
  seizure_count?: number
  caseCount?: number
}

type Relationship = {
  id?: string
  source: string
  target: string
  label?: string
  weight?: number
}

export default function NetworkAnalytics() {
  const navigate = useNavigate()
  const [entities, setEntities] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)

  const [filters, setFilters] = useState({
    entityType: 'all',
    district: 'all',
    connectionStrength: 1,
    searchTerm: '',
    showCasesOnly: false,
  })

  useEffect(() => {
    async function fetchNetworkData() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_karnataka_network_data')
        const nodes = ((data as any)?.nodes ?? []) as Entity[]
        const edges = ((data as any)?.edges ?? []) as Relationship[]
        let finalNodes = nodes
        let finalEdges = edges
        if (error || (nodes.length === 0 && edges.length === 0)) {
          // If RPC not available, fetch directly from Supabase tables as per your schema
          const { data: entitiesData } = await supabase
            .from('network_entities')
            .select('id, name, entity_type, districts!left(name)')
            .limit(100)

          const { data: relsData } = await supabase
            .from('network_relationships')
            .select('source_entity_id, target_entity_id, relationship_type, connection_strength')
            .limit(200)

          if (entitiesData && relsData) {
            finalNodes = entitiesData.map((e: any) => ({
              id: e.id,
              label: e.name,
              type: e.entity_type,
              district: e.districts?.name ?? 'Unknown',
              seizure_count: 0,
            })) as Entity[]
            finalEdges = relsData.map((r: any) => ({
              source: r.source_entity_id,
              target: r.target_entity_id,
              label: r.relationship_type,
              weight: r.connection_strength,
            })) as Relationship[]
          } else {
            // Last resort: backend sample endpoints
            finalNodes = (await fetchNetworkEntities()) as Entity[]
            finalEdges = (await fetchNetworkRelationships()) as Relationship[]
          }
        }
        const processedEntities = (finalNodes as Entity[]).map((node) => ({
          ...node,
          caseCount: node.seizure_count || 0,
          district: node.district || 'Unknown',
        }))
        // eslint-disable-next-line no-console
        console.log('Processed entities:', processedEntities)
        // eslint-disable-next-line no-console
        console.log('Entities with cases:', processedEntities.filter((e) => (e.caseCount || 0) > 0))
        setEntities(processedEntities)
        setRelationships(finalEdges)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching network data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworkData()
  }, [])

  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const matchesType = filters.entityType === 'all' || entity.type === filters.entityType
      const matchesDistrict = filters.district === 'all' || entity.district === filters.district
      const matchesSearch =
        !filters.searchTerm || entity.label.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesCaseFilter = !filters.showCasesOnly || (entity.caseCount ? entity.caseCount > 0 : false)
      return matchesType && matchesDistrict && matchesSearch && matchesCaseFilter
    })
  }, [entities, filters])

  const districts = useMemo(() => {
    const uniqueDistricts = [...new Set(entities.map((e) => e.district).filter(Boolean))] as string[]
    return uniqueDistricts.sort()
  }, [entities])

  const entityTypes = useMemo(() => {
    const uniqueTypes = [...new Set(entities.map((e) => e.type))] as string[]
    return uniqueTypes.sort()
  }, [entities])

  function handleFilterChange(filterType: string, value: string | number | boolean) {
    setFilters((prev) => ({ ...prev, [filterType]: value }))
  }

  function resetFilters() {
    setFilters({
      entityType: 'all',
      district: 'all',
      connectionStrength: 1,
      searchTerm: '',
      showCasesOnly: false,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading network intelligence data...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header provided by AppLayout; we keep page content only */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button onClick={resetFilters} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Entities</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Options</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showCasesOnly}
                  onChange={(e) => handleFilterChange('showCasesOnly', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show entities with cases only</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Connection Strength: {filters.connectionStrength}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={filters.connectionStrength}
                onChange={(e) => handleFilterChange('connectionStrength', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {entities.filter((e) => e.type === 'person').length}
            </div>
            <div className="text-sm text-gray-600">Persons</div>
            <div className="text-xs text-gray-500">
              {entities.filter((e) => e.type === 'person' && (e.caseCount || 0) > 0).length} with cases
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {entities.filter((e) => e.type === 'supplier').length}
            </div>
            <div className="text-sm text-gray-600">Suppliers</div>
            <div className="text-xs text-gray-500">
              {entities.filter((e) => e.type === 'supplier' && (e.caseCount || 0) > 0).length} with cases
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {entities.filter((e) => e.type === 'transporter').length}
            </div>
            <div className="text-sm text-gray-600">Transporters</div>
            <div className="text-xs text-gray-500">
              {entities.filter((e) => e.type === 'transporter' && (e.caseCount || 0) > 0).length} with cases
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600 mb-2">{relationships.length}</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Network Entities</h3>
          </div>
          <div className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntities.map((entity) => (
                    <tr key={entity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entity.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entity.type === 'person'
                              ? 'bg-blue-100 text-blue-800'
                              : entity.type === 'supplier'
                              ? 'bg-red-100 text-red-800'
                              : entity.type === 'transporter'
                              ? 'bg-green-100 text-green-800'
                              : entity.type === 'storage_location'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {entity.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.district || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entity.caseCount && entity.caseCount > 0 ? (
                          <button
                            onClick={() =>
                              navigate(`/entity-cases/${encodeURIComponent(entity.id)}?name=${encodeURIComponent(entity.label)}`)
                            }
                            className="flex items-center"
                            title="View cases"
                          >
                            <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded-full hover:bg-red-200">
                              {entity.caseCount} cases
                            </span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No cases</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => setSelectedEntity(entity)} className="text-blue-600 hover:text-blue-900 mr-3">
                          View Network
                        </button>
                        <button onClick={() => navigate(`/entity/${entity.id}`)} className="text-green-600 hover:text-green-900">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedEntity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-5xl w-full mx-4 max-h-full overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Network for: {selectedEntity.label}</h3>
                <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div style={{ height: 600 }}>
                <InteractiveNetworkGraph entityId={String(selectedEntity.id)} onClose={() => setSelectedEntity(null)} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


