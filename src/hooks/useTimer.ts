import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface TimeEntry {
  id: string
  project_id: string
  subproject_id?: string | null
  started_at: string
  ended_at: string | null
  title: string
  details?: string
  created_at: string
}

export function useTimer(userId: string | undefined) {
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!userId) return

    supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('ended_at', null)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching running entry:', error)
          return
        }
        setRunningEntry(data ?? null)
      })

    const subscription = supabase
      .channel(`time_entries:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.ended_at === null) {
            setRunningEntry(payload.new as TimeEntry)
          } else {
            setRunningEntry(null)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  useEffect(() => {
    if (!runningEntry) {
      setElapsedSeconds(0)
      return
    }

    const interval = setInterval(() => {
      const started = new Date(runningEntry.started_at).getTime()
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - started) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [runningEntry])

  const startTimer = useCallback(
    async (projectId: string, subprojectId?: string) => {
      if (!userId) return
      const now = new Date().toISOString()

      if (runningEntry) {
        const { error: stopError } = await supabase
          .from('time_entries')
          .update({ ended_at: now })
          .eq('id', runningEntry.id)
        if (stopError) {
          console.error('Error stopping previous timer:', stopError)
          return
        }
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: userId,
          project_id: projectId,
          ...(subprojectId ? { subproject_id: subprojectId } : {}),
          started_at: now,
          title: '',
        })
        .select()
        .single()

      if (error) {
        console.error('Error starting timer:', error)
        return
      }

      setRunningEntry(data)
      setElapsedSeconds(0)
    },
    [userId, runningEntry]
  )

  const stopTimer = useCallback(async () => {
    if (!runningEntry) return
    const { error } = await supabase
      .from('time_entries')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', runningEntry.id)

    if (error) {
      console.error('Error stopping timer:', error)
      return
    }

    setRunningEntry(null)
    setElapsedSeconds(0)
  }, [runningEntry])

  const updateTitle = useCallback(
    async (title: string) => {
      if (!runningEntry) return
      const id = runningEntry.id
      const { error } = await supabase
        .from('time_entries')
        .update({ title })
        .eq('id', id)

      if (error) {
        console.error('Error updating title:', error)
        return
      }

      // Functional update so a Stop that lands first isn't undone.
      setRunningEntry((prev) => (prev && prev.id === id ? { ...prev, title } : prev))
    },
    [runningEntry]
  )

  /** Apply changes already saved elsewhere (e.g. the session details popup) to the running entry. */
  const syncRunningEntry = useCallback((id: string, changes: Partial<TimeEntry>) => {
    setRunningEntry((prev) => (prev && prev.id === id ? { ...prev, ...changes } : prev))
  }, [])

  return {
    runningEntry,
    elapsedSeconds,
    startTimer,
    stopTimer,
    updateTitle,
    syncRunningEntry,
  }
}
