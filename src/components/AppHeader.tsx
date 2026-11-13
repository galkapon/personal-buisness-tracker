import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'

const TABS = [
  { to: '/', label: 'Tracking' },
  { to: '/todos', label: 'Todos' },
  { to: '/meetings', label: 'Meetings' },
]

export function AppHeader() {
  const { signOut } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-base font-semibold text-gray-900">Time Tracker</span>
        <nav className="order-last sm:order-none basis-full sm:basis-auto flex gap-1 -ml-3 sm:ml-0">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
        </nav>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setShowPasswordModal(true)} className="btn-ghost py-1.5">
            Change password
          </button>
          <button onClick={() => signOut()} className="btn-ghost py-1.5">
            Sign out
          </button>
        </div>
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </header>
  )
}
