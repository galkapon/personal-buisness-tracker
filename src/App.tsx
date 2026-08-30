import { useAuth } from '@/hooks/useAuth'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'

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

  return user ? <Dashboard /> : <Auth />
}

export default App
