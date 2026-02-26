// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FormStateManagement from './form-state-management.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <FormStateManagement />
  // </StrictMode>,
)
