import IconCopy from '@/assets/chat/copy.svg'
import IconRefresh from '@/assets/chat/refresh.svg'
import IconShare from '@/assets/chat/share.svg'
import IconTip from '@/assets/chat/tip.svg'
import Markdown from '@/components/markdown'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Dropdown, Tag } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { TokenizerAndRendererExtension } from 'marked'
import { useCallback, useMemo } from 'react'
import styles from './result.module.scss'

const TRACE_ORDER = ['query', 'embedding', 'search', 'rerank', 'context', 'llm']

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(4)
  }
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return '-'
  }
  return JSON.stringify(value)
}

function statusIcon(status: API.RagTraceStep['status']) {
  if (status === 'running') return <LoadingOutlined />
  if (status === 'complete') return <CheckCircleOutlined />
  if (status === 'error') return <CloseCircleOutlined />
  return <ClockCircleOutlined />
}

function RagTrace(props: {
  steps?: API.RagTraceStep[]
  onRefrence?: (index: number) => void
}) {
  const { steps, onRefrence } = props

  const ordered = useMemo(() => {
    return [...(steps ?? [])].sort((a, b) => {
      const aIndex = TRACE_ORDER.indexOf(a.id)
      const bIndex = TRACE_ORDER.indexOf(b.id)
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    })
  }, [steps])

  if (!ordered.length) return null

  return (
    <div className={styles['rag-trace']}>
      <div className={styles['rag-trace__flow']}>
        {ordered.map((step, index) => (
          <div className={styles['rag-trace-node-wrap']} key={step.id}>
            <div
              className={classNames(
                styles['rag-trace-node'],
                styles[`rag-trace-node--${step.status}`],
              )}
            >
              <span className={styles['rag-trace-node__icon']}>
                {statusIcon(step.status)}
              </span>
              <span className={styles['rag-trace-node__title']}>
                {step.title}
              </span>
            </div>
            {index < ordered.length - 1 ? (
              <ArrowRightOutlined className={styles['rag-trace__arrow']} />
            ) : null}
          </div>
        ))}
      </div>

      <Collapse
        ghost
        size="small"
        className={styles['rag-trace__details']}
        items={ordered.map((step) => ({
          key: step.id,
          label: (
            <div className={styles['rag-trace-panel-title']}>
              <span>{step.title}</span>
              <Tag bordered={false}>{step.status}</Tag>
            </div>
          ),
          children: (
            <div className={styles['rag-trace-panel']}>
              <p>{step.description}</p>

              {step.details ? (
                <div className={styles['rag-trace-kv']}>
                  {Object.entries(step.details).map(([key, value]) => (
                    <div className={styles['rag-trace-kv__row']} key={key}>
                      <span>{key.replace(/_/g, ' ')}</span>
                      <strong>{formatValue(value)}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              {step.matches?.length ? (
                <div className={styles['rag-trace-matches']}>
                  {step.matches.map((match) => (
                    <button
                      className={styles['rag-trace-match']}
                      key={`${step.id}-${match.rank}`}
                      onClick={() => onRefrence?.(match.rank - 1)}
                      type="button"
                    >
                      <span className={styles['rag-trace-match__rank']}>
                        #{match.rank}
                      </span>
                      <span className={styles['rag-trace-match__body']}>
                        <strong>{match.document_name || 'Untitled'}</strong>
                        <span>{match.content_preview}</span>
                      </span>
                      {typeof match.score === 'number' ? (
                        <span className={styles['rag-trace-match__score']}>
                          {match.score.toFixed(4)}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ),
        }))}
      />
    </div>
  )
}

export function Result(props: {
  item: API.ChatItem
  isEnd?: boolean
  onSend?: (text: string) => void
  onRefrence?: (index: number) => void
}) {
  const { item, isEnd, onSend, onRefrence } = props

  const shareMenu = useMemo(() => {
    return [
      {
        key: 'pdf',
        label: 'Export as TXT',
        onClick: async () => {
          const url = `data:text/plain;charset=utf-8,${encodeURIComponent(item.content ?? '')}`
          const a = document.createElement('a')
          a.href = url
          a.download = 'output.txt'
          a.click()
        },
      },
      {
        key: 'email',
        label: 'Send to Email',
      },
    ]
  }, [item.content])

  /* markdown */
  const extensions = useMemo<TokenizerAndRendererExtension[]>(
    () => [
      {
        name: 'reference',
        level: 'inline',
        start(src) {
          return src.match(/##\d+\$\$/)?.index
        },
        tokenizer(src) {
          const match = /^##(\d+?)\$\$/.exec(src)
          if (match) {
            const [raw, index] = match
            return {
              type: 'reference',
              raw,
              index: this.lexer.inlineTokens(index),
              tokens: [],
            }
          }
        },
        renderer(token) {
          const index = this.parser.parseInline(token.index)
          return `<span class="refrence-token" data-refrence-index="${index}">[${Number(index) + 1}]</span>`
        },
      },
    ],
    [],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      const index = target.getAttribute('data-refrence-index')
      if (index) {
        onRefrence?.(Number(index))
      }
    },
    [onRefrence],
  )

  return (
    <div className={styles['chat-message-result']}>
      {item.think ? (
        <Markdown
          className={classNames(
            styles['chat-message-result__think'],
            styles['chat-message-result__md'],
          )}
          value={item.think}
          extensions={extensions}
          onClick={handleClick}
        />
      ) : null}

      {item.content ? (
        <Markdown
          className={styles['chat-message-result__md']}
          value={item.content}
          extensions={extensions}
          onClick={handleClick}
        />
      ) : null}

      {item.error ? (
        <div className={styles['chat-message-result__error']}>{item.error}</div>
      ) : null}

      <RagTrace steps={item.rag_trace} onRefrence={onRefrence} />

      {item.loading ? null : (
        <>
          <div className={styles['chat-message-result__actions']}>
            <div className={styles['date']}>
              {dayjs().format('HH:mm YYYY/MM/DD')}
            </div>

            {isEnd ? null : (
              <Button
                variant="text"
                color="primary"
                shape="circle"
                size="small"
                style={{ color: 'var(--ant-color-primary)' }}
              >
                <img src={IconRefresh} />
              </Button>
            )}

            <Button
              variant="text"
              color="primary"
              shape="circle"
              size="small"
              style={{ color: 'var(--ant-color-primary)' }}
            >
              <img src={IconTip} />
            </Button>

            <Button
              variant="text"
              color="primary"
              shape="circle"
              size="small"
              style={{ color: 'var(--ant-color-primary)' }}
            >
              <img src={IconCopy} />
            </Button>

            <Dropdown menu={{ items: shareMenu }}>
              <Button
                variant="text"
                color="primary"
                shape="circle"
                size="small"
                style={{ color: 'var(--ant-color-primary)' }}
              >
                <img src={IconShare} />
              </Button>
            </Dropdown>
          </div>

          {isEnd ? (
            <div className={styles['chat-message-result__quick-reply']}>
              {item.recommended_questions?.map((item) => (
                <Button
                  className={styles['item']}
                  key={item}
                  onClick={() => onSend?.(item)}
                >
                  <span className={styles['text']}>🔎 {item}</span>
                  <ArrowRightOutlined className={styles['arrow']} />
                </Button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
