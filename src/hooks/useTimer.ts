import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface TimeEntry {
  id: string
  project_id: string
  started_at: string
  ended_at: string | null
  notes: string
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
        (payload) => {
          if (payload.new.ended_at === null) {
            setRunningEntry(payload.new)
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
    async (projectId: string) => {
      if (!userId) return
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: userId,
          project_id: projectId,
          started_at: new Date().toISOString(),
          notes: '',
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
    [userId]
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

  const updateNotes = useCallback(
    async (notes: string) => {
      if (!runningEntry) return
      const { error } = await supabase
        .from('time_entries')
        .update({ notes })
        .eq('id', runningEntry.id)

      if (error) {
        console.error('Error updating notes:', error)
        return
      }

      setRunningEntry({ ...runningEntry, notes })
    },
    [runningEntry]
  )

  return {
    runningEntry,
    elapsedSeconds,
    startTimer,
    stopTimer,
    updateNotes,
  }
}
