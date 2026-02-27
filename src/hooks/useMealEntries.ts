import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addDays, toISODate } from '@/lib/dates'
import type { MealEntry, MealType } from '@/types/supabase'

export interface MealEntryWithRecipe extends MealEntry {
  recipes: { id: string; title: string; image_url: string | null } | null
}

// Map key: 'YYYY-MM-DD_mealtype'
export type EntryMap = Map<string, MealEntryWithRecipe>

export function useMealEntries(weekStart: Date) {
  const [entries, setEntries] = useState<MealEntryWithRecipe[]>([])
  const [loading, setLoading] = useState(true)

  const startStr = toISODate(weekStart)
  const endStr = toISODate(addDays(weekStart, 6))

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('meal_entries')
      .select('*, recipes(id, title, image_url)')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date')
    setEntries((data ?? []) as MealEntryWithRecipe[])
    setLoading(false)
  }, [startStr, endStr])

  useEffect(() => { load() }, [load])

  const entryMap = useMemo<EntryMap>(() => {
    const map: EntryMap = new Map()
    for (const entry of entries) {
      map.set(`${entry.date}_${entry.meal_type}`, entry)
    }
    return map
  }, [entries])

  async function saveEntry(
    date: string,
    mealType: MealType,
    payload: { recipe_id: string | null; custom_meal_text: string | null },
    userId: string,
    existingId?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    if (existingId) {
      const { error } = await db.from('meal_entries').update(payload).eq('id', existingId)
      if (error) throw error
    } else {
      const { error } = await db.from('meal_entries').insert({
        created_by: userId,
        date,
        meal_type: mealType,
        order_index: 0,
        ...payload,
      })
      if (error) throw error
    }
    await load()
  }

  async function deleteEntry(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db.from('meal_entries').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { entryMap, loading, saveEntry, deleteEntry }
}
