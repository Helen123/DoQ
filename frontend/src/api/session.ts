import { AxiosRequestConfig } from 'axios'
import { request } from './request'

export function create(params?: {}, options?: AxiosRequestConfig) {
  return request.post<
    API.Result<{ session_id: string }>
  >('/create_session', params, options)
}

export function chat(
  params: { id: string; message: string },
  options?: AxiosRequestConfig,
) {
  const { id, ..._params } = params
  return request.post<ReadableStream>(
    '/chat_on_docs',
    { ..._params },
    {
      headers: { Accept: 'text/event-stream' },
      responseType: 'stream',
      adapter: 'fetch',
      loading: false,
      params: { session_id: id },
      ...options,
    },
  )
}

export function quickParse(
  params: { session_id: string; file: File },
  options?: AxiosRequestConfig,
) {
  const form = new FormData()
  form.append('session_id', params.session_id)
  form.append('file', params.file)

  return request.post('/quick_parse', form, {
    loading: false,
    ...options,
  })
}
