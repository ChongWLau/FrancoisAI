import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addDays, toISODate } from '@/lib/dates'

export interface MealRecipe {
  id: string          // meal_entry_recipes.id
  recipe_id: string
  title: string
  image_url: string | null
}

export interface MealEntry {
  id: string
  date: string        // 'YYYY-MM-DD'
  name: string
  order_index: number
  recipes: MealRecipe[]
}

// Map from 'YYYY-MM-DD' → MealEntry[]
export type DayMealsMap = Map<string, MealEntry[]>

export function useMealEntries(weekStart: Date) {
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)

  const startStr = toISODate(weekStart)
  const endStr = toISODate(addDays(weekStart, 6))

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db
      .from('meal_entries')
      .select('id, date, name, order_index, meal_entry_recipes(id, order_index, recipe_id, recipes(id, title, image_url))')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('order_index')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed: MealEntry[] = (data ?? []).map((row: any) => ({
      id: row.id,
      date: row.date,
      name: row.name,
      order_index: row.order_index,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recipes: ((row.meal_entry_recipes ?? []) as any[])
        .sort((a, b) => a.order_index - b.order_index)
        .map(mer => ({
          id: mer.id,
          recipe_id: mer.recipe_id,
          title: mer.recipes?.title ?? '',
          image_url: mer.recipes?.image_url ?? null,
        })),
    }))

    setEntries(transformed)
    setLoading(false)
  }, [startStr, endStr])

  useEffect(() => { load() }, [load])

  const dayMealsMap = useMemo<DayMealsMap>(() => {
    const map: DayMealsMap = new Map()
    for (const entry of entries) {
      const existing = map.get(entry.date) ?? []
      existing.push(entry)
      map.set(entry.date, existing)
    }
    return map
  }, [entries])

  async function addMeal(date: string, name: string, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const dayEntries = dayMealsMap.get(date) ?? []
    const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order_index), -1)
    const { error } = await db.from('meal_entries').insert({
      date,
      name: name.trim(),
      order_index: maxOrder + 1,
      created_by: userId,
    })
    if (error) throw error
    await load()
  }

  async function deleteMeal(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db.from('meal_entries').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  async function addRecipeToMeal(mealEntryId: string, recipeId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const meal = entries.find(e => e.id === mealEntryId)
    const { error } = await db.from('meal_entry_recipes').insert({
      meal_entry_id: mealEntryId,
      recipe_id: recipeId,
      order_index: meal ? meal.recipes.length : 0,
    })
    if (error) throw error
    await load()
  }

  async function removeRecipeFromMeal(mealEntryRecipeId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db.from('meal_entry_recipes').delete().eq('id', mealEntryRecipeId)
    if (error) throw error
    await load()
  }

  async function reorderMeal(id: string, direction: 'up' | 'down') {
    const meal = entries.find(e => e.id === id)
    if (!meal) return
    const dayEntries = [...(dayMealsMap.get(meal.date) ?? [])].sort((a, b) => a.order_index - b.order_index)
    const idx = dayEntries.findIndex(e => e.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= dayEntries.length) return
    const other = dayEntries[swapIdx]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await Promise.all([
      db.from('meal_entries').update({ order_index: other.order_index }).eq('id', meal.id),
      db.from('meal_entries').update({ order_index: meal.order_index }).eq('id', other.id),
    ])
    await load()
  }

  return { dayMealsMap, loading, addMeal, deleteMeal, addRecipeToMeal, removeRecipeFromMeal, reorderMeal }
}
