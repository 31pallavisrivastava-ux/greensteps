import { randomBytes } from 'crypto'

/** Short uppercase join code for family/class groups. */
export function generateJoinCode() {
  return randomBytes(3).toString('hex').toUpperCase()
}

/**
 * Generate a join code unique within `lookup` (e.g. prisma findUnique).
 * Retries up to 5 times on collision.
 */
export async function generateUniqueJoinCode(lookup) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode()
    const existing = await lookup(joinCode)
    if (!existing) return joinCode
  }
  throw new Error('Could not generate unique join code')
}
