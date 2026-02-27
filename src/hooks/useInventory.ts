import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { StorageLocation } from '@/types/supabase'

export interface InventoryEntry {
  id: string
  name: string
  quantity: number
  location: StorageLocation | null
}


/**
 * Standalone upsert used by ShoppingListPage on item check-off.
 * Avoids loading all inventory data just to add one item.
 */
export async function upsertInventoryItem(name: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('inventory_items')
    .select('id, quantity')
    .ilike('name', name.trim())
    .limit(1)

  if (data && data.length > 0) {
    const existing = data[0] as { id: string; quantity: number | null }
    await db
      .from('inventory_items')
      .update({ quantity: (existing.quantity ?? 0) + 1 })
      .eq('id', existing.id)
  } else {
    await db.from('inventory_items').insert({
      name: name.trim(),
      quantity: 1,
      added_by: userId,
    })
  }
}

export function useInventory() {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('inventory_items')
      .select('id, name, quantity, location')
      .order('name')
    setItems(
      ((data ?? []) as { id: string; name: string; quantity: number | null; location: StorageLocation | null }[])
        .map(row => ({ ...row, quantity: row.quantity ?? 0 }))
    )
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const increment = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('inventory_items').update({ quantity: item.quantity + 1 }).eq('id', id)
    await load()
  }, [items, load])

  const decrement = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('inventory_items').update({ quantity: Math.max(0, item.quantity - 1) }).eq('id', id)
    await load()
  }, [items, load])

  const deleteItem = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('inventory_items').delete().eq('id', id)
    await load()
  }, [load])

  const addItem = useCallback(async (name: string) => {
    if (!user) return
    await upsertInventoryItem(name, user.id)
    await load()
  }, [user, load])

  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('inventory_items')
      .select('name')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(6)
    return ((data ?? []) as { name: string }[]).map(r => r.name)
  }, [])

  const setLocation = useCallback(async (id: string, location: StorageLocation | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('inventory_items').update({ location }).eq('id', id)
    await load()
  }, [load])

  const grouped = useMemo(() => {
    const groups: Record<string, InventoryEntry[]> = {
      fridge: [],
      freezer: [],
      pantry: [],
      other: [],
      unsorted: [],
    }
    for (const item of items) {
      const key = item.location ?? 'unsorted'
      groups[key].push(item)
    }
    return groups
  }, [items])

  return { items, grouped, loading, addItem, getSuggestions, increment, decrement, deleteItem, setLocation }
}
