import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Recipe, RecipeIngredient, RecipeStep } from '@/types/supabase'
import type { RecipeFormData } from '@/components/recipes/RecipeForm'


export type RecipeCollectionEntry = {
  collection_id: string
  collections: { id: string; name: string }
}

export interface RecipeListItem extends Recipe {
  recipe_ingredients: { name: string }[]
  recipe_collections: RecipeCollectionEntry[]
}

export interface RecipeWithDetails extends Recipe {
  recipe_ingredients: RecipeIngredient[]
  recipe_steps: RecipeStep[]
  recipe_collections: RecipeCollectionEntry[]
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('recipes')
      .select('*, recipe_ingredients(name), recipe_collections(collection_id, collections(id, name))')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRecipes((data ?? []) as RecipeListItem[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { recipes, loading, error, refetch: load }
}

export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('recipes')
      .select('*, recipe_ingredients(*), recipe_steps(*), recipe_collections(collection_id, collections(id, name))')
      .eq('id', id)
      .single()
    if (error) setError(error.message)
    else {
      const r = data as RecipeWithDetails
      r.recipe_ingredients.sort((a, b) => a.order_index - b.order_index)
      r.recipe_steps.sort((a, b) => a.step_number - b.step_number)
      setRecipe(r)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return { recipe, loading, error, refetch: load }
}

// Shared save utility used by both new and edit flows
export async function saveRecipe(
  data: RecipeFormData,
  userId: string,
  existingId?: string,
): Promise<string> {
  const payload = {
    created_by: userId,
    title: data.title.trim(),
    description: data.description.trim() || null,
    servings: data.servings ? parseInt(data.servings) : null,
    prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes) : null,
    cook_time_minutes: data.cook_time_minutes ? parseInt(data.cook_time_minutes) : null,
    image_url: data.image_url.trim() || null,
    source_url: data.source_url.trim() || null,
    tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
    is_shared: data.is_shared,
  }

  let id: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  if (existingId) {
    const { error } = await db.from('recipes').update(payload).eq('id', existingId)
    if (error) throw error
    id = existingId
  } else {
    const { data: row, error } = await db.from('recipes').insert(payload).select('id').single()
    if (error) throw error
    id = (row as { id: string }).id
  }

  // Replace ingredients (delete + re-insert keeps ordering simple)
  const { error: delIngErr } = await db.from('recipe_ingredients').delete().eq('recipe_id', id)
  if (delIngErr) throw delIngErr

  const ingredients = data.ingredients.filter((s: string) => s.trim())
  if (ingredients.length > 0) {
    const { error } = await db.from('recipe_ingredients').insert(
      ingredients.map((name: string, i: number) => ({ recipe_id: id, name: name.trim(), order_index: i })),
    )
    if (error) throw error
  }

  // Replace steps
  const { error: delStepErr } = await db.from('recipe_steps').delete().eq('recipe_id', id)
  if (delStepErr) throw delStepErr

  const steps = data.steps.filter((s: string) => s.trim())
  if (steps.length > 0) {
    const { error } = await db.from('recipe_steps').insert(
      steps.map((instruction: string, i: number) => ({
        recipe_id: id,
        step_number: i + 1,
        instruction: instruction.trim(),
      })),
    )
    if (error) throw error
  }

  return id
}

// Convert a loaded RecipeWithDetails back into the editable form shape
export function recipeToFormData(recipe: RecipeWithDetails): RecipeFormData {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    servings: recipe.servings?.toString() ?? '',
    prep_time_minutes: recipe.prep_time_minutes?.toString() ?? '',
    cook_time_minutes: recipe.cook_time_minutes?.toString() ?? '',
    image_url: recipe.image_url ?? '',
    source_url: recipe.source_url ?? '',
    tags: recipe.tags.join(', '),
    is_shared: recipe.is_shared,
    ingredients: recipe.recipe_ingredients.map(i => i.name),
    steps: recipe.recipe_steps.map(s => s.instruction),
  }
}
