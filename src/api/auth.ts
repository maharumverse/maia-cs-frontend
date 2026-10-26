import { z } from 'zod'
import { getHttp } from '@/api/client'
import { ApiError, INVALID_RESPONSE } from '@/api/errors'

const identitySchema = z.object({
  nip: z.string(),
  groups: z.array(z.string()),
  is_admin: z.boolean(),
})

export type Identity = z.infer<typeof identitySchema>

function toIdentity(data: unknown): Identity {
  const parsed = identitySchema.safeParse(data)
  if (!parsed.success) throw new ApiError(200, INVALID_RESPONSE, 'Respons server tidak dikenali.')
  return parsed.data
}

// Mengembalikan null bila belum ada sesi (401). Error lain dilempar sebagai ApiError.
export async function fetchSession(): Promise<Identity | null> {
  try {
    const response = await getHttp().get<unknown>('auth/me', { skipUnauthorizedHandler: true })
    return toIdentity(response.data)
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) return null
    throw error
  }
}

// Hanya berlaku di AUTH_MODE=stopgap pada backend. Cookie sesi diset HttpOnly oleh backend.
export async function login(credentials: { nip: string; password: string }): Promise<Identity> {
  const response = await getHttp().post<unknown>('auth/login', credentials, {
    skipUnauthorizedHandler: true,
  })
  return toIdentity(response.data)
}

export async function logout(): Promise<void> {
  await getHttp().post('auth/logout', null, { skipUnauthorizedHandler: true })
}
