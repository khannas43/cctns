import { useLocation } from 'react-router-dom'

export default function AppHeader() {
  const location = useLocation()
  const onDashboard = location.pathname.startsWith('/dashboard')
  const onNetwork = location.pathname.startsWith('/network-analytics') || location.pathname.startsWith('/network-visualization')
  const onRisk = location.pathname.startsWith('/predictive-analytics') || location.pathname.startsWith('/risk-analytics')
  const onTreatment = location.pathname.startsWith('/treatment-analytics')
  return (
    <header className="bg-white border-b">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${onDashboard ? 'py-[6px]' : 'py-3'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://www.digitalpolicecitizenservices.gov.in/centercitizen/asset/images/cctnsLogoNew.png"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/vite.svg'
              }}
              alt="CCTNS"
              className="h-16 md:h-20 w-auto object-contain"
            />
            {onDashboard && (
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</div>
                <div className="text-sm md:text-base text-gray-600">Choose an analytics module to begin investigation</div>
              </div>
            )}
            {onNetwork && (
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">Network Intelligence & Supply Chain Analytics</div>
              </div>
            )}
            {onRisk && (
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">Predictive Risk & Hotspot Analytics</div>
                <div className="text-sm md:text-base text-gray-600">Geographic analysis and predictive modeling for Karnataka districts</div>
              </div>
            )}
            {onTreatment && (
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">Treatment & Rehabilitation Analytics</div>
                <div className="text-sm md:text-base text-gray-600">Outcomes analysis and intervention optimization</div>
              </div>
            )}
          </div>
          {(onNetwork || onRisk || onTreatment) && (
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 hover:bg-gray-50"
              title="Go to Dashboard"
            >
              🧭
            </a>
          )}
        </div>
      </div>
    </header>
  )
}


