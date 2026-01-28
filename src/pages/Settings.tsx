import React, { useState, useRef } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  Info,
  Camera,
  Save,
} from 'lucide-react'
import { Header } from '@/components/Layout/Header'
import { Avatar } from '@/components/Common/Avatar'
import { Button } from '@/components/Common/Button'
import { Input } from '@/components/Common/Input'
import { useAuth } from '@/hooks/useAuth'
import { uploadFile } from '@/services/api'
import { useNotificationStore, requestNotificationPermission } from '@/stores/notificationStore'

type SettingsSection = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'help' | 'about'
type UserStatus = 'online' | 'away' | 'busy' | 'offline'

const NotificationSettings: React.FC = () => {
  const { settings, updateSettings } = useNotificationStore()

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key]
    updateSettings({ [key]: newValue })

    // Request permission when enabling desktop notifications
    if (key === 'desktopNotifications' && newValue) {
      await requestNotificationPermission()
    }
  }

  const notificationOptions = [
    { key: 'messageNotifications' as const, label: 'Message notifications', description: 'Get notified when you receive messages' },
    { key: 'callNotifications' as const, label: 'Call notifications', description: 'Get notified for incoming calls' },
    { key: 'groupNotifications' as const, label: 'Group notifications', description: 'Get notified for group activity' },
    { key: 'soundEnabled' as const, label: 'Sound', description: 'Play sound for notifications' },
    { key: 'desktopNotifications' as const, label: 'Desktop notifications', description: 'Show notifications on desktop' },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-text-primary">
        Notification Settings
      </h3>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
          >
            <div>
              <p className="font-medium text-text-primary">{option.label}</p>
              <p className="text-sm text-text-secondary">{option.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[option.key]}
                onChange={() => handleToggle(option.key)}
              />
              <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Settings: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [status, setStatus] = useState<UserStatus>((user?.status as UserStatus) || 'online')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy & Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'help' as const, label: 'Help', icon: HelpCircle },
    { id: 'about' as const, label: 'About', icon: Info },
  ]

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ displayName, status, avatarUrl: avatarUrl || undefined })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadFile(file)
      setAvatarUrl(result.url)
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">
              Profile Settings
            </h3>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar src={avatarUrl || user?.avatarUrl} size="xl" className="w-24 h-24" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-accent-primary rounded-full hover:bg-accent-secondary transition-colors disabled:opacity-50"
                >
                  <Camera size={16} className="text-bg-primary" />
                </button>
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Profile Photo</h4>
                <p className="text-sm text-text-secondary">
                  {isUploading ? 'Uploading...' : 'Click the camera icon to upload'}
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Do Not Disturb</option>
                  <option value="offline">Appear Offline</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleSaveProfile}
                  isLoading={isLoading}
                  leftIcon={<Save size={16} />}
                >
                  Save Changes
                </Button>
                {saveSuccess && (
                  <span className="text-accent-primary text-sm font-medium">
                    Saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return <NotificationSettings />

      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">
              Privacy & Security
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Show online status', description: 'Let others see when you are online' },
                { label: 'Read receipts', description: 'Let others know when you have read messages' },
                { label: 'Typing indicators', description: 'Show when you are typing' },
                { label: 'Two-factor authentication', description: 'Add an extra layer of security' },
              ].map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-text-primary">{setting.label}</p>
                    <p className="text-sm text-text-secondary">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border-color">
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">
              Appearance
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Theme
                </label>
                <div className="flex space-x-4">
                  {[
                    { id: 'dark', label: 'Dark', color: '#1a1a2e' },
                    { id: 'light', label: 'Light', color: '#ffffff' },
                    { id: 'system', label: 'System', color: 'linear-gradient(135deg, #1a1a2e 50%, #ffffff 50%)' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-colors ${
                        theme.id === 'dark'
                          ? 'border-accent-primary'
                          : 'border-border-color hover:border-accent-primary/50'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ background: theme.color }}
                      />
                      <span className="text-sm text-text-primary">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Accent Color
                </label>
                <div className="flex space-x-3">
                  {['#00d26a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full ${
                        color === '#00d26a' ? 'ring-2 ring-offset-2 ring-offset-bg-secondary ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'help':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">
              Help & Support
            </h3>

            <div className="space-y-3">
              {[
                { label: 'FAQ', description: 'Frequently asked questions' },
                { label: 'Contact Support', description: 'Get help from our team' },
                { label: 'Report a Bug', description: 'Help us improve the app' },
                { label: 'Feature Request', description: 'Suggest new features' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-border-color transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-text-primary">{item.label}</p>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </div>
                  <span className="text-text-secondary">→</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">
              About AcademyDSJ Chat
            </h3>

            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-bg-primary font-bold text-3xl">A</span>
              </div>
              <h4 className="text-lg font-semibold text-text-primary mb-1">
                AcademyDSJ Chat
              </h4>
              <p className="text-text-secondary mb-4">Version 1.0.0</p>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                A cross-platform desktop chat and video conferencing application
                for AcademyDSJ online courses business.
              </p>
            </div>

            <div className="space-y-2 text-center text-sm text-text-secondary">
              <p>© 2024 AcademyDSJ. All rights reserved.</p>
              <div className="flex items-center justify-center space-x-4">
                <a href="#" className="hover:text-accent-primary transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-accent-primary transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-accent-primary transition-colors">
                  Licenses
                </a>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-bg-secondary border-r border-border-color p-4">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeSection === id
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  )
}
