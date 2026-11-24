import { Suspense } from 'react'
import { AppShell } from './core/layout/AppShell/AppShell'

function App() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  )
}

export default App
