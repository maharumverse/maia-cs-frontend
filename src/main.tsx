import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { App } from '@/app/App'
import { UpdateNotice } from '@/app/UpdateNotice'
import { queryClient } from '@/api/client'
import { ConfigError, getConfig } from '@/config'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemen #root tidak ada di index.html.')

// Config yang salah harus terlihat jelas, bukan layar kosong. Isi pesan dipasang lewat
// textContent, tidak pernah lewat HTML.
function showConfigError(error: ConfigError) {
  const box = document.createElement('div')
  box.className = 'gate'
  box.setAttribute('role', 'alert')
  const text = document.createElement('p')
  text.textContent = error.message
  box.append(text)
  rootElement!.replaceChildren(box)
}

try {
  getConfig()
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <UpdateNotice />
      </QueryClientProvider>
    </StrictMode>,
  )
} catch (error) {
  if (error instanceof ConfigError) showConfigError(error)
  else throw error
}
