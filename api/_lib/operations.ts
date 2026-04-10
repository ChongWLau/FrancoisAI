import { db } from './supabase.js'

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

async function getOrCreateActiveList(userId: string): Promise<string> {
  const { data: lists } = await db
    .from('shopping_lists')
    .select('id')
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (lists && lists.length > 0) return lists[0].id

  const { data: newList } = await db
    .from('shopping_lists')
    .insert({ name: 'Shopping List', created_by: userId })
    .select('id')
    .single()
  return newList.id
}

export async function addShoppingItem(name: string, userId: string): Promise<void> {
  const listId = await getOrCreateActiveList(userId)
  const { data: maxRow } = await db
    .from('shopping_list_items')
    .select('order_index')
    .eq('list_id', listId)
    .order('order_index', { ascending: false })
    .limit(1)
  const maxOrder = maxRow && maxRow.length > 0 ? (maxRow[0].order_index as number) : -1
  await db.from('shopping_list_items').insert({
    list_id: listId,
    name: name.trim(),
    is_checked: false,
    order_index: maxOrder + 1,
    added_by: userId,
  })
}

export async function getShoppingList(): Promise<{ name: string; is_checked: boolean }[]> {
  const { data: lists } = await db
    .from('shopping_lists')
    .select('id')
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!lists || lists.length === 0) return []

  const { data: items } = await db
    .from('shopping_list_items')
    .select('name, is_checked')
    .eq('list_id', lists[0].id)
    .eq('is_checked', false)
    .order('order_index')

  return (items ?? []) as { name: string; is_checked: boolean }[]
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'other'

export async function addInventoryItem(
  name: string,
  location: StorageLocation | null,
  userId: string,
): Promise<void> {
  // Preserve the ilike dedup from upsertInventoryItem in useInventory.ts
  const { data: existing } = await db
    .from('inventory_items')
    .select('id')
    .ilike('name', name.trim())
    .limit(1)

  if (existing && existing.length > 0) {
    // Item already exists — update location if one was specified
    if (location) {
      await db
        .from('inventory_items')
        .update({ location })
        .eq('id', existing[0].id)
    }
    return
  }

  await db.from('inventory_items').insert({
    name: name.trim(),
    location: location ?? null,
    added_by: userId,
  })
}

export async function getInventoryByLocation(
  location?: StorageLocation,
): Promise<{ name: string; location: string | null }[]> {
  let query = db
    .from('inventory_items')
    .select('name, location')
    .order('name')

  if (location) {
    query = query.eq('location', location)
  }

  const { data } = await query
  return (data ?? []) as { name: string; location: string | null }[]
}

// ---------------------------------------------------------------------------
// Meal plan
// ---------------------------------------------------------------------------

export async function getTodaysMeals(date: string): Promise<{ name: string }[]> {
  const { data } = await db
    .from('meal_entries')
    .select('name')
    .eq('date', date)
    .order('order_index')

  return (data ?? []) as { name: string }[]
}
