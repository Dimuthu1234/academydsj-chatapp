import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Home } from '@/pages/Home'
import { Calls } from '@/pages/Calls'
import { Groups } from '@/pages/Groups'
import { Settings } from '@/pages/Settings'
import { useAuthStore } from '@/stores/authStore'
import { useCapacitor, initializeCapacitor } from '@/hooks/useCapacitor'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  // Initialize Capacitor features
  useCapacitor()

  useEffect(() => {
    initializeCapacitor()
  }, [])

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
