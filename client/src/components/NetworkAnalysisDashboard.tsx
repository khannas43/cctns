import React, { useState, useEffect } from 'react'
import { useNetworkAnalysis } from '../hooks/useNetworkAnalysis'

const NetworkAnalysisDashboard: React.FC = () => {
  const {
    analysisData,
    patternInsights,
    detailedEntities,
    loading,
    error,
    lastUpdated,
    refresh,
    getCriticalEntities,
    getRiskDistribution,
    exportData,
  } = useNetworkAnalysis()

  const [criticalEntities, setCriticalEntities] = useState<any[]>([])
  const [riskDistribution, setRiskDistribution] = useState<any | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [critical, distribution] = await Promise.all([
          getCriticalEntities(85),
          getRiskDistribution(),
        ])

        setCriticalEntities(critical)
        setRiskDistribution(distribution)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Dashboard data loading error:', err)
      }
    }

    if (analysisData) {
      loadDashboardData()
    }
  }, [analysisData, getCriticalEntities, getRiskDistribution])

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const exportedData = await exportData(format)
      if (!exportedData) return

      if (format === 'json') {
        const blob = new Blob([exportedData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `network_analysis_${new Date().toISOString().split('T')[0]}.json`
        a.click()
      } else if (format === 'csv') {
        const blob = new Blob([exportedData], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `network_analysis_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">🔍 Analyzing network patterns...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">❌ Error: {error}</div>
        <button onClick={refresh} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CCTNS Network Analysis Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            🔄 Refresh
          </button>
          <button onClick={() => handleExport('json')} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            📊 Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
            📈 Export CSV
          </button>
        </div>
      </div>

      {lastUpdated && <div className="text-sm text-gray-600">Last updated: {lastUpdated.toLocaleString()}</div>}

      {riskDistribution && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">CRITICAL</h3>
            <p className="text-2xl font-bold text-red-600">{riskDistribution.distribution.CRITICAL}</p>
            <p className="text-sm text-red-600">≥85 points</p>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">HIGH</h3>
            <p className="text-2xl font-bold text-orange-600">{riskDistribution.distribution.HIGH}</p>
            <p className="text-sm text-orange-600">70-84 points</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">MEDIUM</h3>
            <p className="text-2xl font-bold text-yellow-600">{riskDistribution.distribution.MEDIUM}</p>
            <p className="text-sm text-yellow-600">50-69 points</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">LOW</h3>
            <p className="text-2xl font-bold text-green-600">{riskDistribution.distribution.LOW}</p>
            <p className="text-sm text-green-600">35-49 points</p>
          </div>
        </div>
      )}

      {criticalEntities.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">🚨 {criticalEntities.length} Critical Entities Requiring Immediate Attention</h2>
          <div className="space-y-2">
            {criticalEntities.slice(0, 5).map((entity) => (
              <div key={entity.entity_id} className="flex justify-between items-center">
                <span className="font-medium">
                  {entity.name} ({entity.district})
                </span>
                <span className="bg-red-100 px-2 py-1 rounded text-red-800 text-sm">Risk: {entity.calculated_risk_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Behavioral Pattern Analysis</h2>
        <div className="space-y-4">
          {patternInsights.map((pattern: any, index: number) => (
            <div key={index} className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-semibold">{pattern.behavioral_pattern}</h3>
              <p className="text-sm text-gray-600">{pattern.pattern_definition}</p>
              <div className="mt-2 text-sm">
                <span className="bg-blue-100 px-2 py-1 rounded mr-2">Entities: {pattern.entity_count}</span>
                <span className="bg-purple-100 px-2 py-1 rounded">Avg Risk: {pattern.ai_risk_score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">High-Risk Entities Detail</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activities</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connections</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detailedEntities.slice(0, 10).map((entity: any) => (
                <tr key={entity.entity_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{entity.name}</div>
                    <div className="text-sm text-gray-500">{entity.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.district}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entity.pattern === 'RAPID_NETWORK_EXPANSION'
                          ? 'bg-red-100 text-red-800'
                          : entity.pattern === 'HIGH_INFLUENCE_HUB'
                          ? 'bg-orange-100 text-orange-800'
                          : entity.pattern === 'HIGH_ACTIVITY'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {entity.pattern}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-bold ${
                        entity.calculated_risk_score >= 85
                          ? 'text-red-600'
                          : entity.calculated_risk_score >= 70
                          ? 'text-orange-600'
                          : entity.calculated_risk_score >= 50
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {entity.calculated_risk_score}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Total: {entity.total_activities}</div>
                    <div className="text-xs text-gray-500">Recent: {entity.recent_activities}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Total: {entity.total_relationships}</div>
                    <div className="text-xs text-gray-500">
                      New: {entity.new_relationships_90_days} | Strength: {(entity.avg_connection_strength ?? 0).toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default NetworkAnalysisDashboard


