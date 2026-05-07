import '@fontsource/press-start-2p/latin.css'
import 'normalize.css'
import { createRoot } from 'react-dom/client'
import './antd.scss'
import App from './App.tsx'
import './index.css'
import './styles/pixel-theme.scss'

createRoot(document.getElementById('root')!).render(<App />)
