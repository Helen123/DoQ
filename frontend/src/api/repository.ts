import { AxiosRequestConfig } from 'axios'
import { request } from './request'

export function list(params?: {}, options?: AxiosRequestConfig) {
  return request.get<{ documents: string[] }>('/documents', {
    ...options,
    params,
  })
}

export function upload(params: { files: File }, options?: AxiosRequestConfig) {
  const form = new FormData()
  form.append('files', params.files)

  return request.post('/upload', form, {
    loading: false,
    ...options,
  })
}
