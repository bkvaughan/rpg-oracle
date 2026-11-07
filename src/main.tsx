import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/metamorphous/latin-400.css'
import '@fontsource/cardo/latin-400.css'
import '@fontsource/cardo/latin-400-italic.css'
import '@fontsource/cardo/latin-700.css'
import './styles/global.css'
import './styles/oracle.css'
import App from './ui/App.tsx'

// A reload starts a fresh page (the session comes back only through the recovery banner), so
// the browser's restored scroll position points at nothing and can hide that banner.
history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
