import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  MessageSquare,
  Phone,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/', icon: MessageSquare, label: 'Chats' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="w-20 bg-bg-secondary h-screen flex flex-col items-center pt-10 pb-6 border-r border-border-color relative">
      {/* Close button for mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors md:hidden"
        >
          <X size={20} />
        </button>
      )}
      <div className="mb-10">
        <img
          src="/logo.jpg"
          alt="AcademyDSJ"
          className="w-11 h-11 rounded-xl object-cover"
        />
      </div>

      <nav className="flex-1 flex flex-col items-center space-y-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative
              ${
                isActive
                  ? 'bg-accent-primary text-bg-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`
            }
          >
            <Icon size={22} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-bg-tertiary text-text-primary text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button
          onClick={logout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-text-secondary hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 group relative"
        >
          <LogOut size={22} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-bg-tertiary text-text-primary text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Logout
          </span>
        </button>
        <div className="relative group">
          <Avatar
            src={user?.avatarUrl}
            status={user?.status}
            size="md"
          />
          <span className="absolute left-full ml-3 px-2 py-1 bg-bg-tertiary text-text-primary text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {user?.displayName}
          </span>
        </div>
      </div>
    </div>
  )
}
