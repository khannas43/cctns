import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function EntityCasesPage() {
  const { entityId } = useParams()
  const [entityInfo, setEntityInfo] = useState<{ name: string; type: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<any[]>([])

  useEffect(() => {
    async function fetchEntityInfo() {
      if (!entityId) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('network_entities')
          .select('name, entity_type')
          .eq('id', entityId)
          .single()
        if (error) throw error
        setEntityInfo({ name: data?.name ?? 'Unknown Entity', type: data?.entity_type ?? 'entity' })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load entity info:', e)
        setEntityInfo({ name: 'Unknown Entity', type: 'entity' })
      } finally {
        setLoading(false)
      }
    }
    fetchEntityInfo()
  }, [entityId])

  if (!entityId) {
    return <div style={{ padding: 16 }}>Loading...</div>
  }

  // Load cases via entity-specific RPC with correct param type
  useEffect(() => {
    async function loadEntity() {
      if (!entityId) return
      try {
        // entity info
        const { data: eData, error: eErr } = await supabase
          .from('network_entities')
          .select('name, entity_type')
          .eq('id', entityId)
          .single()
        if (!eErr && eData) setEntityInfo({ name: eData.name, type: eData.entity_type })

        // entity cases
        const { data: cData, error: cErr } = await supabase.rpc('get_entity_cases_with_locations', {
          entity_id_param: String(entityId),
        })
        if (cErr) throw cErr
        setCases(cData || [])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load entity cases:', err)
        setCases([])
      } finally {
        setLoading(false)
      }
    }
    loadEntity()
  }, [entityId])

  if (!loading) {
    const params = new URLSearchParams()
    params.set('entityId', String(entityId))
    if (entityInfo?.name) params.set('entityName', entityInfo.name)
    return <Navigate to={`/cases?${params.toString()}`} state={{ preloadedCases: cases }} replace />
  }

  return <div style={{ padding: 16 }}>Loading entity details…</div>
}


