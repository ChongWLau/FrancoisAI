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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FrancoisAI/1.0)' },
    })
    if (!pageRes.ok) {
      return json({ error: `Failed to fetch page (${pageRes.status})` }, 400)
    }

    const html = await pageRes.text()
    const recipe = extractRecipe(html, url)
    if (!recipe) {
      return json({ error: 'No recipe schema found on this page. The site may not support structured data.' }, 422)
    }

    return json(recipe)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

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
      if (recipe) return normalize(recipe as any, sourceUrl)
    } catch {
      // try next script block
    }
  }

  return null
}

function normalize(r: any, sourceUrl: string) {
  return {
    title: r.name ?? '',
    description: r.description ? stripHtml(r.description) : null,
    servings: parseServings(r.recipeYield),
    prep_time_minutes: parseDuration(r.prepTime),
    cook_time_minutes: parseDuration(r.cookTime),
    image_url: parseImage(r.image),
    source_url: sourceUrl,
    tags: toArray(r.recipeCategory).concat(toArray(r.recipeCuisine)),
    ingredients: (r.recipeIngredient ?? []).map((s: string, i: number) => ({
      name: s.trim(),
      order_index: i,
    })),
    steps: parseSteps(r.recipeInstructions ?? []),
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

function parseImage(img: any): string | null {
  if (!img) return null
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return parseImage(img[0])
  return img.url ?? null
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
