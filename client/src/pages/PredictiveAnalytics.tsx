import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, BarChart, Bar } from 'recharts'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'

type RiskData = any
type TemporalData = any
type HotspotsData = any

const RiskRatingCriteria: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Risk Rating Methodology
      </h3>
      
      {/* Risk Level Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="border-l-4 border-red-500 pl-4">
          <h4 className="font-semibold text-red-700 mb-2">HIGH RISK (70-100)</h4>
          <p className="text-sm text-gray-600">
            Districts with frequent cases, active supplier networks, recent seizures, 
            and strong entity relationships indicating high drug trafficking activity.
          </p>
        </div>
        <div className="border-l-4 border-yellow-500 pl-4">
          <h4 className="font-semibold text-yellow-700 mb-2">MEDIUM RISK (40-69)</h4>
          <p className="text-sm text-gray-600">
            Districts with moderate case activity, some network presence, 
            and intermittent drug-related incidents requiring monitoring.
          </p>
        </div>
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-green-700 mb-2">LOW RISK (0-39)</h4>
          <p className="text-sm text-gray-600">
            Districts with minimal case activity, limited network presence, 
            and low drug trafficking indicators.
          </p>
        </div>
      </div>

      {/* Scoring Factors */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Risk Score Calculation Factors:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center py-1">
              <span className="text-gray-600">Total Cases (Historical):</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">8x</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-gray-600">Recent Cases (30 days):</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">25x</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-gray-600">Supplier Entities:</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">12x</span>
            </div>
          </div>
          <div>
            <div className="flex items-center py-1">
              <span className="text-gray-600">Transporter Entities:</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">10x</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-gray-600">Network Relationships:</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">3x</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Final Score:</span>
              <span className="font-medium">Average of all factors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">Interpretation Guide:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Recent activity</strong> is weighted highest as it indicates current threats</li>
          <li>• <strong>Supplier presence</strong> suggests organized trafficking operations</li>
          <li>• <strong>Network density</strong> indicates operational sophistication</li>
          <li>• Scores are updated in real-time based on new case data</li>
        </ul>
      </div>
    </div>
  )
}

const RiskBreakdown: React.FC<{ district: any }> = ({ district }) => {
  return (
    <div className="bg-gray-50 p-4 rounded mt-2">
      <h5 className="font-semibold mb-3">Risk Score Breakdown for {district.name}</h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex justify-between py-1">
            <span>Case Activity:</span>
            <span className="font-medium">{district.risk_scores.case_activity}/100</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Recent Activity:</span>
            <span className="font-medium">{district.risk_scores.recent_activity}/100</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Supplier Risk:</span>
            <span className="font-medium">{district.risk_scores.supplier_presence}/100</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between py-1">
            <span>Transport Network:</span>
            <span className="font-medium">{district.risk_scores.transport_network}/100</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Network Density:</span>
            <span className="font-medium">{district.risk_scores.network_density}/100</span>
          </div>
          <div className="flex justify-between py-1 border-t pt-1">
            <span className="font-semibold">Overall Score:</span>
            <span className="font-bold">{district.risk_scores.overall}/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const QuickReferencePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="fixed bottom-4 right-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700"
      >
        Risk Guide
      </button>
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Quick Risk Reference</h4>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>HIGH: Active trafficking hub</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>MEDIUM: Moderate activity</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>LOW: Minimal activity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PredictiveAnalytics() {
  const navigate = useNavigate()
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [temporalData, setTemporalData] = useState<TemporalData | null>(null)
  const [hotspotsData, setHotspotsData] = useState<HotspotsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'trends' | 'hotspots'>('overview')
  const [karnatakaRiskData, setKarnatakaRiskData] = useState<any | null>(null)
  const [mapBounds] = useState({ north: 18.4, south: 11.5, east: 78.6, west: 74.0 })

  const karnatakaDistricts: Record<string, { lat: number; lng: number }> = {
    'Bangalore Urban': { lat: 12.9716, lng: 77.5946 },
    'Bangalore Rural': { lat: 13.2846, lng: 77.3821 },
    Mysore: { lat: 12.2958, lng: 76.6394 },
    Davanagere: { lat: 14.4644, lng: 75.9176 },
    'Hubli-Dharwad': { lat: 15.3647, lng: 75.124 },
    Mangalore: { lat: 12.9141, lng: 74.856 },
    Belagavi: { lat: 15.8497, lng: 74.4977 },
    Tumakuru: { lat: 13.3379, lng: 77.1025 },
    Udupi: { lat: 13.3409, lng: 74.7421 },
    Shimoga: { lat: 13.9299, lng: 75.5681 },
    Chitradurga: { lat: 14.2251, lng: 76.396 },
    Hassan: { lat: 13.0033, lng: 76.0969 },
    Mandya: { lat: 12.5218, lng: 76.8951 },
    Kolar: { lat: 13.1378, lng: 78.1294 },
    Chikkaballapur: { lat: 13.4355, lng: 77.7315 },
    Ramanagara: { lat: 12.7172, lng: 77.2824 },
    Bidar: { lat: 17.9103, lng: 77.5207 },
    Gulbarga: { lat: 17.3297, lng: 76.8343 },
    Raichur: { lat: 16.212, lng: 77.3439 },
    Koppal: { lat: 15.35, lng: 76.1547 },
    Gadag: { lat: 15.4167, lng: 75.6333 },
    Haveri: { lat: 14.7951, lng: 75.4065 },
    Dharwad: { lat: 15.4589, lng: 75.0078 },
    'Uttara Kannada': { lat: 14.7937, lng: 74.6857 },
    Bagalkote: { lat: 16.1651, lng: 75.6946 },
    Vijayapur: { lat: 16.8302, lng: 75.71 },
    Ballari: { lat: 15.1394, lng: 76.9214 },
    Chikkamagaluru: { lat: 13.3161, lng: 75.772 },
    'Dakshina Kannada': { lat: 12.8438, lng: 75.2479 },
    Kodagu: { lat: 12.4244, lng: 75.7382 },
    Chamarajanagar: { lat: 11.9258, lng: 76.9437 },
    Yadgir: { lat: 16.7524, lng: 77.1427 },
  }

  // Robust Karnataka filter: accepts official names, common synonyms, or state==='Karnataka'
  function normalizeName(name: string): string {
    return (name || '')
      .toLowerCase()
      .trim()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
  }

  const acceptedNames = [
    'bangalore urban',
    'bengaluru urban',
    'bangalore rural',
    'bengaluru rural',
    'mysore',
    'mysuru',
    'davanagere',
    'hubli dharwad',
    'hubballi dharwad',
    'mangalore',
    'mangaluru',
    'belagavi',
    'belgaum',
    'tumakuru',
    'tumkur',
    'udupi',
    'shivamogga',
    'shimoga',
    'chitradurga',
    'hassan',
    'mandya',
    'kolar',
    'chikkaballapur',
    'chikballapur',
    'ramanagara',
    'bidar',
    'kalaburagi',
    'gulbarga',
    'raichur',
    'koppal',
    'gadag',
    'haveri',
    'dharwad',
    'uttara kannada',
    'karwar',
    'bagalkote',
    'bagalkot',
    'vijayapur',
    'vijayapura',
    'ballari',
    'bellary',
    'chikkamagaluru',
    'chikmagalur',
    'dakshina kannada',
    'south kanara',
    'kodagu',
    'coorg',
    'chamarajanagar',
    'yadgir',
  ]

  const acceptedSet = new Set(acceptedNames)

  function filterKarnatakaOnly(districtRisks: any[] = []): any[] {
    return districtRisks
      .filter((d) => !!d)
      .filter((d) => {
        const state = String(d.state || '').toLowerCase().trim()
        const dn = normalizeName(d.district_name || d.name)
        if (state === 'karnataka') return true
        if (acceptedSet.has(dn)) return true
        return false
      })
      .reduce((acc: any[], cur: any) => {
        // de-duplicate by normalized district name
        const dn = normalizeName(cur.district_name || cur.name)
        if (!acc.some((x) => normalizeName(x.district_name || x.name) === dn)) acc.push(cur)
        return acc
      }, [])
  }
  function normalizeName(name: string): string {
    return (name || '')
      .toLowerCase()
      .trim()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
  }
  function isKarnatakaDistrictName(name: string): boolean {
    return acceptedSet.has(normalizeName(name || ''))
  }
  function isKarnatakaStateName(state: string): boolean {
    return String(state || '').toLowerCase().trim() === 'karnataka'
  }
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true)
      try {
        const { data: riskAnalysis, error: riskError } = await supabase.rpc('get_district_risk_analysis')
        if (riskError) throw riskError
        const { data: temporalPatterns, error: temporalError } = await supabase.rpc('get_temporal_patterns')
        if (temporalError) throw temporalError
        const { data: hotspots, error: hotspotsError } = await supabase.rpc('detect_drug_hotspots', { lookback_days: 30 })
        if (hotspotsError) throw hotspotsError
        const hasRisk = !!riskAnalysis && (Array.isArray(riskAnalysis?.districts) ? riskAnalysis.districts.length > 0 : true)
        const hasTemporal = !!temporalPatterns && (Array.isArray(temporalPatterns?.monthly_trends) ? temporalPatterns.monthly_trends.length > 0 : true)
        const hasHotspots = !!hotspots && (Array.isArray(hotspots?.hotspots) ? hotspots.hotspots.length > 0 : true)

        if (hasRisk) {
          if (Array.isArray((riskAnalysis as any)?.districts)) {
            const filteredDistricts = (riskAnalysis as any).districts.filter(
              (d: any) => isKarnatakaDistrictName(d?.name) || isKarnatakaStateName(d?.state),
            )
            const avg = filteredDistricts.length
              ? Math.round(
                  filteredDistricts.reduce((sum: number, it: any) => sum + (it?.risk_scores?.overall || 0), 0) /
                    filteredDistricts.length,
                )
              : 0
            const summary = {
              high_risk_districts: filteredDistricts.filter((d: any) => d?.risk_level === 'HIGH').length,
              medium_risk_districts: filteredDistricts.filter((d: any) => d?.risk_level === 'MEDIUM').length,
              low_risk_districts: filteredDistricts.filter((d: any) => d?.risk_level === 'LOW').length,
              average_risk_score: avg,
            }
            setRiskData({ ...(riskAnalysis as any), districts: filteredDistricts, summary })
          } else {
            setRiskData(riskAnalysis)
          }
        }
        if (hasTemporal) setTemporalData(temporalPatterns)
        if (hasHotspots) {
          const list = Array.isArray((hotspots as any)?.hotspots) ? (hotspots as any).hotspots : []
          const filteredHotspots = list.filter(
            (h: any) => isKarnatakaDistrictName(h?.district_name) || isKarnatakaStateName(h?.state),
          )
          const summary = {
            critical_alerts: filteredHotspots.filter((h: any) => h?.alert_level === 'CRITICAL').length,
            high_alerts: filteredHotspots.filter((h: any) => h?.alert_level === 'HIGH').length,
            medium_alerts: filteredHotspots.filter((h: any) => h?.alert_level === 'MEDIUM').length,
            districts_with_increased_activity: filteredHotspots.filter((h: any) => (h?.comparison?.activity_increase_percent || 0) > 0).length,
          }
          setHotspotsData({ summary, hotspots: filteredHotspots })
        }

        if (!hasRisk || !hasTemporal || !hasHotspots) {
          await loadFallbackAnalytics(!hasRisk, !hasTemporal, !hasHotspots)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching analytics data:', err)
        await loadFallbackAnalytics(true, true, true)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalyticsData()
  }, [])

  // Karnataka-only risk data load: RPC with fallback from existing overview data
  useEffect(() => {
    async function fetchKarnatakaRisk() {
      try {
        const { data, error } = await supabase.rpc('get_district_risk_scores')
        if (!error && data) {
          const filtered = { ...data, district_risks: filterKarnatakaOnly(data.district_risks) }
          setKarnatakaRiskData(filtered)
          return
        }
      } catch (_) {
        // ignore and fallback
      }

      // Fallback from riskData if available
      if (riskData?.districts?.length) {
        const fromOverview = (riskData.districts as any[]).map((d) => ({
          district_name: d.name,
          state: 'Karnataka',
          risk_level: d.risk_level || (d.risk_scores?.overall >= 70 ? 'HIGH' : d.risk_scores?.overall >= 40 ? 'MEDIUM' : 'LOW'),
          risk_score: d.risk_scores?.overall ?? 0,
          total_cases: d.metrics?.total_cases ?? 0,
          recent_cases: 0,
        }))
        setKarnatakaRiskData({ district_risks: filterKarnatakaOnly(fromOverview) })
      }
    }
    fetchKarnatakaRisk()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskData])

  const KarnatakaRiskMap: React.FC = () => (
    <div className="h-96 bg-gray-100 rounded-lg relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow p-3">
        <h4 className="font-semibold text-sm mb-2">Karnataka District Risk Levels</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>High Risk (50+)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Medium Risk (25-49)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Low Risk (0-24)</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-6 gap-2 p-4">
          {karnatakaRiskData?.district_risks?.map((district: any, index: number) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${
                district.risk_level === 'HIGH'
                  ? 'bg-red-500 text-white'
                  : district.risk_level === 'MEDIUM'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
              title={`${district.district_name}: ${district.total_cases} cases, Risk Score: ${district.risk_score}`}
            >
              <div className="text-xs font-semibold truncate">{district.district_name}</div>
              <div className="text-lg font-bold">{district.risk_score}</div>
              <div className="text-xs">{district.total_cases} cases</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  async function loadFallbackAnalytics(needsRisk: boolean, needsTemporal: boolean, needsHotspots: boolean) {
    try {
      // Load base tables
      const [{ data: districts }, { data: entities }, { data: cases }] = await Promise.all([
        supabase.from('districts').select('id, name, latitude, longitude').limit(1000),
        supabase.from('network_entities').select('id, district_id, entity_type').limit(50000),
        supabase.from('cctns_case_data').select('id, district_id, created_at').limit(50000),
      ])

      const districtListAll = Array.isArray(districts) ? districts : []
      const districtList = districtListAll.filter((d: any) => isKarnatakaDistrictName(d?.name) || isKarnatakaStateName(d?.state))
      const entityList = Array.isArray(entities) ? entities : []
      const caseList = Array.isArray(cases) ? cases : []
      const allowedDistrictIds = new Set<string>(districtList.map((d: any) => d.id))

      // Build counts by district
      const entitiesByDistrict = new Map<string, number>()
      const supplierCountByDistrict = new Map<string, number>()
      const transporterCountByDistrict = new Map<string, number>()
      for (const e of entityList) {
        if (!e?.district_id || !allowedDistrictIds.has(e.district_id)) continue
        entitiesByDistrict.set(e.district_id, (entitiesByDistrict.get(e.district_id) || 0) + 1)
        if (e.entity_type === 'supplier') {
          supplierCountByDistrict.set(e.district_id, (supplierCountByDistrict.get(e.district_id) || 0) + 1)
        }
        if (e.entity_type === 'transporter') {
          transporterCountByDistrict.set(e.district_id, (transporterCountByDistrict.get(e.district_id) || 0) + 1)
        }
      }

      const casesByDistrict = new Map<string, number>()
      const casesByMonth = new Map<string, number>()
      const casesByDistrictLast30 = new Map<string, number>()
      const casesByDistrictPrev30 = new Map<string, number>()
      const now = new Date()
      const dayMs = 24 * 60 * 60 * 1000
      for (const c of caseList) {
        if (!c) continue
        const dId = c.district_id
        if (!allowedDistrictIds.has(dId)) continue
        casesByDistrict.set(dId, (casesByDistrict.get(dId) || 0) + 1)
        const createdAt = c.created_at ? new Date(c.created_at) : null
        if (createdAt && !Number.isNaN(createdAt.getTime())) {
          const ym = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
          casesByMonth.set(ym, (casesByMonth.get(ym) || 0) + 1)
          const deltaDays = Math.floor((now.getTime() - createdAt.getTime()) / dayMs)
          if (deltaDays <= 30) {
            casesByDistrictLast30.set(dId, (casesByDistrictLast30.get(dId) || 0) + 1)
          } else if (deltaDays > 30 && deltaDays <= 60) {
            casesByDistrictPrev30.set(dId, (casesByDistrictPrev30.get(dId) || 0) + 1)
          }
        }
      }

      // Helper to compute trend per district
      function trendForDistrict(dId: string) {
        const last30 = casesByDistrictLast30.get(dId) || 0
        const prev30 = casesByDistrictPrev30.get(dId) || 0
        if (last30 > prev30) return 'increasing'
        if (last30 < prev30) return 'decreasing'
        return 'stable'
      }

      if (needsRisk) {
        const districtsShaped = districtList.map((d: any) => {
          const totalCases = casesByDistrict.get(d.id) || 0
          const totalEntities = entitiesByDistrict.get(d.id) || 0
          const last30 = casesByDistrictLast30.get(d.id) || 0
          const suppliers = supplierCountByDistrict.get(d.id) || 0
          const transporters = transporterCountByDistrict.get(d.id) || 0
          // Weighted sub-scores (clamped 0-100) aligned with displayed methodology
          const case_activity = Math.min(100, Math.round(totalCases * 8))
          const recent_activity = Math.min(100, Math.round(last30 * 25))
          const supplier_presence = Math.min(100, Math.round(suppliers * 12))
          const transport_network = Math.min(100, Math.round(transporters * 10))
          const network_density = Math.min(100, Math.round(totalEntities * 3))
          const overall = Math.round(
            (case_activity + recent_activity + supplier_presence + transport_network + network_density) / 5,
          )
          const risk_level = overall >= 70 ? 'HIGH' : overall >= 40 ? 'MEDIUM' : 'LOW'
          return {
            id: d.id,
            name: d.name,
            latitude: d.latitude ?? 15.3173,
            longitude: d.longitude ?? 75.7139,
            risk_level,
            risk_scores: {
              overall,
              case_activity,
              recent_activity,
              supplier_presence,
              transport_network,
              network_density,
            },
            metrics: { total_cases: totalCases, total_entities: totalEntities },
            trend: trendForDistrict(d.id),
          }
        })
        const avg = districtsShaped.length
          ? Math.round(
              districtsShaped.reduce((sum: number, it: any) => sum + (it.risk_scores?.overall || 0), 0) /
                districtsShaped.length,
            )
          : 0
        setRiskData({
          summary: {
            high_risk_districts: districtsShaped.filter((d: any) => d.risk_level === 'HIGH').length,
            medium_risk_districts: districtsShaped.filter((d: any) => d.risk_level === 'MEDIUM').length,
            low_risk_districts: districtsShaped.filter((d: any) => d.risk_level === 'LOW').length,
            average_risk_score: avg,
          },
          districts: districtsShaped,
        })
      }

      if (needsTemporal) {
        // Build last 12 months series
        const series: { month: string; cases: number }[] = []
        const dt = new Date()
        for (let i = 11; i >= 0; i--) {
          const d = new Date(dt.getFullYear(), dt.getMonth() - i, 1)
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          series.push({ month: ym, cases: casesByMonth.get(ym) || 0 })
        }
        // 3-month moving average
        const withMA = series.map((pt, idx) => {
          const start = Math.max(0, idx - 2)
          const slice = series.slice(start, idx + 1)
          const avg = Math.round(slice.reduce((s, x) => s + x.cases, 0) / slice.length)
          return { ...pt, moving_average: avg }
        })
        // Simple seasonal grouping by month to season
        const seasonOf = (m: number) => (m === 12 || m <= 2 ? 'Winter' : m <= 5 ? 'Summer' : m <= 9 ? 'Monsoon' : 'Post-monsoon')
        const seasonAgg = new Map<string, { sum: number; count: number }>()
        for (const pt of series) {
          const [y, m] = pt.month.split('-')
          const season = seasonOf(Number(m))
          const agg = seasonAgg.get(season) || { sum: 0, count: 0 }
          agg.sum += pt.cases
          agg.count += 1
          seasonAgg.set(season, agg)
        }
        const seasonal = Array.from(seasonAgg.entries()).map(([season, agg]) => ({
          season,
          average_cases: Math.round(agg.sum / Math.max(1, agg.count)),
        }))
        setTemporalData({ monthly_trends: withMA, seasonal_patterns: seasonal })
      }

      if (needsHotspots) {
        const base = (riskData?.districts as any[]) || []
        const districtsSrc = base.length ? base : (Array.isArray(districtList) ? districtList : [])
        const compose = (d: any) => {
          const totalCases = casesByDistrict.get(d.id) || 0
          const totalEntities = entitiesByDistrict.get(d.id) || 0
          const scoreRaw = totalCases * 2 + totalEntities * 0.5
          const overall = Math.max(0, Math.min(100, Math.round(scoreRaw)))
          const alert_level = overall >= 85 ? 'CRITICAL' : overall >= 66 ? 'HIGH' : overall >= 33 ? 'MEDIUM' : 'LOW'
          const last30 = casesByDistrictLast30.get(d.id) || 0
          const prev30 = casesByDistrictPrev30.get(d.id) || 0
          const pct = prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100)
          const recommendation =
            alert_level === 'CRITICAL'
              ? 'Immediate task force deployment and targeted surveillance.'
              : alert_level === 'HIGH'
              ? 'Increase patrols and initiate targeted investigations.'
              : alert_level === 'MEDIUM'
              ? 'Monitor trends and allocate resources as needed.'
              : 'Maintain routine monitoring.'
          return {
            district_id: d.id,
            district_name: d.name,
            alert_level,
            hotspot_score: overall,
            activity_metrics: { recent_cases: last30 },
            comparison: { activity_increase_percent: pct },
            recommendation,
          }
        }
        const hotspots = districtsSrc.map(compose).sort((a, b) => b.hotspot_score - a.hotspot_score).slice(0, 15)
        const summary = {
          critical_alerts: hotspots.filter((h) => h.alert_level === 'CRITICAL').length,
          high_alerts: hotspots.filter((h) => h.alert_level === 'HIGH').length,
          medium_alerts: hotspots.filter((h) => h.alert_level === 'MEDIUM').length,
          districts_with_increased_activity: hotspots.filter((h) => h.comparison.activity_increase_percent > 0).length,
        }
        setHotspotsData({ summary, hotspots })
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Fallback analytics load failed:', e)
    }
  }

  function getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return '#EF4444'
      case 'MEDIUM':
        return '#F59E0B'
      case 'LOW':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading predictive analytics...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Risk Overview' },
              { id: 'map', name: 'Geographic Analysis' },
              { id: 'trends', name: 'Temporal Trends' },
              { id: 'hotspots', name: 'Hotspot Detection' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === (tab.id as any)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && riskData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600 mb-2">{riskData.summary.high_risk_districts}</div>
                <div className="text-sm text-gray-600">High Risk Districts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600 mb-2">{riskData.summary.medium_risk_districts}</div>
                <div className="text-sm text-gray-600">Medium Risk Districts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600 mb-2">{riskData.summary.low_risk_districts}</div>
                <div className="text-sm text-gray-600">Low Risk Districts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600 mb-2">{riskData.summary.average_risk_score}</div>
                <div className="text-sm text-gray-600">Average Risk Score</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">District Risk Scores</h3>
              <BarChart width={800} height={400} data={riskData.districts}>
                <CartesianGrid strokeDasharray="3,3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="risk_scores.overall" fill="#3B82F6" />
              </BarChart>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">District Risk Assessment</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entities</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {riskData.districts.map((district: any) => (
                      <React.Fragment key={district.id}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={() => setExpandedDistrict(expandedDistrict === district.id ? null : district.id)}
                                className="mr-3 text-blue-600 hover:text-blue-800"
                              >
                                {expandedDistrict === district.id ? '▼' : '▶'}
                              </button>
                              <span className="font-medium text-gray-900">{district.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                district.risk_level === 'HIGH'
                                  ? 'bg-red-100 text-red-800'
                                  : district.risk_level === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {district.risk_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{district.risk_scores.overall}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{district.metrics.total_cases}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{district.metrics.total_entities}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                district.trend === 'increasing'
                                  ? 'bg-red-100 text-red-800'
                                  : district.trend === 'decreasing'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {district.trend}
                            </span>
                          </td>
                        </tr>
                        {expandedDistrict === district.id && (
                          <tr>
                            <td colSpan={6} className="px-6 pb-6">
                              <RiskBreakdown district={district} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Karnataka State Header */}
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Karnataka State Drug Enforcement Risk Analysis</h3>
                  <p className="text-sm text-orange-700">Comprehensive risk assessment across all {Object.keys(karnatakaDistricts).length} districts of Karnataka</p>
                </div>
              </div>
            </div>

            {/* Risk Overview Stats - Karnataka Only */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{karnatakaRiskData?.district_risks?.filter((d: any) => d.risk_level === 'HIGH').length || 0}</div>
                <div className="text-sm text-gray-600">High Risk Districts</div>
                <div className="text-xs text-gray-500 mt-1">Karnataka State</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600">{karnatakaRiskData?.district_risks?.filter((d: any) => d.risk_level === 'MEDIUM').length || 0}</div>
                <div className="text-sm text-gray-600">Medium Risk Districts</div>
                <div className="text-xs text-gray-500 mt-1">Karnataka State</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{karnatakaRiskData?.district_risks?.filter((d: any) => d.risk_level === 'LOW').length || 0}</div>
                <div className="text-sm text-gray-600">Low Risk Districts</div>
                <div className="text-xs text-gray-500 mt-1">Karnataka State</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{karnatakaRiskData?.district_risks?.reduce((sum: number, d: any) => sum + (d.total_cases || 0), 0) || 0}</div>
                <div className="text-sm text-gray-600">Total Cases</div>
                <div className="text-xs text-gray-500 mt-1">Across Karnataka</div>
              </div>
            </div>

            {/* Karnataka Risk Heat Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Karnataka Districts Risk Heat Map</h3>
              <KarnatakaRiskMap />
            </div>

            
          </div>
        )}

        {activeTab === 'map' && riskData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Karnataka Drug Activity Risk Map</h3>
            <div style={{ height: '600px', width: '100%' }}>
              <MapContainer center={[15.3173, 75.7139]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                {riskData.districts.map((district: any) => (
                  <CircleMarker
                    key={district.id}
                    center={[district.latitude, district.longitude]}
                    radius={Math.max(10, district.risk_scores.overall / 3)}
                    fillColor={getRiskColor(district.risk_level)}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{district.name}</h4>
                        <p>
                          Risk Level: <span className="font-medium">{district.risk_level}</span>
                        </p>
                        <p>Score: {district.risk_scores.overall}</p>
                        <p>Cases: {district.metrics.total_cases}</p>
                        <p>Entities: {district.metrics.total_entities}</p>
                      </div>
                    </Popup>
                    <Tooltip>
                      <div>
                        <strong>{district.name}</strong>
                        <br />
                        Risk: {district.risk_level} ({district.risk_scores.overall})
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {activeTab === 'trends' && temporalData && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Case Trends</h3>
              <LineChart width={800} height={400} data={temporalData.monthly_trends}>
                <CartesianGrid strokeDasharray="3,3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="cases" stroke="#3B82F6" name="Cases" />
                <Line type="monotone" dataKey="moving_average" stroke="#EF4444" name="Moving Average" strokeDasharray="5,5" />
              </LineChart>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Seasonal Activity Patterns</h3>
              <BarChart width={800} height={400} data={temporalData.seasonal_patterns}>
                <CartesianGrid strokeDasharray="3,3" />
                <XAxis dataKey="season" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="average_cases" fill="#10B981" name="Average Cases" />
              </BarChart>
            </div>
          </div>
        )}

        {activeTab === 'hotspots' && hotspotsData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600 mb-2">{hotspotsData.summary.critical_alerts}</div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-orange-600 mb-2">{hotspotsData.summary.high_alerts}</div>
                <div className="text-sm text-gray-600">High Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600 mb-2">{hotspotsData.summary.medium_alerts}</div>
                <div className="text-sm text-gray-600">Medium Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600 mb-2">{hotspotsData.summary.districts_with_increased_activity}</div>
                <div className="text-sm text-gray-600">Increased Activity</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Active Hotspots</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Cases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Change</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hotspotsData.hotspots.map((hotspot: any) => (
                      <tr key={hotspot.district_id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{hotspot.district_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              hotspot.alert_level === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : hotspot.alert_level === 'HIGH'
                                ? 'bg-orange-100 text-orange-800'
                                : hotspot.alert_level === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {hotspot.alert_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotspot.hotspot_score}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotspot.activity_metrics.recent_cases}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              hotspot.comparison.activity_increase_percent > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {hotspot.comparison.activity_increase_percent > 0 ? '+' : ''}
                            {hotspot.comparison.activity_increase_percent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{hotspot.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div className="mt-10">
          <RiskRatingCriteria />
        </div>
      </main>
      <QuickReferencePanel />
    </div>
  )
}


