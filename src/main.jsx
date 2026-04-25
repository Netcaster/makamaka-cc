import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MakamakaCommandCenter from './MakamakaCommandCenter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MakamakaCommandCenter />
  </StrictMode>,
)
