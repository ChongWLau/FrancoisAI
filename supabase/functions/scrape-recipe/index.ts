import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return json({ error: 'url is required' }, 400)
    }

    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!pageRes.ok) {
      return json({ error: `Failed to fetch page (${pageRes.status})` }, 400)
    }

    const html = await pageRes.text()
    const recipe = extractRecipe(html, url) ?? extractRecipeMicrodata(html, url)
    if (!recipe) {
      return json({ error: 'No recipe schema found on this page. The site may not support structured data.' }, 422)
    }

    // Fallback: fill missing image from og:image meta tag
    if (!recipe.image_url) {
      recipe.image_url = extractOgImage(html)
    }

    // Proxy image into Supabase Storage to avoid hotlink protection
    if (recipe.image_url) {
      const proxied = await proxyImage(recipe.image_url)
      if (proxied) recipe.image_url = proxied
    }

    return json(recipe)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

async function proxyImage(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': new URL(imageUrl).origin,
      },
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `scraped/${crypto.randomUUID()}.${ext}`

    const bytes = await res.arrayBuffer()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(filename, bytes, { contentType, upsert: false })

    if (error) return null

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(filename)
    return data.publicUrl
  } catch {
    return null
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function extractRecipe(html: string, sourceUrl: string) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(html)) !== null) {
    try {
      const raw = JSON.parse(m[1].trim())
      const items: unknown[] = Array.isArray(raw) ? raw : raw['@graph'] ? raw['@graph'] : [raw]
      const recipe = items.find(
        (item: any) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe')),
      )
      if (recipe) return normalize(recipe as any, sourceUrl, items as any[])
    } catch {
      // try next script block
    }
  }

  return null
}

function normalize(r: any, sourceUrl: string, graph: any[] = []) {
  return {
    title: r.name ?? '',
    description: r.description ? stripHtml(r.description) : null,
    servings: parseServings(r.recipeYield),
    prep_time_minutes: parseDuration(r.prepTime),
    cook_time_minutes: parseDuration(r.cookTime),
    image_url: parseImage(r.image, graph),
    source_url: sourceUrl,
    tags: toArray(r.recipeCategory).concat(toArray(r.recipeCuisine)),
    ingredients: (r.recipeIngredient ?? []).map((s: string, i: number) => ({
      name: s.trim(),
      order_index: i,
    })),
    steps: parseSteps(r.recipeInstructions ?? []),
  }
}

function extractRecipeMicrodata(html: string, sourceUrl: string): ReturnType<typeof normalize> | null {
  if (!html.includes('recipeIngredient')) return null

  const base = new URL(sourceUrl).origin

  function getProp(prop: string): string | null {
    // meta content=
    const meta = html.match(new RegExp(`itemprop=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
      ?? html.match(new RegExp(`content=["']([^"']+)["'][^>]*itemprop=["']${prop}["']`, 'i'))
    if (meta) return meta[1].trim()
    // img src=
    const img = html.match(new RegExp(`<img[^>]*itemprop=["']${prop}["'][^>]*src=["']([^"']+)["']`, 'i'))
      ?? html.match(new RegExp(`<img[^>]*src=["']([^"']+)["'][^>]*itemprop=["']${prop}["']`, 'i'))
    if (img) { const s = img[1]; return s.startsWith('http') ? s : base + s }
    // time datetime=
    const time = html.match(new RegExp(`<time[^>]*itemprop=["']${prop}["'][^>]*datetime=["']([^"']+)["']`, 'i'))
      ?? html.match(new RegExp(`<time[^>]*datetime=["']([^"']+)["'][^>]*itemprop=["']${prop}["']`, 'i'))
    if (time) return time[1].trim()
    // inner text of next closing block tag
    const inner = html.match(new RegExp(`itemprop=["']${prop}["'][^>]*>([\\s\\S]{0,2000}?)<\\/(?:span|div|p|td|h[1-6]|section)>`, 'i'))
    if (inner) return inner[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return null
  }

  function getAllLi(prop: string): string[] {
    const results: string[] = []
    const re = new RegExp(`<li[^>]*itemprop=["']${prop}["'][^>]*>([\\s\\S]*?)<\\/li>`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (text) results.push(text)
    }
    return results
  }

  const name = getProp('name')
  if (!name) return null
  const ingredients = getAllLi('recipeIngredient')
  if (ingredients.length === 0) return null

  // Extract steps from the recipeInstructions block
  const steps: { step_number: number; instruction: string }[] = []
  const instrStart = html.search(/itemprop=["']recipeInstructions["']/)
  if (instrStart >= 0) {
    const block = html.slice(instrStart, instrStart + 20000)
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let m: RegExpExecArray | null
    let n = 1
    while ((m = liRe.exec(block)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (text) steps.push({ step_number: n++, instruction: text })
    }
  }

  const keywords = getProp('keywords') ?? ''
  const tags = keywords.split(',').map(s => s.trim()).filter(Boolean)

  return {
    title: name,
    description: getProp('description'),
    servings: parseServings(getProp('recipeYield')),
    prep_time_minutes: parseDuration(getProp('prepTime') ?? undefined),
    cook_time_minutes: parseDuration(getProp('cookTime') ?? undefined),
    image_url: getProp('image'),
    source_url: sourceUrl,
    tags,
    ingredients: ingredients.map((ing, i) => ({ name: ing, order_index: i })),
    steps,
  }
}

function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] ?? '0') * 1440) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

function parseServings(y: any): number | null {
  if (y == null) return null
  const s = Array.isArray(y) ? y[0] : y
  const n = String(s).match(/\d+/)
  return n ? parseInt(n[0]) : null
}

function parseImage(img: any, graph: any[] = []): string | null {
  if (!img) return null
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return parseImage(img[0], graph)
  // Resolve @id reference to another node in the @graph
  if (img['@id'] && graph.length > 0) {
    const node = graph.find((n: any) => n['@id'] === img['@id'])
    if (node) return node.url ?? node.contentUrl ?? node.thumbnailUrl ?? null
  }
  return img.url ?? img.contentUrl ?? img.thumbnailUrl ?? null
}

function extractOgImage(html: string): string | null {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  return m ? m[1] : null
}

function toArray(v: any): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  return [String(v)].filter(Boolean)
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim()
}

function parseSteps(instructions: any[]): { step_number: number; instruction: string }[] {
  const out: { step_number: number; instruction: string }[] = []
  let n = 1

  for (const item of instructions) {
    if (typeof item === 'string') {
      out.push({ step_number: n++, instruction: item.trim() })
    } else if (item['@type'] === 'HowToStep') {
      const text = (item.text ?? item.name ?? '').replace(/<[^>]+>/g, '').trim()
      if (text) out.push({ step_number: n++, instruction: text })
    } else if (item['@type'] === 'HowToSection') {
      for (const sub of item.itemListElement ?? []) {
        const text = (sub.text ?? sub.name ?? '').replace(/<[^>]+>/g, '').trim()
        if (text) out.push({ step_number: n++, instruction: text })
      }
    }
  }

  return out
}
