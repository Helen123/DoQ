import { getGuestId } from '@/utils/guest'
import { ResponseError } from '../error'
import { IRequestPlugin } from './plugin'
import { MESSAGE_KEY } from './service'

export const authPlugin: IRequestPlugin = {
  install(instance) {
    instance.interceptors.request.use((config) => {
      config.headers['X-Guest-ID'] = getGuestId()
      return config
    })

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const response = error.response
        if (!response) return Promise.reject(error)

        const code = response?.status
        const msg = response?.data?.[MESSAGE_KEY]

        if (code === 429) {
          const message = msg || 'Daily message limit reached. Come back tomorrow!'
          return Promise.reject(new ResponseError(message, response))
        }

        return Promise.reject(error)
      },
    )
  },
}
