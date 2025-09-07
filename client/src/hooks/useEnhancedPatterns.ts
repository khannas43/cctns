import { useState, useEffect, useCallback } from 'react'
import { enhancedNetworkAnalysisService } from '../services/enhancedNetworkAnalysisService'

type EnhancedAnalysis = any

export const useEnhancedPatterns = () => {
  const [data, setData] = useState<EnhancedAnalysis | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await enhancedNetworkAnalysisService.getEnhancedPatternAnalysis()
      setData(result)
    } catch (err: any) {
      setError(err?.message || 'Failed to load enhanced pattern analysis')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}


