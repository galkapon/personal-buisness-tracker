import { useAuth } from '@/hooks/useAuth'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { MeetingSummaries } from '@/pages/MeetingSummaries'
import { Todos } from '@/pages/Todos'
import { ResearchDashboard } from '@/pages/ResearchDashboard'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meetings" element={<MeetingSummaries />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/research" element={<ResearchDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
