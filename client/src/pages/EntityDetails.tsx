import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Entity = {
  id: string
  name: string
  entity_type: string
  status?: string
  created_at?: string
  updated_at?: string
  mobile_numbers?: string[]
  addresses?: string[]
  metadata?: Record<string, unknown>
  districts?: { name?: string } | null
}

type Relationship = {
  id: string
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  connection_strength: number
  date_established?: string
  last_activity?: string
}

type CaseLink = {
  role_in_case: string
  cctns_case_data: {
    case_reference: string
    case_type?: string
    case_date?: string
    investigating_officer?: string
    districts?: { name?: string } | null
    police_stations?: { name?: string } | null
  }
}

function getEntityTypeColor(type?: string): string {
  const colors: Record<string, string> = {
    person: 'text-blue-600',
    supplier: 'text-red-600',
    transporter: 'text-green-600',
    storage_location: 'text-yellow-600',
    vehicle: 'text-purple-600',
  }
  return type ? colors[type] || 'text-gray-600' : 'text-gray-600'
}

export default function EntityDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [cases, setCases] = useState<CaseLink[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!id) return
    async function fetchEntityDetails() {
      setLoading(true)
      try {
        const { data: entityData, error: entityError } = await supabase
          .from('network_entities')
          .select('*, districts(name)')
          .eq('id', id)
          .single()
        if (entityError) throw entityError

        const { data: rels, error: relError } = await supabase
          .from('network_relationships')
          .select('id, source_entity_id, target_entity_id, relationship_type, connection_strength, date_established, last_activity')
          .or(`source_entity_id.eq.${id},target_entity_id.eq.${id}`)
        if (relError) throw relError

        // Optional: linked cases (ignore errors if table/view not present)
        let casesData: CaseLink[] = []
        try {
          const { data } = await supabase
            .from('case_entity_links')
            .select('role_in_case, cctns_case_data(case_reference, case_type, case_date, investigating_officer, districts(name), police_stations(name))')
            .eq('entity_id', id)
          casesData = (data as unknown as CaseLink[]) || []
        } catch {
          casesData = []
        }

        setEntity(entityData as Entity)
        setRelationships((rels as unknown as Relationship[]) || [])
        setCases(casesData)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching entity details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEntityDetails()
  }, [id])

  const incomingCount = useMemo(
    () => relationships.filter((r) => r.target_entity_id === id).length,
    [relationships, id],
  )
  const outgoingCount = useMemo(
    () => relationships.filter((r) => r.source_entity_id === id).length,
    [relationships, id],
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading entity details...</span>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Entity Not Found</h1>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 hover:text-blue-800">
                ← Back to Network
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{entity.name}</h1>
                <p className={`text-lg font-semibold capitalize ${getEntityTypeColor(entity.entity_type)}`}>
                  {String(entity.entity_type).replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Entity ID</div>
              <div className="text-xs text-gray-400 font-mono">{entity.id}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Entity Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-lg">{entity.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className={`font-semibold text-lg capitalize ${getEntityTypeColor(entity.entity_type)}`}>
                    {String(entity.entity_type).replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">District</p>
                  <p className="font-semibold">{entity.districts?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      entity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entity.status || 'n/a'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-semibold">{entity.created_at ? new Date(entity.created_at).toLocaleDateString() : 'n/a'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="font-semibold">{entity.updated_at ? new Date(entity.updated_at).toLocaleDateString() : 'n/a'}</p>
                </div>
              </div>

              {Array.isArray(entity.mobile_numbers) && entity.mobile_numbers.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Mobile Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {entity.mobile_numbers.map((mobile, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {mobile}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(entity.addresses) && entity.addresses.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Addresses</p>
                  <div className="space-y-2">
                    {entity.addresses.map((address, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">{String(address)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Additional Information</p>
                  <div className="bg-gray-50 p-4 rounded">
                    {Object.entries(entity.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1">
                        <span className="text-sm text-gray-600 capitalize">{String(k).replace('_', ' ')}:</span>
                        <span className="text-sm font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Network Relationships ({relationships.length})</h2>
                {relationships.length > 0 && (
                  <div className="text-sm text-gray-500">
                    <span className="text-blue-600 font-medium">{incomingCount}</span> incoming,
                    <span className="text-green-600 font-medium ml-1">{outgoingCount}</span> outgoing
                  </div>
                )}
              </div>
              {relationships.length === 0 ? (
                <p className="text-gray-500 italic">No network relationships found.</p>
              ) : (
                <div className="space-y-3">
                  {relationships.map((rel) => (
                    <div key={rel.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded-r">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-blue-700 capitalize">{rel.relationship_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500">Strength: {rel.connection_strength}/5</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {rel.date_established && <p>Est: {new Date(rel.date_established).toLocaleDateString()}</p>}
                          {rel.last_activity && <p>Last: {new Date(rel.last_activity).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-gray-600">Total Relationships</span><span className="font-bold text-2xl text-blue-600">{relationships.length}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Linked Cases</span><span className="font-bold text-2xl text-green-600">{cases.length}</span></div>
              </div>
            </div>

            {cases.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Linked Cases ({cases.length})</h3>
                <div className="space-y-3">
                  {cases.slice(0, 10).map((c, i) => (
                    <div key={i} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded-r">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-blue-700">{c.cctns_case_data.case_reference}</p>
                          <p className="text-xs text-gray-600 capitalize">Type: {c.cctns_case_data.case_type}</p>
                          <p className="text-xs text-gray-600 capitalize">Role: {c.role_in_case?.replace(/_/g, ' ')}</p>
                          {c.cctns_case_data.districts && (
                            <p className="text-xs text-gray-500">District: {c.cctns_case_data.districts?.name}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {c.cctns_case_data.case_date && <p>{new Date(c.cctns_case_data.case_date).toLocaleDateString()}</p>}
                          {c.cctns_case_data.investigating_officer && <p>Officer: {c.cctns_case_data.investigating_officer}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {cases.length > 10 && (
                    <p className="text-xs text-gray-500 text-center">... and {cases.length - 10} more cases</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


