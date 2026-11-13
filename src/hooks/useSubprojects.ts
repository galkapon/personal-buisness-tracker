import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Subproject {
  id: string
  user_id: string
  project_id: string
  name: string
  created_at: string
}

export function useSubprojects(userId: string | undefined) {
  const [subprojects, setSubprojects] = useState<Subproject[]>([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('subprojects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
      .then(({ data }) => setSubprojects(data || []))
  }, [userId])

  const addSubproject = async (projectId: string, name: string): Promise<string | null> => {
    if (!userId) return 'Not signed in'
    const { data, error } = await supabase
      .from('subprojects')
      .insert({ user_id: userId, project_id: projectId, name: name.trim() })
      .select()
      .single()
    if (error) return error.message
    setSubprojects((prev) => [...prev, data])
    return null
  }

  const deleteSubproject = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('subprojects').delete().eq('id', id)
    if (error) return error.message
    setSubprojects((prev) => prev.filter((s) => s.id !== id))
    return null
  }

  const renameSubproject = async (id: string, name: string): Promise<string | null> => {
    const trimmed = name.trim()
    if (!trimmed) return 'Name cannot be empty'
    const { error } = await supabase.from('subprojects').update({ name: trimmed }).eq('id', id)
    if (error) {
      return error.code === '23505'
        ? `This project already has a mini-project called "${trimmed}"`
        : error.message
    }
    setSubprojects((prev) => prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s)))
    return null
  }

  const getSubprojects = (projectId: string) =>
    subprojects.filter((s) => s.project_id === projectId)

  return { subprojects, addSubproject, renameSubproject, deleteSubproject, getSubprojects }
}
