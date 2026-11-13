import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TAG_COLOR_ORDER } from '@/lib/tagColors'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

const TAG_COLORS = TAG_COLOR_ORDER

const DEFAULT_TAGS = ['meeting', 'coding', 'admin', 'client call', 'research', 'planning']

export function useTags(userId: string | undefined) {
  const [tags, setTags] = useState<Tag[]>([])
  const [sessionTags, setSessionTags] = useState<Map<string, string[]>>(new Map())

  useEffect(() => {
    if (!userId) return
    fetchTags()
    fetchSessionTags()
  }, [userId])

  const fetchTags = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    setTags(data || [])
  }

  const fetchSessionTags = async () => {
    if (!userId) return
    const { data } = await supabase.from('session_tags').select('session_id, tag_id')

    const map = new Map<string, string[]>()
    ;(data || []).forEach((st) => {
      map.set(st.session_id, [...(map.get(st.session_id) || []), st.tag_id])
    })
    setSessionTags(map)
  }

  const ensureDefaultTags = async () => {
    if (!userId) return
    const { data: existing, error } = await supabase
      .from('tags')
      .select('name')
      .eq('user_id', userId)
    // Only seed a brand-new account, so tags the user deleted don't reappear.
    if (error || (existing && existing.length > 0)) return

    const { error: insertError } = await supabase.from('tags').insert(
      DEFAULT_TAGS.map((name, i) => ({
        user_id: userId,
        name,
        color: TAG_COLORS[i % TAG_COLORS.length],
      }))
    )
    if (!insertError) await fetchTags()
  }

  const createTag = async (name: string): Promise<{ tag?: Tag; error?: string }> => {
    if (!userId) return { error: 'Not signed in' }
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return { error: 'Type a tag name first' }

    const existing = tags.find((t) => t.name === trimmed)
    if (existing) return { tag: existing }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: trimmed,
        color: TAG_COLORS[tags.length % TAG_COLORS.length],
      })
      .select()
      .single()

    if (error) return { error: error.message }
    setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { tag: data }
  }

  const deleteTag = async (tagId: string): Promise<string | null> => {
    const { error } = await supabase.from('tags').delete().eq('id', tagId)
    if (error) return error.message

    setTags((prev) => prev.filter((t) => t.id !== tagId))
    setSessionTags((prev) => {
      const updated = new Map<string, string[]>()
      prev.forEach((ids, sessionId) => updated.set(sessionId, ids.filter((id) => id !== tagId)))
      return updated
    })
    return null
  }

  const addTagToSession = async (sessionId: string, tagId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('session_tags')
      .insert({ session_id: sessionId, tag_id: tagId })
    if (error) return error.message

    setSessionTags((prev) => {
      const updated = new Map(prev)
      updated.set(sessionId, [...(updated.get(sessionId) || []), tagId])
      return updated
    })
    return null
  }

  const removeTagFromSession = async (sessionId: string, tagId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('session_tags')
      .delete()
      .eq('session_id', sessionId)
      .eq('tag_id', tagId)
    if (error) return error.message

    setSessionTags((prev) => {
      const updated = new Map(prev)
      updated.set(sessionId, (updated.get(sessionId) || []).filter((id) => id !== tagId))
      return updated
    })
    return null
  }

  const getSessionTags = (sessionId: string): Tag[] => {
    const tagIds = sessionTags.get(sessionId) || []
    return tags.filter((t) => tagIds.includes(t.id))
  }

  return {
    tags,
    ensureDefaultTags,
    createTag,
    deleteTag,
    addTagToSession,
    removeTagFromSession,
    getSessionTags,
  }
}
