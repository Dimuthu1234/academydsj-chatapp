import React from 'react'
import { NavLink } from 'react-router-dom'
import { MessageSquare, Phone, Users, Settings } from 'lucide-react'

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: MessageSquare, label: 'Chats' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="md:hidden h-16 bg-bg-secondary border-t border-border-color flex items-center justify-around px-2 safe-area-bottom">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive
                ? 'text-accent-primary'
                : 'text-text-secondary'
            }`
          }
        >
          <Icon size={22} />
          <span className="text-xs mt-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
