import React, { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, Smile, Image, X } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => void
  onTyping: () => void
  disabled?: boolean
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file)
          setPreviewUrl(url)
        }
      }
    },
    []
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim() && !selectedFile) return

      onSendMessage(message.trim(), selectedFile || undefined)
      setMessage('')
      clearFile()
    },
    [message, selectedFile, onSendMessage, clearFile]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    },
    [handleSubmit]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
      onTyping()
    },
    [onTyping]
  )

  return (
    <div className="p-3 md:p-4 bg-bg-secondary border-t border-border-color safe-area-bottom">
      {selectedFile && (
        <div className="mb-3 p-3 bg-bg-tertiary rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                <Paperclip className="text-accent-primary" size={20} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-secondary">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1 rounded-full hover:bg-bg-primary transition-colors"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2 md:space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors touch-target"
            disabled={disabled}
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*'
                fileInputRef.current.click()
                fileInputRef.current.accept =
                  'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
              }
            }}
            className="hidden sm:flex p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors touch-target"
            disabled={disabled}
          >
            <Image size={20} />
          </button>
          <button
            type="button"
            className="hidden sm:flex p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors touch-target"
            disabled={disabled}
          >
            <Smile size={20} />
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200"
            style={{ maxHeight: '120px', minHeight: '48px' }}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || (!message.trim() && !selectedFile)}
          className="p-3 rounded-xl bg-accent-primary text-bg-primary hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
