import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import App from './App'
import About from './pages/About'


import Cases from './pages/Cases'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NetworkAnalytics from './pages/NetworkAnalytics'
import NetworkVisualization from './pages/NetworkVisualization'
import RiskAnalytics from './pages/RiskAnalytics'
import TreatmentRehabAnalytics from './pages/TreatmentRehabAnalytics'
import AdvancedPatternAnalytics from './pages/AdvancedPatternAnalytics'
import TestEnhanced from './pages/TestEnhanced'
import EntityCasesPage from './pages/entity-cases/[entityId]'
import EntityDetails from './pages/EntityDetails'
import PredictiveAnalytics from './pages/PredictiveAnalytics'
const router = createBrowserRouter([
  // Standalone login route (no AppLayout header/nav)
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <App /> },
      { path: 'about', element: <About /> },
      { path: 'cases', element: <Cases /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'network-analytics', element: <NetworkAnalytics /> },
      { path: 'network-visualization', element: <NetworkVisualization /> },
      { path: 'risk-analytics', element: <RiskAnalytics /> },
      { path: 'predictive-analytics', element: <PredictiveAnalytics /> },
      { path: 'treatment-analytics', element: <TreatmentRehabAnalytics /> },
      { path: 'advanced-analytics', element: <AdvancedPatternAnalytics /> },
      { path: 'entity-cases/:entityId', element: <EntityCasesPage /> },
      { path: 'test-enhanced', element: <TestEnhanced /> },
      { path: 'entity/:id', element: <EntityDetails /> },
      { path: '*', element: <div style={{ padding: 16 }}>Not Found</div> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
