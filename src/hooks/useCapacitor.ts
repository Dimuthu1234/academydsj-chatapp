import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

export const useCapacitor = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const backButtonListener = useRef<PluginListenerHandle | null>(null)
  const appStateListener = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    // Configure status bar
    const configureStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#0a0a12' })
      } catch (error) {
        console.log('StatusBar not available:', error)
      }
    }

    const setupListeners = async () => {
      // Handle hardware back button
      backButtonListener.current = await App.addListener('backButton', ({ canGoBack }) => {
        // If we're on the main screens, show exit confirmation or minimize
        const mainScreens = ['/', '/chat', '/calls', '/settings']

        if (mainScreens.includes(location.pathname)) {
          // On main screens, let the app handle it (minimize or exit)
          App.minimizeApp()
        } else if (canGoBack) {
          // Navigate back in the app
          navigate(-1)
        } else {
          // If can't go back, go to home
          navigate('/')
        }
      })

      // Handle app state changes
      appStateListener.current = await App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active:', isActive)
      })
    }

    configureStatusBar()
    setupListeners()

    return () => {
      backButtonListener.current?.remove()
      appStateListener.current?.remove()
    }
  }, [navigate, location.pathname])
}

// Initialize Capacitor on app start
export const initializeCapacitor = async () => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0a0a12' })

    // Hide the splash screen after a delay
    // SplashScreen will auto-hide based on config
  } catch (error) {
    console.log('Capacitor initialization error:', error)
  }
}
