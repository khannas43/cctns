import React from 'react'
import { useEnhancedPatterns } from '../hooks/useEnhancedPatterns'

const EnhancedPatternsTest: React.FC = () => {
  const { data, loading, error } = useEnhancedPatterns()

  if (loading) {
    return <div className="p-4">🧠 Loading enhanced patterns...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">❌ Error: {error}</div>
  }

  if (!data) {
    return <div className="p-4">No data available</div>
  }

  const patterns = data.enhanced_pattern_insights || []
  const entities = data.detailed_entities || []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧠 Enhanced Pattern Analysis Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold text-blue-600">{patterns.length}</div>
          <div className="text-sm text-blue-800">Total Patterns</div>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <div className="text-2xl font-bold text-orange-600">{entities.length}</div>
          <div className="text-sm text-orange-800">High-Risk Entities</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold text-green-600">{patterns.filter((p: any) => (p.confidence_level || 0) >= 85).length}</div>
          <div className="text-sm text-green-800">High Confidence Patterns</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pattern Summary:</h2>
        {patterns.map((pattern: any, index: number) => (
          <div key={index} className="border p-4 rounded">
            <h3 className="font-semibold">{String(pattern.pattern_name || '').replace(/_/g, ' ')}</h3>
            <div className="text-sm text-gray-600">
              {pattern.entity_count} entities • Risk: {pattern.avg_risk_score} • Confidence: {pattern.confidence_level}%
            </div>
            <p className="text-sm mt-2">{pattern.pattern_definition}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EnhancedPatternsTest


