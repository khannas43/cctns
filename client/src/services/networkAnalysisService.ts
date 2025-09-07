import { supabase } from '../lib/supabase'
import type {
  NetworkAnalysis,
  DetailedEntity,
  PatternInsight,
} from '../types/network'

class NetworkAnalysisService {
  /**
   * Fetch advanced pattern analysis from PostgreSQL function
   * @returns Complete network analysis results
   */
  async getAdvancedPatternAnalysis(): Promise<NetworkAnalysis> {
    try {
      // eslint-disable-next-line no-console
      console.log('🔍 Initiating advanced pattern analysis...')

      const { data, error } = await supabase.rpc('get_advanced_pattern_analysis')

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Analysis error:', error)
        throw new Error(`Database function error: ${error.message}`)
      }

      if (!data) {
        throw new Error('No analysis data returned from function')
      }

      // eslint-disable-next-line no-console
      console.log('✅ Analysis completed successfully')
      // eslint-disable-next-line no-console
      console.log(`📊 Found ${data.pattern_insights?.length || 0} behavioral patterns`)
      // eslint-disable-next-line no-console
      console.log(`🎯 Identified ${data.detailed_entities?.length || 0} high-risk entities`)

      return data as unknown as NetworkAnalysis
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🚨 Network analysis service error:', error)
      throw error
    }
  }

  /**
   * Get entities filtered by risk score threshold
   * @param minRiskScore Minimum risk score threshold
   * @returns Filtered high-risk entities
   */
  async getCriticalEntities(minRiskScore = 85): Promise<DetailedEntity[]> {
    try {
      const analysisData = await this.getAdvancedPatternAnalysis()

      const criticalEntities = (analysisData.detailed_entities || []).filter(
        (entity: DetailedEntity) => (entity.calculated_risk_score || 0) >= minRiskScore,
      )

      // eslint-disable-next-line no-console
      console.log(`🚨 Found ${criticalEntities.length} critical entities (score >= ${minRiskScore})`)

      return criticalEntities
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching critical entities:', error)
      throw error
    }
  }

  /**
   * Get pattern insights summary for dashboard
   */
  async getPatternInsights(): Promise<PatternInsight[]> {
    try {
      const analysisData = await this.getAdvancedPatternAnalysis()
      return analysisData.pattern_insights || []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching pattern insights:', error)
      throw error
    }
  }

  /**
   * Get entities by behavioral pattern type
   */
  async getEntitiesByPattern(patternType: string): Promise<DetailedEntity[]> {
    try {
      const analysisData = await this.getAdvancedPatternAnalysis()

      const filteredEntities = (analysisData.detailed_entities || []).filter(
        (entity: DetailedEntity) => String(entity.pattern) === patternType,
      )

      // eslint-disable-next-line no-console
      console.log(`📋 Found ${filteredEntities.length} entities with pattern: ${patternType}`)

      return filteredEntities
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching entities by pattern ${patternType}:`, error)
      throw error
    }
  }

  /**
   * Get risk distribution summary
   */
  async getRiskDistribution(): Promise<{
    distribution: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }
    total: number
    methodology: NetworkAnalysis['ai_methodology']
  }> {
    try {
      const analysisData = await this.getAdvancedPatternAnalysis()
      const entities = analysisData.detailed_entities || []

      const distribution = {
        CRITICAL: entities.filter((e) => (e.calculated_risk_score || 0) >= 85).length,
        HIGH: entities.filter((e) => (e.calculated_risk_score || 0) >= 70 && (e.calculated_risk_score || 0) < 85).length,
        MEDIUM: entities.filter((e) => (e.calculated_risk_score || 0) >= 50 && (e.calculated_risk_score || 0) < 70).length,
        LOW: entities.filter((e) => (e.calculated_risk_score || 0) >= 35 && (e.calculated_risk_score || 0) < 50).length,
      }

      // eslint-disable-next-line no-console
      console.log('📈 Risk distribution calculated:', distribution)

      return {
        distribution,
        total: entities.length,
        methodology: analysisData.ai_methodology,
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error calculating risk distribution:', error)
      throw error
    }
  }

  /**
   * Export analysis results to different formats
   * @param format Export format ('json', 'csv')
   */
  async exportAnalysisData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const analysisData = await this.getAdvancedPatternAnalysis()

      switch (format) {
        case 'json':
          return JSON.stringify(analysisData, null, 2)

        case 'csv':
          return this.convertToCSV(analysisData.detailed_entities)

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting analysis data:', error)
      throw error
    }
  }

  /** Convert entities data to CSV format */
  private convertToCSV(entities?: DetailedEntity[] | null): string {
    if (!entities || entities.length === 0) return ''

    const headers = [
      'Entity ID',
      'Name',
      'Type',
      'District',
      'Pattern',
      'Risk Score',
      'Total Activities',
      'Recent Activities',
      'Total Relationships',
      'New Relationships (90d)',
      'Avg Connection Strength',
      'Why Flagged',
    ]

    const csvRows = entities.map((entity) => [
      String(entity.entity_id),
      `"${entity.name}"`,
      entity.type,
      entity.district,
      entity.pattern,
      String(entity.calculated_risk_score ?? ''),
      String(entity.total_activities ?? ''),
      String(entity.recent_activities ?? ''),
      String(entity.total_relationships ?? ''),
      String(entity.new_relationships_90_days ?? ''),
      String(entity.avg_connection_strength ?? ''),
      `"${(entity.why_flagged || '').replace(/"/g, '""')}"`,
    ])

    return [headers, ...csvRows]
      .map((row) => row.join(','))
      .join('\n')
  }
}

// Export singleton instance
export const networkAnalysisService = new NetworkAnalysisService()


