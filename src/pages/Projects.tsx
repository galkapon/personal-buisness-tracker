import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Timer } from '@/components/Timer'
import { ProjectDetails } from '@/pages/ProjectDetails'
import { useAuth } from '@/hooks/useAuth'
import { useTimer } from '@/hooks/useTimer'

export interface Project {
  id: string
  user_id: string
  name: string
  created_at: string
  archived: boolean
}

export function Projects() {
  const { user, signOut } = useAuth()
  const { runningEntry, startTimer, stopTimer, updateNotes } = useTimer(user?.id)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timer' | 'history'>('timer')

  useEffect(() => {
    if (!user?.id) return

    fetchProjects()

    const subscription = supabase
      .channel(`projects:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  const fetchProjects = async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects(data || [])
      if (!selectedProjectId && data?.length > 0) {
        setSelectedProjectId(data[0].id)
      }
    }
    setLoading(false)
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !newProjectName.trim()) return

    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newProjectName,
        archived: false,
      })

    if (error) {
      console.error('Error creating project:', error)
    } else {
      setNewProjectName('')
      fetchProjects()
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Projects</h2>

              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : (
                <>
                  <div className="space-y-2 mb-6">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          selectedProjectId === project.id
                            ? 'bg-blue-100 text-blue-900 font-semibold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={createProject} className="space-y-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="New project..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition text-sm"
                    >
                      Add Project
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Timer/History Section */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <>
                {viewMode === 'timer' ? (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setViewMode('history')}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg"
                      >
                        📊 View History
                      </button>
                    </div>
                    <Timer
                      project={selectedProject}
                      runningEntry={runningEntry}
                      onStart={() => startTimer(selectedProject.id)}
                      onStop={() => stopTimer()}
                      onUpdateNotes={updateNotes}
                    />
                  </>
                ) : (
                  <ProjectDetails
                    project={selectedProject}
                    userId={user!.id}
                    onBack={() => setViewMode('timer')}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
                Create a project to get started
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
