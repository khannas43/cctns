export type NetworkAnalysis = {
  pattern_insights: PatternInsight[]
  detailed_entities: DetailedEntity[]
  ai_methodology: AiMethodology
}

export type PatternInsight = {
  behavioral_pattern: string
  entity_count: number
  avg_activities: number
  avg_connections: number
  avg_connection_strength: number
  ai_risk_score: number
  score_breakdown: ScoreBreakdown
  pattern_definition: string
  risk_explanation: string
  criteria_thresholds: Record<string, string>
  criteria_explanation: string
}

export type DetailedEntity = {
  entity_id: number | string
  name: string
  type: string
  district: string
  pattern: string
  total_activities: number
  recent_activities: number
  total_relationships: number
  new_relationships_90_days: number
  avg_connection_strength: number
  calculated_risk_score?: number
  risk_factors?: RiskFactors
  why_flagged: string
  operational_significance?: string
}

export type RiskFactors = {
  base_score: number
  rapid_expansion_points?: number
  high_influence_points?: number
  network_size_points?: number
  activity_points?: number
  coordination_bonus?: number
}

export type ScoreBreakdown = {
  base_score: number
  rapid_expansion_bonus?: number
  influence_bonus?: number
  network_size_bonus?: number
  activity_bonus?: number
  coordination_bonus?: number
}

export type AiMethodology = {
  algorithm_name: string
  version: string
  base_score: number
  max_score: number
  scoring_factors: ScoringFactor[]
  risk_classifications: Record<string, string>
}

export type ScoringFactor = {
  factor: string
  weight: number
  criteria: string
  rationale: string
}


