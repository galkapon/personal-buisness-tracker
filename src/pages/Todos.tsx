import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { useTodos } from '@/hooks/useTodos'
import { AppHeader } from '@/components/AppHeader'

interface Project {
  id: string
  name: string
}

export function Todos() {
  const { user } = useAuth()
  const { todos, addTodo, toggleTodo, deleteTodo, getTodosByProject } = useTodos(user?.id)

  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [newTodoForm, setNewTodoForm] = useState({
    projectId: '',
    title: '',
    description: '',
    dueDate: '',
  })

  useEffect(() => {
    if (!user?.id) return
    fetchProjects()
  }, [user?.id])

  const fetchProjects = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    setProjects(data || [])
    if (data && data.length > 0 && !newTodoForm.projectId) {
      setNewTodoForm((prev) => ({ ...prev, projectId: data[0].id }))
      setExpandedProject(data[0].id)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoForm.projectId || !newTodoForm.title.trim()) return

    const success = await addTodo(
      newTodoForm.projectId,
      newTodoForm.title,
      newTodoForm.description,
      newTodoForm.dueDate || undefined
    )

    if (success) {
      setNewTodoForm({
        projectId: newTodoForm.projectId,
        title: '',
        description: '',
        dueDate: '',
      })
    }
  }

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-12">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Todos</h1>
          <p className="text-sm text-gray-600">
            {completedCount} of {totalCount} done
          </p>
        </div>

        <form onSubmit={handleAddTodo} className="card p-4 mb-6 space-y-3">
          <input
            type="text"
            value={newTodoForm.title}
            onChange={(e) => setNewTodoForm({ ...newTodoForm, title: e.target.value })}
            placeholder="Add a task, e.g. Design homepage mockup"
            className="input text-[15px]"
            required
          />
          <textarea
            value={newTodoForm.description}
            onChange={(e) => setNewTodoForm({ ...newTodoForm, description: e.target.value })}
            placeholder="Details (optional)"
            rows={2}
            className="input resize-none"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="label">Project</label>
              <select
                value={newTodoForm.projectId}
                onChange={(e) => {
                  setNewTodoForm({ ...newTodoForm, projectId: e.target.value })
                  setExpandedProject(e.target.value)
                }}
                className="input"
                required
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="label">Due date (optional)</label>
              <input
                type="date"
                value={newTodoForm.dueDate}
                onChange={(e) => setNewTodoForm({ ...newTodoForm, dueDate: e.target.value })}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary">
              Add task
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="card py-12 text-center text-sm text-gray-600">
              No projects yet. Create one on the Tracking page first.
            </div>
          ) : (
            projects.map((project) => {
              const projectTodos = getTodosByProject(project.id)
              const completedInProject = projectTodos.filter((t) => t.completed).length
              const isOpen = expandedProject === project.id

              return (
                <div key={project.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedProject(isOpen ? null : project.id)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs w-3">{isOpen ? '▾' : '▸'}</span>
                      <span className="text-[15px] font-semibold text-gray-900">{project.name}</span>
                    </span>
                    <span className="text-sm tabular-nums text-gray-600">
                      {completedInProject}/{projectTodos.length}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200">
                      {projectTodos.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-600 text-center">
                          No tasks for this project yet.
                        </p>
                      ) : (
                        projectTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="group flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleTodo(todo.id, todo.completed)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-400 text-gray-900 focus:ring-gray-300 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-x-2">
                                <span
                                  className={`text-sm font-medium ${
                                    todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}
                                >
                                  {todo.title}
                                </span>
                                {todo.due_date && (
                                  <span className="text-xs text-gray-500">
                                    Due {new Date(todo.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {todo.description && (
                                <p
                                  className={`mt-0.5 text-sm ${
                                    todo.completed ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  {todo.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="link-quiet sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
