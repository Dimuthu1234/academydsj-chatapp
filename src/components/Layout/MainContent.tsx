import React from 'react'

interface MainContentProps {
  children: React.ReactNode
  className?: string
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <main className={`flex-1 overflow-hidden ${className}`}>
      {children}
    </main>
  )
}
