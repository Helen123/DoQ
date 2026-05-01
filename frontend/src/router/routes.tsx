import { BaseLayout } from '@/layout/base'
import NotFound from '@/pages/404'
import Chat from '@/pages/chat'
import Index from '@/pages/index'
import Repository from '@/pages/repository'
import { Outlet, RouteObject, createBrowserRouter, useLocation } from 'react-router-dom'
import { RouterGuard } from './guard'

export type IRouteObject = {
  children?: IRouteObject[]
  name?: string
  auth?: boolean
  pure?: boolean
  meta?: any
} & Omit<RouteObject, 'children'>

export const routes: IRouteObject[] = [
  { path: '/', Component: Index },
  { path: '/chat/:id', Component: Chat },
  { path: '/repository', Component: Repository },
]

function Layout() {
  const location = useLocation()
  return (
    <BaseLayout>
      <RouterGuard>
        <Outlet key={location.pathname} />
      </RouterGuard>
    </BaseLayout>
  )
}

export const router = createBrowserRouter(
  [
    { path: '/', Component: Layout, children: routes },
    { path: '404', Component: NotFound },
    { path: '*', Component: NotFound },
  ],
  { basename: import.meta.env.BASE_URL },
)
