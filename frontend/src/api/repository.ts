import { AxiosRequestConfig } from 'axios'
import { request } from './request'

export function list(params?: {}, options?: AxiosRequestConfig) {
  return request.get<{ documents: string[] }>('/documents', {
    ...options,
    params,
  })
}
