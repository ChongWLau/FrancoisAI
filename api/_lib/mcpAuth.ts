// Maps a per-user secret token → Supabase auth.users UUID.
// Set in Vercel dashboard (and .env.local for local dev):
//   MCP_TOKEN_USER1 / MCP_TOKEN_USER2  — generate with: openssl rand -hex 32
//   VOICE_USER_1_UUID / VOICE_USER_2_UUID — from Supabase dashboard → Authentication → Users
function buildTokenMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const token1 = process.env.MCP_TOKEN_USER1
  const uuid1 = process.env.VOICE_USER_1_UUID
  const token2 = process.env.MCP_TOKEN_USER2
  const uuid2 = process.env.VOICE_USER_2_UUID
  if (token1 && uuid1) map[token1] = uuid1
  if (token2 && uuid2) map[token2] = uuid2
  return map
}

export function userIdFromToken(token: string): string | null {
  return buildTokenMap()[token] ?? null
}
