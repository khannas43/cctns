import { useNavigate } from 'react-router-dom'

const useCases = [
  {
    id: 1,
    title: 'Network Intelligence & Supply Chain',
    description:
      'Interactive network visualization showing connections between consumers, suppliers, transporters, and storage locations. Identify key players and chokepoints.',
    icon: '🕸️',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    route: '/network-analytics',
    stats: '1,200+ Entities',
  },
  {
    id: 2,
    title: 'Predictive Risk & Hotspot Analytics',
    description:
      'Geographic analysis and predictive modeling to identify drug activity patterns and emerging hotspots across Karnataka districts.',
    icon: '📍',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    route: '/predictive-analytics',
    stats: '10 Districts Covered',
  },
  {
    id: 3,
    title: 'Treatment & Rehabilitation Analytics',
    description:
      'Track treatment effectiveness and rehabilitation outcomes. Analyze success patterns and optimize intervention strategies.',
    icon: '🏥',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    route: '/treatment-analytics',
    stats: 'Evidence-Based Insights',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">


        

        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className={`w-full lg:w-80 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden`}
              onClick={() => navigate(useCase.route)}
            >
              {/* Colored title band */}
              <div className={`${useCase.color} ${useCase.hoverColor} p-6 text-center`}>
                <div className="text-6xl mb-3">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{useCase.title}</h3>
              </div>
              {/* White description area */}
              <div className="bg-white p-6">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{useCase.description}</p>
                <div className="text-center">
                  <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200">
                    Launch Analytics →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">1,200+</div>
            <div className="text-sm text-gray-600">Network Entities</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">2,000+</div>
            <div className="text-sm text-gray-600">Relationships Mapped</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">500+</div>
            <div className="text-sm text-gray-600">Active Cases</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">10</div>
            <div className="text-sm text-gray-600">Karnataka Districts</div>
          </div>
        </div>
      </main>
    </div>
  )
}


