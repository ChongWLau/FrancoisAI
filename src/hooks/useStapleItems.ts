import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface StapleItem {
  id: string
  name: string
}

export function useStapleItems() {
  const { user } = useAuth()
  const [staples, setStaples] = useState<StapleItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('staple_items')
      .select('id, name')
      .order('name')
    setStaples((data ?? []) as StapleItem[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addStaple = useCallback(async (name: string) => {
    if (!user || !name.trim()) return
    const trimmed = name.trim()
    if (staples.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('staple_items').insert({ name: trimmed, created_by: user.id })
    await load()
  }, [user, staples, load])

  const deleteStaple = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('staple_items').delete().eq('id', id)
    await load()
  }, [load])

  return { staples, loading, addStaple, deleteStaple }
}
