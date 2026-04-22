// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import QueryAndStateManagement from './query-and-state-management'
import I18 from './i18'
import HookForm from './Hook-form'
// import FormStateManagement from './form-state-management.tsx'
// import './index.css'
// import CounterApp from './tutorial/01-intro-and-counter-app.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <QueryAndStateManagement />
  // </StrictMode>,
)
