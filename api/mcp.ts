import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { userIdFromToken } from './_lib/mcpAuth'
import * as ops from './_lib/operations'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.query.token as string
  const userId = token ? userIdFromToken(token) : null
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const server = new McpServer({ name: 'francoisai', version: '1.0.0' })

  server.tool(
    'add_shopping_item',
    'Add an item to the shopping list',
    { name: z.string().describe('The item to add') },
    async ({ name }) => {
      await ops.addShoppingItem(name, userId)
      return { content: [{ type: 'text' as const, text: `Added "${name}" to your shopping list.` }] }
    },
  )

  server.tool(
    'get_shopping_list',
    'Get all unchecked items on the shopping list',
    {},
    async () => {
      const items = await ops.getShoppingList()
      const text = items.length
        ? items.map(i => `• ${i.name}`).join('\n')
        : 'Your shopping list is empty.'
      return { content: [{ type: 'text' as const, text }] }
    },
  )

  server.tool(
    'add_inventory_item',
    'Add an item to the inventory, optionally specifying where it is stored',
    {
      name: z.string().describe('The item to add'),
      location: z.enum(['fridge', 'freezer', 'pantry', 'other']).optional()
        .describe('Where the item is stored'),
    },
    async ({ name, location }) => {
      await ops.addInventoryItem(name, location ?? null, userId)
      const where = location ? ` in the ${location}` : ''
      return { content: [{ type: 'text' as const, text: `Added "${name}"${where} to your inventory.` }] }
    },
  )

  server.tool(
    'get_inventory',
    'Get inventory items, optionally filtered by storage location',
    {
      location: z.enum(['fridge', 'freezer', 'pantry', 'other']).optional()
        .describe('Filter by storage location'),
    },
    async ({ location }) => {
      const items = await ops.getInventoryByLocation(location)
      const text = items.length
        ? items.map(i => `• ${i.name}${i.location ? ` (${i.location})` : ''}`).join('\n')
        : location ? `Nothing in the ${location}.` : 'Your inventory is empty.'
      return { content: [{ type: 'text' as const, text }] }
    },
  )

  server.tool(
    'get_meals_today',
    "Get today's planned meals",
    {},
    async () => {
      const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
      const meals = await ops.getTodaysMeals(today)
      const text = meals.length
        ? meals.map(m => `• ${m.name}`).join('\n')
        : 'Nothing planned for today.'
      return { content: [{ type: 'text' as const, text }] }
    },
  )

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — correct for serverless
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
}
