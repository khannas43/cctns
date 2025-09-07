import { useState, useEffect, useCallback } from 'react'
import { networkAnalysisService } from '../services/networkAnalysisService'
import type { NetworkAnalysis, DetailedEntity } from '../types/network'

export const useNetworkAnalysis = () => {
  const [analysisData, setAnalysisData] = useState<NetworkAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (loading) return
      if (analysisData && !forceRefresh) return

      setLoading(true)
      setError(null)

      try {
        const data = await networkAnalysisService.getAdvancedPatternAnalysis()
        setAnalysisData(data)
        setLastUpdated(new Date())
        // eslint-disable-next-line no-console
        console.log('✅ Network analysis data updated')
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch network analysis')
        // eslint-disable-next-line no-console
        console.error('❌ Failed to fetch network analysis:', err)
      } finally {
        setLoading(false)
      }
    },
    [loading, analysisData],
  )

  const getCriticalEntities = useCallback(async (minScore = 85): Promise<DetailedEntity[]> => {
    try {
      return await networkAnalysisService.getCriticalEntities(minScore)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch critical entities')
      return []
    }
  }, [])

  const patternInsights = analysisData?.pattern_insights || []
  const detailedEntities = analysisData?.detailed_entities || []

  const getRiskDistribution = useCallback(async () => {
    try {
      return await networkAnalysisService.getRiskDistribution()
    } catch (err: any) {
      setError(err?.message || 'Failed to calculate risk distribution')
      return null
    }
  }, [])

  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      return await networkAnalysisService.exportAnalysisData(format)
    } catch (err: any) {
      setError(err?.message || 'Failed to export data')
      return null
    }
  }, [])

  useEffect(() => {
    // initial fetch
    fetchAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // Data
    analysisData,
    patternInsights,
    detailedEntities,

    // State
    loading,
    error,
    lastUpdated,

    // Actions
    refresh: () => fetchAnalysis(true),
    getCriticalEntities,
    getRiskDistribution,
    exportData,

    // Utilities (fresh within 5 minutes)
    isDataFresh: !!(lastUpdated && Date.now() - lastUpdated.getTime() < 300000),
  }
}


