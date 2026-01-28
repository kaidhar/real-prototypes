'use client'

import React from 'react'
import { MessageCircle, X } from 'lucide-react'

// Amazon design tokens
const colors = {
  orange: '#FF9900',
  orangeHover: '#FA8900',
  white: '#FFFFFF',
}

interface ChatbotButtonProps {
  isOpen: boolean
  onClick: () => void
  hasUnread?: boolean
}

export default function ChatbotButton({ isOpen, onClick, hasUnread = false }: ChatbotButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: colors.orange,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(255, 153, 0, 0.4)',
        transition: 'all 0.3s ease',
        zIndex: 9998,
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.orangeHover
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.orange
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X size={28} color={colors.white} />
      ) : (
        <MessageCircle size={28} color={colors.white} />
      )}

      {/* Unread indicator */}
      {hasUnread && !isOpen && (
        <span
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '18px',
            height: '18px',
            backgroundColor: '#CC0C39',
            borderRadius: '50%',
            border: `2px solid ${colors.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: colors.white,
          }}
        >
          1
        </span>
      )}
    </button>
  )
}
