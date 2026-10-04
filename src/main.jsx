import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './chronoearth.css'
import App from './ChronoEarth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
