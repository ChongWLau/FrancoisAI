import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Collection } from '@/types/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await db.from('collections').select('*').order('name', { ascending: true })
    setCollections((data ?? []) as Collection[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createCollection(name: string, userId: string): Promise<Collection> {
    const { data, error } = await db
      .from('collections')
      .insert({ name: name.trim(), created_by: userId })
      .select()
      .single()
    if (error) throw error
    await load()
    return data as Collection
  }

  async function deleteCollection(id: string) {
    await db.from('collections').delete().eq('id', id)
    await load()
  }

  return { collections, loading, createCollection, deleteCollection, refetch: load }
}
