import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode disabled: speech recognition session must not double-start in dev.
createRoot(document.getElementById('root')!).render(<App />)
