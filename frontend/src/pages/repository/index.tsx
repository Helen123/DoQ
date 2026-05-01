import * as api from '@/api'
import { useRequest } from 'ahooks'
import { useState } from 'react'
import { FileIcon } from './components/file-icon'
import styles from './index.module.scss'

type IDoc = {
  key: string
  name: string
  suffix: string
}

const API_BASE = import.meta.env.VITE_API_BASE as string

export default function Index() {
  const [selected, setSelected] = useState<IDoc | null>(null)

  const { data = [], loading } = useRequest(async () => {
    const { data } = await api.repository.list()
    return (data?.documents ?? []).map((name) => ({
      key: name,
      name,
      suffix: name.split('.').pop() ?? 'other',
    }))
  })

  return (
    <div className={styles['repository-page']}>
      <div className={styles['repository-page__header']}>
        <div className={styles['title']}>KNOWLEDGE BASE</div>
        <div className={styles['desc']}>
          Click a document to preview · Ask anything about these files in the chat
        </div>
      </div>

      <div className={styles['repository-page__split']}>
        <div className={styles['repository-page__list']}>
          <div className={styles['list-header']}>DOCUMENTS</div>
          {loading && <div className={styles['list-empty']}>Loading...</div>}
          {!loading && data.length === 0 && (
            <div className={styles['list-empty']}>No documents found</div>
          )}
          {data.map((doc) => (
            <div
              key={doc.key}
              className={`${styles['list-item']} ${selected?.key === doc.key ? styles['selected'] : ''}`}
              onClick={() => setSelected(doc)}
            >
              <FileIcon className={styles['item-icon']} suffix={doc.suffix as any} />
              <span className={styles['item-name']} title={doc.name}>{doc.name}</span>
              <span className={styles['item-badge']}>● IDX</span>
            </div>
          ))}
        </div>

        {selected && selected.suffix === 'pdf' ? (
          <div className={styles['repository-page__preview']}>
            <div className={styles['preview-header']}>{selected.name}</div>
            <iframe
              src={`${API_BASE}/preview/${encodeURIComponent(selected.name)}#toolbar=0&view=FitH`}
              className={styles['preview-iframe']}
              title={selected.name}
            />
          </div>
        ) : (
          <div className={styles['repository-page__placeholder']}>
            <div className={styles['placeholder-icon']}>📄</div>
            <div className={styles['placeholder-text']}>SELECT A DOCUMENT TO PREVIEW</div>
          </div>
        )}
      </div>
    </div>
  )
}
