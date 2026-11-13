import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

const MIN_LENGTH = 8

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("The two passwords don't match.")
      return
    }
    setSaving(true)
    const { error } = await changePassword(password)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">Change password</h2>

        {done ? (
          <>
            <p className="mt-3 text-sm text-gray-700">
              Password updated. Use the new one next time you sign in on any device.
            </p>
            <button onClick={onClose} className="btn-primary w-full mt-5">
              Done
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="new-password" className="label">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="input"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">
                Repeat new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="input"
              />
            </div>

            {error && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-sm">
                ⚠ {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
