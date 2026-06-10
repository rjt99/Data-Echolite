import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CreateWorkflowPage from './pages/CreateWorkflowPage'
import ProcessingPage from './pages/ProcessingPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [user, setUser] = useState(null)

  const guard = (element) => user ? element : <Navigate to="/" replace />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/workflow" replace /> : <LoginPage onLogin={setUser} />
        } />
        <Route path="/workflow"              element={guard(<CreateWorkflowPage user={user} />)} />
        <Route path="/processing/:jobId"     element={guard(<ProcessingPage user={user} />)} />
        <Route path="/dashboard/:jobId"      element={guard(<DashboardPage user={user} />)} />
        {/* Legacy routes without jobId redirect to workflow */}
        <Route path="/processing"            element={guard(<Navigate to="/workflow" replace />)} />
        <Route path="/dashboard"             element={guard(<Navigate to="/workflow" replace />)} />
        <Route path="*"                      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
