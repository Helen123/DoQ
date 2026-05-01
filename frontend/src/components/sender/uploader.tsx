import * as api from '@/api'
import { Button, Upload } from 'antd'

const ACCEPT = ['pdf', 'doc', 'docx', 'txt']
const LIMIT = 5

const IconFile = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 16" width="14" height="16" shape-rendering="crispEdges" fill="currentColor">
    <rect x="0" y="0" width="10" height="2"/>
    <rect x="0" y="2" width="2" height="10"/>
    <rect x="10" y="0" width="2" height="2"/>
    <rect x="10" y="4" width="2" height="10"/>
    <rect x="12" y="2" width="2" height="2"/>
    <rect x="0" y="12" width="14" height="2"/>
    <rect x="3" y="5" width="8" height="2"/>
    <rect x="3" y="9" width="5" height="2"/>
  </svg>
)

export default function Uploader(props: {
  sessionId: string
  onSuccess: (file: File) => void
}) {
  const { sessionId } = props

  return (
    <Upload
      showUploadList={false}
      maxCount={1}
      accept={ACCEPT.map((item) => `.${item}`).join(',')}
      customRequest={async (options) => {
        const file = options.file as File
        const { onSuccess, onError } = options

        const _onError = (error: Error) => {
          onError?.(error)
          window.$app.message.error(error.message)
        }

        const ext = file.name?.split('.')?.pop()?.toLowerCase() ?? ''
        const isAccept = ACCEPT.includes(ext)
        if (!isAccept) {
          return _onError?.(new Error(`Only ${ACCEPT.join(', ')} files are supported`))
        }

        const isLimit = file.size <= LIMIT * 1024 * 1024
        if (!isLimit) {
          return _onError?.(new Error(`File size must be under ${LIMIT}MB`))
        }

        try {
          await api.session.quickParse({
            session_id: sessionId,
            file,
          })
          onSuccess?.('')
          props.onSuccess?.(file)
          window.$app.message.success('Upload successful')
        } catch (error: any) {
          onError?.(error)
        }
      }}
    >
      <Button
        className="com-sender__action--contract"
        variant="filled"
        color="default"
        shape="default"
      >
        {IconFile}
        File
      </Button>
    </Upload>
  )
}
