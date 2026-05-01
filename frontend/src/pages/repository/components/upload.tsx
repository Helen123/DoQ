import * as api from '@/api'
import IconUpload from '@/assets/repository/upload.svg'
import { Upload, UploadFile, UploadProps } from 'antd'
import { forwardRef, useImperativeHandle, useState } from 'react'
import styles from './upload.module.scss'

export type RepositoryUploadRef = {
  submit: () => Promise<void>
}

export default forwardRef<RepositoryUploadRef, UploadProps>(
  function RepositoryUpload(props: UploadProps, ref) {
    const { ...otherProps } = props

    const [fileList, setFileList] = useState<UploadFile[]>([])

    useImperativeHandle(ref, () => {
      return {
        submit: async () => {
          let hasError = false
          const errors: Error[] = []

          for (const file of fileList) {
            if (file.status === 'done') continue

            setFileList((prev) =>
              prev.map((item) => {
                if (item.uid === file.uid) {
                  return { ...item, status: 'uploading' }
                }
                return item
              }),
            )
            try {
              if ((file.size ?? 0) > 5 * 1024 * 1024) {
                throw new Error('File size must not exceed 5MB')
              }
              await api.repository.upload({ files: file.originFileObj as File })

              setFileList((prev) =>
                prev.map((item) => {
                  if (item.uid === file.uid) {
                    return { ...item, status: 'done', url: '#' }
                  }
                  return item
                }),
              )
            } catch (error: any) {
              hasError = true
              errors.push(error)
              setFileList((prev) =>
                prev.map((item) => {
                  if (item.uid === file.uid) {
                    return { ...item, status: 'error', response: error?.message }
                  }
                  return item
                }),
              )
            }
          }

          if (hasError) {
            window.$app.message.error(errors?.[0]?.message)
            throw new Error(errors?.[0]?.message)
          } else {
            window.$app.message.success('Upload complete')
          }
        },
      }
    })

    return (
      <div className={styles['repository-upload']}>
        <Upload.Dragger
          {...otherProps}
          showUploadList={false}
          maxCount={10}
          fileList={fileList}
          onChange={(info) => setFileList(info.fileList)}
        >
          <img src={IconUpload} />
          <p className="ant-upload-text" style={{ color: '#666' }}>
            Drag files here or{' '}
            <span style={{ color: '#2d4a8a' }}>click to upload</span>
          </p>
        </Upload.Dragger>

        <p className={styles['repository-upload__desc']}>
          Single or batch upload supported. Max 5MB per file, up to 10 files.
        </p>

        <Upload
          fileList={fileList}
          onChange={(info) => setFileList(info.fileList)}
        />
      </div>
    )
  },
)
