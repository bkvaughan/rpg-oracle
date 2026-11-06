import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pirata-one'
import '@fontsource/im-fell-english-sc'
import '@fontsource/alegreya/400.css'
import '@fontsource/alegreya/400-italic.css'
import '@fontsource/alegreya/700.css'
import './styles/global.css'
import './styles/oracle.css'
import { startAtmosphere } from './ui/atmosphere.ts'
import App from './ui/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

startAtmosphere()
