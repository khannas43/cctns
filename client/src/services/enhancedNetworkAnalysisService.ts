import { supabase } from '../lib/supabase'

class EnhancedNetworkAnalysisService {
  async getEnhancedPatternAnalysis(): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.log('🧠 Initiating enhanced pattern analysis...')

      const { data, error } = await supabase.rpc('get_enhanced_pattern_analysis')

      if (error) {
        // Handle long-running queries by falling back to basic analysis
        if (String(error.message || '').toLowerCase().includes('statement timeout')) {
          // eslint-disable-next-line no-console
          console.warn('⏱️ Enhanced analysis timed out, falling back to basic analysis')
          const { data: basic, error: basicErr } = await supabase.rpc('get_advanced_pattern_analysis')
          if (basicErr) {
            throw new Error(`Enhanced analysis error: ${error.message}; Fallback failed: ${basicErr.message}`)
          }
          return {
            enhanced_pattern_insights: basic?.pattern_insights || [],
            detailed_entities: basic?.detailed_entities || [],
          }
        }
        throw new Error(`Enhanced analysis error: ${error.message}`)
      }

      // eslint-disable-next-line no-console
      console.log('✅ Enhanced analysis completed successfully')
      // eslint-disable-next-line no-console
      console.log(`🎯 Found ${data?.enhanced_pattern_insights?.length || 0} enhanced behavioral patterns`)

      return data
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🚨 Enhanced analysis service error:', error)
      throw error
    }
  }

  async getCriticalPatterns(): Promise<any[]> {
    const data = await this.getEnhancedPatternAnalysis()
    return (
      data?.enhanced_pattern_insights?.filter(
        (pattern: any) =>
          String(pattern?.threat_assessment || '').startsWith('EXTREME') ||
          String(pattern?.threat_assessment || '').startsWith('CRITICAL'),
      ) || []
    )
  }

  async getHighConfidenceEntities(minConfidence = 85): Promise<any[]> {
    const data = await this.getEnhancedPatternAnalysis()
    return (
      data?.detailed_entities?.filter((entity: any) => Number(entity?.confidence_score || 0) >= minConfidence) || []
    )
  }
}

export const enhancedNetworkAnalysisService = new EnhancedNetworkAnalysisService()


