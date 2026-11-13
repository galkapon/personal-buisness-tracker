import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Todo {
  id: string
  user_id: string
  project_id: string
  title: string
  description: string
  completed: boolean
  created_at: string
  due_date: string | null
}

export function useTodos(userId: string | undefined) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchTodos()
  }, [userId])

  const fetchTodos = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setTodos(data || [])
    setLoading(false)
  }

  const addTodo = async (
    projectId: string,
    title: string,
    description?: string,
    dueDate?: string
  ) => {
    if (!userId) return
    const { error } = await supabase.from('todos').insert({
      user_id: userId,
      project_id: projectId,
      title,
      description: description || '',
      due_date: dueDate || null,
    })

    if (!error) {
      await fetchTodos()
    }
    return !error
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id)

    if (!error) {
      await fetchTodos()
    }
    return !error
  }

  const updateTodo = async (
    id: string,
    updates: Partial<Omit<Todo, 'id' | 'user_id' | 'created_at'>>
  ) => {
    const { error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)

    if (!error) {
      await fetchTodos()
    }
    return !error
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchTodos()
    }
    return !error
  }

  const getTodosByProject = (projectId: string): Todo[] => {
    return todos.filter((t) => t.project_id === projectId)
  }

  return {
    todos,
    loading,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    getTodosByProject,
    refetch: fetchTodos,
  }
}
