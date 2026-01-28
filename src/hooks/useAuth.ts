import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { socketService } from '@/services/socket'

export function useAuth() {
  const navigate = useNavigate()
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    clearError,
  } = useAuthStore()

  useEffect(() => {
    if (token && isAuthenticated) {
      socketService.connect(token)
      // Refresh profile from server to sync across devices
      refreshProfile()
    }
    return () => {
      socketService.disconnect()
    }
  }, [token, isAuthenticated, refreshProfile])

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login(email, password)
        navigate('/')
      } catch {
        // Error is handled in store
      }
    },
    [login, navigate]
  )

  const handleRegister = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        await register(email, password, displayName)
        navigate('/')
      } catch {
        // Error is handled in store
      }
    },
    [register, navigate]
  )

  const handleLogout = useCallback(() => {
    socketService.disconnect()
    logout()
    navigate('/login')
  }, [logout, navigate])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile,
    clearError,
  }
}
