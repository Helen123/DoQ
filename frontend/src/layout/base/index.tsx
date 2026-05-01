import logo from '@/assets/logo.png'
import { deviceState } from '@/store/device'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import { Background } from './background'
import './index.scss'

const TITLE = import.meta.env.VITE_TITLE

export function BaseLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const device = useSnapshot(deviceState)

  return (
    <div className="base-layout">
      <div className="base-layout__sidebar">
        <div className="base-layout__logo">
          <img
            className="logo"
            src={logo}
            onClick={() => (device.chatting ? null : navigate('/'))}
          />
          <span className="title">{TITLE}</span>
        </div>
        <nav className="base-layout__nav">
          <div
            className={`base-layout__nav-item${location.pathname !== '/repository' ? ' active' : ''}`}
            onClick={() => navigate('/')}
          >
            ▶ CHAT
          </div>
          <div
            className={`base-layout__nav-item${location.pathname === '/repository' ? ' active' : ''}`}
            onClick={() => navigate('/repository')}
          >
            ▶ KNOWLEDGE
          </div>
        </nav>
      </div>

      <div className="base-layout__content">{children}</div>

      <Background />
    </div>
  )
}
