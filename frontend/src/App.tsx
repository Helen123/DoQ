import { Router } from '@/router'
import { App as AntdApp, ConfigProvider, Spin } from 'antd'
import enUS from 'antd/es/locale/en_US'
import { useCallback, useRef, useState } from 'react'
function App() {
  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        cssVar: true,
        token: {
          colorPrimary: '#2d4a8a',
          colorLink: '#2d4a8a',
          colorBorder: '#1a2f5c',
          colorText: '#1a2f5c',
          colorTextSecondary: '#6b8ab8',
          borderRadius: 0,
          borderRadiusLG: 0,
          borderRadiusSM: 0,
        },
      }}
    >
      <AntdApp>
        <Router />
        <MountApi />
      </AntdApp>
    </ConfigProvider>
  )
}

function MountApi() {
  window.$app = AntdApp.useApp()

  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const loadingCount = useRef(0)
  window.$showLoading = useCallback(({ title }: { title?: string } = {}) => {
    loadingCount.current++
    setLoading(true)
    setLoadingText(title ?? '')
  }, [])
  window.$hideLoading = useCallback(() => {
    loadingCount.current--
    setTimeout(() => {
      if (loadingCount.current <= 0) {
        setLoading(false)
        setLoadingText('')
      }
    }, 100)
  }, [])

  return (
    <>
      <Spin
        spinning={loading}
        tip={loadingText}
        fullscreen
        style={{
          zIndex: 9999999,
        }}
      ></Spin>
    </>
  )
}

export default App
