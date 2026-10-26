import { beforeEach, describe, expect, it } from 'vitest'
import { LOOP_WINDOW_MS, clearSsoRedirectMark, isSsoRedirectLoop, markSsoRedirect } from '@/lib/ssoLoop'

describe('ssoLoop', () => {
  beforeEach(() => {
    clearSsoRedirectMark()
  })

  it('tidak mengira lingkaran bila belum pernah mengalihkan', () => {
    expect(isSsoRedirectLoop()).toBe(false)
  })

  it('mengenali pengalihan yang baru saja terjadi', () => {
    markSsoRedirect(1_000)
    expect(isSsoRedirectLoop(1_000 + LOOP_WINDOW_MS - 1)).toBe(true)
  })

  it('melepas penanda setelah jendela waktu lewat', () => {
    markSsoRedirect(1_000)
    expect(isSsoRedirectLoop(1_000 + LOOP_WINDOW_MS)).toBe(false)
  })

  it('melepas penanda saat dibersihkan', () => {
    markSsoRedirect()
    clearSsoRedirectMark()
    expect(isSsoRedirectLoop()).toBe(false)
  })
})
