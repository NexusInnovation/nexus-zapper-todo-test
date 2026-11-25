import { Navigate, createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { RouteHydrateFallback } from './RouteHydrateFallback'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    HydrateFallback: RouteHydrateFallback,
    children: [
      {
        index: true,
        lazy: async () => {
          const { TodoListPage } =
            await import('../modules/todos/TodoListPage/TodoListPage')
          return { Component: TodoListPage }
        },
      },
      {
        path: '404',
        lazy: async () => {
          const { NotFoundPage } = await import('./pages/NotFoundPage')
          return { Component: NotFoundPage }
        },
      },
      {
        path: 'healthcheck',
        lazy: async () => {
          const { HealthcheckPage } = await import('./pages/HealthcheckPage')
          return { Component: HealthcheckPage }
        },
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
])
