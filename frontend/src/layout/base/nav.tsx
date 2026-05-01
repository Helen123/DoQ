import * as api from '@/api'
import iconNewChat from '@/assets/layout/newchat.svg'
import { useNavigate } from 'react-router-dom'
import './nav.scss'

export function Nav() {
  const navigate = useNavigate()

  async function handleNewChat() {
    const { data } = await api.session.create()
    navigate(`/chat/${data.session_id}`)
  }

  return (
    <div className="base-layout-nav">
      <div className="base-layout-nav__new" onClick={handleNewChat}>
        <img src={iconNewChat} alt="new chat" />
        <span>New Chat</span>
      </div>
    </div>
  )
}
