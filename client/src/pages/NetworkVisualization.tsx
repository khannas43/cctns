import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  
} from 'reactflow'
import type { ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '../lib/supabase'

const CustomNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  function getNodeColor(type: string, hasCase: boolean): string {
    const baseColors: Record<string, string> = {
      person: hasCase ? '#1E40AF' : '#3B82F6',
      supplier: hasCase ? '#B91C1C' : '#EF4444',
      transporter: hasCase ? '#059669' : '#10B981',
      storage_location: hasCase ? '#D97706' : '#F59E0B',
      vehicle: hasCase ? '#7C3AED' : '#8B5CF6',
    }
    return baseColors[type] || '#6B7280'
  }
  const hasCase = (data.caseCount || 0) > 0
  const backgroundColor = getNodeColor(String(data.entityType), hasCase)
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 hover:shadow-xl transition-all cursor-pointer ${
        selected ? 'ring-2 ring-yellow-400' : ''
      } ${hasCase ? 'border-white' : 'border-gray-300'}`}
      style={{ backgroundColor, minWidth: '160px', maxWidth: '200px' }}
    >
      <div className="text-white text-center">
        <div className="font-bold text-sm mb-1 truncate">{data.label}</div>
        <div className="text-xs opacity-90 capitalize mb-1">{String(data.entityType).replace('_', ' ')}</div>
        <div className="text-xs opacity-80 mb-1">{data.district}</div>
        {hasCase && (
          <div className="bg-white bg-opacity-30 rounded-full px-2 py-1 mt-1 text-xs font-bold">📁 {data.caseCount} cases</div>
        )}
        <div className="text-xs opacity-70 mt-1">🔗 {data.connections || 0} links</div>
      </div>
    </div>
  )
}

const nodeTypes = { custom: CustomNode }

export default function NetworkVisualization() {
  const navigate = useNavigate()
  const [rf, setRf] = useState<ReactFlowInstance | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [showCasesOnly, setShowCasesOnly] = useState(false)
  const [districtFilter, setDistrictFilter] = useState('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')

  useEffect(() => {
    async function fetchNetworkData() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_karnataka_network_data')
        let nodesSrc: any[] = (data as any)?.nodes || []
        let edgesSrc: any[] = (data as any)?.edges || []
        if (error || (nodesSrc.length === 0 && edgesSrc.length === 0)) {
          const { data: entitiesData } = await supabase
            .from('network_entities')
            .select('id, name, entity_type, districts(name)')
            .limit(200)
          const { data: relsData } = await supabase
            .from('network_relationships')
            .select('source_entity_id, target_entity_id, relationship_type, connection_strength')
            .limit(500)
          nodesSrc = (entitiesData || []).map((e: any) => ({
            id: String(e.id),
            label: e.name,
            type: e.entity_type,
            district: e.districts?.name ?? 'Unknown',
            seizure_count: 0,
          }))
          edgesSrc = (relsData || []).map((r: any) => ({
            source: String(r.source_entity_id),
            target: String(r.target_entity_id),
            label: r.relationship_type,
            weight: r.connection_strength,
          }))
        }

        const connCount: Record<string, number> = {}
        edgesSrc.forEach((e: any) => {
          connCount[String(e.source)] = (connCount[String(e.source)] || 0) + 1
          connCount[String(e.target)] = (connCount[String(e.target)] || 0) + 1
        })

        const nodesPerRow = Math.max(1, Math.ceil(Math.sqrt(nodesSrc.length)))
        const transformedNodes = nodesSrc.map((n: any, index: number) => {
          const typeOrder: Record<string, number> = { person: 0, supplier: 1, transporter: 2, storage_location: 3, vehicle: 4 }
          const hasCase = (n.seizure_count || 0) > 0
          const tIndex = typeOrder[n.type] ?? 0
          const row = Math.floor(index / nodesPerRow)
          const col = index % nodesPerRow
          const baseX = col * 250 + tIndex * 100 + (hasCase ? -50 : 50)
          const baseY = row * 200 + (hasCase ? -30 : 30)
          const randomX = (Math.random() - 0.5) * 100
          const randomY = (Math.random() - 0.5) * 100
          return {
            id: String(n.id),
            type: 'custom',
            position: { x: baseX + randomX, y: baseY + randomY },
            data: {
              label: n.label,
              entityType: n.type,
              district: n.district,
              caseCount: n.seizure_count || 0,
              connections: connCount[String(n.id)] || 0,
            },
          }
        })

        const transformedEdges = edgesSrc.map((e: any, i: number) => ({
          id: `${e.source}-${e.target}-${i}`,
          source: String(e.source),
          target: String(e.target),
          label: String(e.label || '').replace(/_/g, ' '),
          type: 'smoothstep',
          animated: (e.weight || 0) > 3,
          style: { strokeWidth: Math.max(2, e.weight || 1), stroke: (e.weight || 0) > 3 ? '#EF4444' : '#6B7280' },
          markerEnd: { type: 'arrowclosed', color: (e.weight || 0) > 3 ? '#EF4444' : '#6B7280' },
        }))

        setNodes(transformedNodes)
        setEdges(transformedEdges)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching network data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworkData()
  }, [])

  const filteredData = useMemo(() => {
    let filteredNodes: any[] = nodes
    if (showCasesOnly) filteredNodes = filteredNodes.filter((n: any) => (n.data.caseCount || 0) > 0)
    if (districtFilter !== 'all') filteredNodes = filteredNodes.filter((n: any) => n.data.district === districtFilter)
    if (entityTypeFilter !== 'all') filteredNodes = filteredNodes.filter((n: any) => n.data.entityType === entityTypeFilter)
    const nodeIds = new Set(filteredNodes.map((n: any) => n.id))
    const filteredEdges = (edges as any[]).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    return { nodes: filteredNodes, edges: filteredEdges }
  }, [nodes, edges, showCasesOnly, districtFilter, entityTypeFilter])

  useEffect(() => {
    if (rf && filteredData.nodes.length > 0) {
      setTimeout(() => rf.fitView({ padding: 0.1, minZoom: 0.1, maxZoom: 1.5 }), 100)
    }
  }, [rf, filteredData])

  const districts = useMemo(() => {
    return [...new Set((nodes as any[]).map((n) => n.data.district).filter(Boolean))].sort()
  }, [nodes])

  const entityTypes = useMemo(() => {
    return [...new Set((nodes as any[]).map((n) => n.data.entityType))].sort()
  }, [nodes])

  const onNodeClick = useCallback((_e: any, node: any) => setSelectedEntity(node), [])
  const onNodeDoubleClick = useCallback(
    (_e: any, node: any) => {
      navigate(`/entity/${node.id}`)
    },
    [navigate],
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading network visualization...</span>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 hover:text-blue-800">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Drug Network Visualization</h1>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center">
            <input type="checkbox" checked={showCasesOnly} onChange={(e) => setShowCasesOnly(e.target.checked)} className="mr-2" />
            <span className="text-sm font-medium">Show entities with cases only</span>
          </label>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm">
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm">
            <option value="all">All Types</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {String(t).charAt(0).toUpperCase() + String(t).slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
            <span className="font-medium">{filteredData.nodes.length}</span> entities,
            <span className="font-medium ml-1">{filteredData.edges.length}</span> connections
          </div>
          <button
            onClick={() => {
              setShowCasesOnly(false)
              setDistrictFilter('all')
              setEntityTypeFilter('all')
            }}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reset Filters
          </button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          onInit={(inst) => setRf(inst)}
          nodes={filteredData.nodes as any}
          edges={filteredData.edges as any}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 1.5 }}
          attributionPosition="bottom-left"
        >
          <Background color="#f1f5f9" />
          <Controls />
          <MiniMap
            nodeColor={(node: any) => {
              const caseCount = node.data?.caseCount || 0
              const map: Record<string, string> = {
                person: caseCount > 0 ? '#1E40AF' : '#3B82F6',
                supplier: caseCount > 0 ? '#B91C1C' : '#EF4444',
                transporter: caseCount > 0 ? '#059669' : '#10B981',
                storage_location: caseCount > 0 ? '#D97706' : '#F59E0B',
                vehicle: caseCount > 0 ? '#7C3AED' : '#8B5CF6',
              }
              return map[node.data?.entityType] || '#6B7280'
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
          />
          <Panel position="top-right">
            <div className="bg-white p-4 rounded shadow-lg">
              <h3 className="font-semibold mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded mr-2"></div><span>Person</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-500 rounded mr-2"></div><span>Supplier</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-green-500 rounded mr-2"></div><span>Transporter</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div><span>Storage</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-purple-500 rounded mr-2"></div><span>Vehicle</span></div>
              </div>
              <div className="mt-4 pt-3 border-t text-xs text-gray-600">
                <div className="mb-2"><strong>Darker colors</strong> = Has cases<br />
                <strong>Lighter colors</strong> = No cases</div>
                <div><strong>Click:</strong> View details<br /><strong>Double-click:</strong> Full page</div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      {selectedEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedEntity.data.label}</h2>
              <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><p className="text-sm text-gray-600">Entity Type</p><p className="font-semibold capitalize">{String(selectedEntity.data.entityType).replace('_', ' ')}</p></div>
              <div><p className="text-sm text-gray-600">District</p><p className="font-semibold">{selectedEntity.data.district || 'Unknown'}</p></div>
              <div><p className="text-sm text-gray-600">Connected Cases</p><p className={`font-semibold ${selectedEntity.data.caseCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>{selectedEntity.data.caseCount || 'No cases'}</p></div>
              <div><p className="text-sm text-gray-600">Network Connections</p><p className="font-semibold text-blue-600">{selectedEntity.data.connections || 0}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


