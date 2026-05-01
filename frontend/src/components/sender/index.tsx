import IconSendThunder from '@/assets/component/send-thunder.svg'
import { Button, Input, Space } from 'antd'
import classNames from 'classnames'
import { PropsWithChildren, useState } from 'react'
import './index.scss'
import Recorder from './recorder'

export default function ComSender(
  props: PropsWithChildren<{
    className?: string
    loading?: boolean
    onSend?: (value: string) => void | Promise<void>
    onContract?: () => void
    sessionId?: string
  }>,
) {
  const { className, onSend, loading } = props
  const [value, setValue] = useState('')

  async function send() {
    if (loading) return
    if (!value.trim()) return
    const message = value
    setValue('')
    await onSend?.(message)
  }

  return (
    <div className={classNames('com-sender', className)}>
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        placeholder="Ask a question... (Shift+Enter for new line)"
        autoSize={{ minRows: 2 }}
        autoFocus
      />

      <div className="com-sender__actions">
        <Space className="com-sender__actions-left" size={12}>
          <Recorder onMessage={(text) => setValue(text)} />
        </Space>

        <Space className="com-sender__actions-right" size={12}>
          <Button
            className="com-sender__action--send"
            variant="solid"
            color="primary"
            shape="round"
            onClick={send}
            loading={loading}
          >
            SEND
            <img src={IconSendThunder} />
          </Button>
        </Space>
      </div>
    </div>
  )
}
