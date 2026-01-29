import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Check if we're running in a Capacitor native app (Android/iOS)
// This checks for Capacitor's bridge without importing the module
const isCapacitorNative = (): boolean => {
  // Check if running in Electron
  if (typeof window !== 'undefined' && (window as any).electron) {
    return false
  }
  // Check for Capacitor native bridge
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform) {
    return (window as any).Capacitor.isNativePlatform()
  }
  return false
}

export const useCapacitor = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Only run on native mobile platforms (Android/iOS), not Electron or web
    if (!isCapacitorNative()) {
      return
    }

    const setupCapacitor = async () => {
      try {
        // Dynamically import Capacitor plugins only on native platforms
        const { App } = await import('@capacitor/app')
        const { StatusBar, Style } = await import('@capacitor/status-bar')

        // Configure status bar
        try {
          await StatusBar.setStyle({ style: Style.Dark })
          await StatusBar.setBackgroundColor({ color: '#0a0a12' })
        } catch (error) {
          console.log('StatusBar not available:', error)
        }

        // Handle hardware back button
        const backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
          const mainScreens = ['/', '/chat', '/calls', '/settings']

          if (mainScreens.includes(location.pathname)) {
            App.minimizeApp()
          } else if (canGoBack) {
            navigate(-1)
          } else {
            navigate('/')
          }
        })

        // Handle app state changes
        const appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active:', isActive)
        })

        // Store cleanup function
        cleanupRef.current = () => {
          backButtonListener.remove()
          appStateListener.remove()
        }
      } catch (error) {
        console.log('Capacitor setup error:', error)
      }
    }

    setupCapacitor()

    return () => {
      cleanupRef.current?.()
    }
  }, [navigate, location.pathname])
}

// Initialize Capacitor on app start
export const initializeCapacitor = async () => {
  // Only run on native mobile platforms
  if (!isCapacitorNative()) {
    return
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0a0a12' })
  } catch (error) {
    console.log('Capacitor initialization error:', error)
  }
}
