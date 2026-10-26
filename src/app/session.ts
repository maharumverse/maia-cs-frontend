import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSession, logout, type Identity } from '@/api/auth'
import { SESSION_KEY } from '@/api/client'
import type { ApiError } from '@/api/errors'

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; identity: Identity }
  | { status: 'error'; error: ApiError; retry: () => void }

// Status sesi dari GET auth/me. Selama pengecekan belum selesai statusnya loading,
// supaya guard rute tidak mengalihkan sebelum tahu pengguna sudah masuk atau belum.
export function useSession(): SessionState {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    retry: false,
    refetchOnWindowFocus: true,
  })

  if (query.data === undefined) {
    if (query.isError && !query.isFetching) {
      return { status: 'error', error: query.error as ApiError, retry: () => void query.refetch() }
    }
    return { status: 'loading' }
  }
  if (query.data === null) return { status: 'anonymous' }
  return { status: 'authenticated', identity: query.data }
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(SESSION_KEY, null),
  })
}
