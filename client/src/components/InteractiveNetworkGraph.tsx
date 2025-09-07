import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  ConnectionMode,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '../lib/supabase'
import type { ReactFlowInstance } from 'reactflow'

type InteractiveNetworkGraphProps = {
  entityId: string
  onClose: () => void
}

const NetworkNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  function getNodeColor(type: string): string {
    const colors: Record<string, string> = {
      person: '#3B82F6',
      supplier: '#EF4444',
      transporter: '#10B981',
      storage_location: '#F59E0B',
      vehicle: '#8B5CF6',
    }
    return colors[type] || '#6B7280'
  }
  return (
    <div
      className={`px-2 py-1 rounded-lg border-2 text-white text-center min-w-[100px] cursor-pointer transition-all ${
        selected ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
      }`}
      style={{ backgroundColor: getNodeColor(String(data.type)), borderColor: selected ? '#FDE047' : 'transparent' }}
    >
      <div className="font-semibold text-xs truncate">{data.label}</div>
      <div className="text-[10px] opacity-80 capitalize">{String(data.type).replace('_', ' ')}</div>
      {data.district && <div className="text-[10px] opacity-70 truncate">{data.district}</div>}
    </div>
  )
}

const nodeTypes = { networkNode: NetworkNode }

export default function InteractiveNetworkGraph({ entityId, onClose }: InteractiveNetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [selectedEdge, setSelectedEdge] = useState<any>(null)
  const [filters, setFilters] = useState({ relationshipType: 'all', strengthCategory: 'all', showInactive: true })
  const [rf, setRf] = useState<ReactFlowInstance | null>(null)

  useEffect(() => {
    async function fetchNetworkData() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_entity_network', { entity_id: entityId, depth: 2 })
        // eslint-disable-next-line no-console
        console.log('RPC get_entity_network result:', { data, error })
        if (error) {
          // eslint-disable-next-line no-console
          console.error('RPC error get_entity_network:', error)
        }

        let payload: any = data
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload)
          } catch {
            payload = null
          }
        }

        let graphNodes: any[] = payload?.nodes || []
        let graphEdges: any[] = payload?.edges || []

        // Fallback to direct table queries if RPC missing/empty
        if (!graphNodes.length && !graphEdges.length) {
          const { data: rels } = await supabase
            .from('network_relationships')
            .select('source_entity_id, target_entity_id, relationship_type, connection_strength, date_established, last_activity')
            .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
            .limit(200)
          const neighborIds = new Set<string>([String(entityId)])
          ;(rels || []).forEach((r: any) => {
            neighborIds.add(String(r.source_entity_id))
            neighborIds.add(String(r.target_entity_id))
          })
          const idList = Array.from(neighborIds)
          const { data: ents } = await supabase
            .from('network_entities')
            .select('id, name, entity_type, districts(name)')
            .in('id', idList)

          graphNodes = (ents || []).map((e: any) => ({
            id: String(e.id),
            label: e.name,
            type: e.entity_type,
            district: e.districts?.name ?? 'Unknown',
            level: e.id === entityId ? 0 : 1,
          }))
          graphEdges = (rels || []).map((r: any, i: number) => ({
            id: `${r.source_entity_id}-${r.target_entity_id}-${i}`,
            source: String(r.source_entity_id),
            target: String(r.target_entity_id),
            label: r.relationship_type,
            weight: r.connection_strength,
            date_established: r.date_established,
            last_activity: r.last_activity,
            days_since_activity: undefined,
            strength_category: r.connection_strength >= 4 ? 'high' : r.connection_strength >= 2 ? 'medium' : 'low',
          }))
        }

        const transformedNodes = graphNodes.map((node: any, index: number) => {
          const angle = (index * 2 * Math.PI) / Math.max(1, graphNodes.length)
          const radius = node.level === 0 ? 0 : 150 + node.level * 100
          return {
            id: String(node.id),
            type: 'networkNode',
            position: { x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) },
            data: { label: node.label, type: node.type, district: node.district, level: node.level },
          }
        })

        const transformedEdges = graphEdges.map((edge: any, i: number) => ({
          id: String(edge.id ?? `${edge.source}-${edge.target}-${i}`),
          source: String(edge.source),
          target: String(edge.target),
          type: 'smoothstep',
          label: String(edge.label || '').replace(/_/g, ' '),
          data: {
            weight: edge.weight,
            establishedDate: edge.date_established,
            lastActivity: edge.last_activity,
            daysInactive: edge.days_since_activity,
            strengthCategory: edge.strength_category,
          },
          animated: (edge.weight || 0) >= 3,
          style: { strokeWidth: Math.max(1, edge.weight || 1) },
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: (edge.weight || 0) >= 3 ? '#EF4444' : '#6B7280' },
        }))

        // eslint-disable-next-line no-console
        console.log('InteractiveNetworkGraph transformed:', { nodes: transformedNodes.length, edges: transformedEdges.length })

        setNodes(transformedNodes)
        setEdges(transformedEdges)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching network data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (entityId) fetchNetworkData()
  }, [entityId, setNodes, setEdges])

  const onNodeClick = useCallback((_e: any, node: any) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  const onEdgeClick = useCallback((_e: any, edge: any) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  const filteredEdges = useMemo(() => {
    return (edges as any[]).filter((edge) => {
      if (filters.relationshipType !== 'all' && edge.label !== filters.relationshipType) return false
      if (filters.strengthCategory !== 'all' && edge.data?.strengthCategory !== filters.strengthCategory) return false
      if (!filters.showInactive && (edge.data?.daysInactive || 0) > 30) return false
      return true
    })
  }, [edges, filters])

  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>()
    ;(filteredEdges as any[]).forEach((e) => {
      ids.add(String(e.source))
      ids.add(String(e.target))
    })
    return ids
  }, [filteredEdges])

  const filteredNodes = useMemo(() => {
    if ((filteredEdges as any[]).length === 0) return nodes as any[]
    return (nodes as any[]).filter((n) => filteredNodeIds.has(String(n.id)))
  }, [nodes, filteredEdges, filteredNodeIds])

  useEffect(() => {
    if (rf) {
      setTimeout(() => rf.fitView({ padding: 0.2 }), 50)
    }
  }, [rf, filteredNodes, filteredEdges])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading network visualization...</span>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-gray-50 relative">
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold mb-3">Network Controls</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
          <select
            value={filters.relationshipType}
            onChange={(e) => setFilters((prev) => ({ ...prev, relationshipType: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Types</option>
            <option value="purchases from">Purchases From</option>
            <option value="transports for">Transports For</option>
            <option value="stores at">Stores At</option>
            <option value="associates with">Associates With</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Connection Strength</label>
          <select
            value={filters.strengthCategory}
            onChange={(e) => setFilters((prev) => ({ ...prev, strengthCategory: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Strengths</option>
            <option value="high">High (4-5)</option>
            <option value="medium">Medium (2-3)</option>
            <option value="low">Low (1)</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.showInactive}
              onChange={(e) => setFilters((prev) => ({ ...prev, showInactive: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Show inactive connections</span>
          </label>
        </div>
        <div className="text-sm text-gray-600">
          <div>Total Entities: {nodes.length}</div>
          <div>Active Connections: {filteredEdges.length}</div>
        </div>
      </div>

      <ReactFlow
        onInit={(inst) => setRf(inst)}
        nodes={filteredNodes as any}
        edges={filteredEdges as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node: any) => {
            const map: Record<string, string> = {
              person: '#3B82F6',
              supplier: '#EF4444',
              transporter: '#10B981',
              storage_location: '#F59E0B',
              vehicle: '#8B5CF6',
            }
            return map[node.data?.type] || '#6B7280'
          }}
        />
        <Panel position="bottom-right">
          <div className="bg-white p-4 rounded shadow-lg">
            <h4 className="font-semibold mb-2">Legend</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div><span>Person</span></div>
              <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-2"></div><span>Supplier</span></div>
              <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div><span>Transporter</span></div>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Entity Details</h3>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {selectedNode.data.label}</div>
            <div><span className="font-medium">Type:</span> <span className="capitalize">{String(selectedNode.data.type).replace('_', ' ')}</span></div>
            <div><span className="font-medium">District:</span> {selectedNode.data.district}</div>
            <div><span className="font-medium">Network Level:</span> {selectedNode.data.level}</div>
            <div><span className="font-medium">Connections:</span> {(edges as any[]).filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}</div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Connection Details</h3>
            <button onClick={() => setSelectedEdge(null)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Relationship:</span> {selectedEdge.label}</div>
            <div><span className="font-medium">Strength:</span> {selectedEdge.data?.weight}/5 ({selectedEdge.data?.strengthCategory || 'n/a'})</div>
          </div>
        </div>
      )}

      <button onClick={onClose} className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 z-20">
        Close Visualization
      </button>
    </div>
  )
}


