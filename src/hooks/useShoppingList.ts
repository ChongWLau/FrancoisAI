import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ListItem {
  id: string
  name: string
  is_checked: boolean
  order_index: number
}

export function useShoppingList() {
  const { user } = useAuth()
  const [listId, setListId] = useState<string | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Get or create the single shared active list
    const { data: lists } = await db
      .from('shopping_lists')
      .select('id')
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)

    let id: string
    if (!lists || lists.length === 0) {
      const { data: newList } = await db
        .from('shopping_lists')
        .insert({ name: 'Shopping List', created_by: user.id })
        .select('id')
        .single()
      id = newList.id
    } else {
      id = lists[0].id
    }

    setListId(id)

    const { data: itemData } = await db
      .from('shopping_list_items')
      .select('id, name, is_checked, order_index')
      .eq('list_id', id)
      .order('order_index')

    setItems((itemData ?? []) as ListItem[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const addItem = useCallback(async (name: string) => {
    if (!listId || !user || !name.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const maxOrder = items.reduce((max, i) => Math.max(max, i.order_index), -1)
    await db.from('shopping_list_items').insert({
      list_id: listId,
      name: name.trim(),
      is_checked: false,
      order_index: maxOrder + 1,
      added_by: user.id,
    })
    await load()
  }, [listId, user, items, load])

  const toggleItem = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('shopping_list_items').update({ is_checked: !item.is_checked }).eq('id', id)
    await load()
  }, [items, load])

  const deleteItem = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('shopping_list_items').delete().eq('id', id)
    await load()
  }, [load])

  const clearChecked = useCallback(async () => {
    if (!listId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('shopping_list_items').delete().eq('list_id', listId).eq('is_checked', true)
    await load()
  }, [listId, load])

  const addStaplesToList = useCallback(async (stapleNames: string[]) => {
    if (!listId || !user || stapleNames.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const existingNames = new Set(items.map(i => i.name.toLowerCase()))
    const toAdd = stapleNames.filter(n => !existingNames.has(n.toLowerCase()))
    if (toAdd.length === 0) return
    const maxOrder = items.reduce((max, i) => Math.max(max, i.order_index), -1)
    await db.from('shopping_list_items').insert(
      toAdd.map((name, idx) => ({
        list_id: listId,
        name,
        is_checked: false,
        order_index: maxOrder + 1 + idx,
        added_by: user.id,
      }))
    )
    await load()
  }, [listId, user, items, load])

  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim()) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('shopping_list_items')
      .select('name')
      .ilike('name', `${query.trim()}%`)
      .limit(20)

    const existingNames = new Set(items.map(i => i.name.toLowerCase()))
    const seen = new Set<string>()
    const results: string[] = []
    for (const row of (data ?? [])) {
      const lower = (row.name as string).toLowerCase()
      if (!seen.has(lower) && !existingNames.has(lower)) {
        seen.add(lower)
        results.push(row.name as string)
        if (results.length >= 5) break
      }
    }
    return results
  }, [items])

  const { unchecked, checked } = useMemo(() => ({
    unchecked: items.filter(i => !i.is_checked),
    checked: items.filter(i => i.is_checked),
  }), [items])

  return {
    listId,
    unchecked,
    checked,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    addStaplesToList,
    getSuggestions,
  }
}
