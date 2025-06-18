import * as React from 'react'

export function Switch({ checked, onCheckedChange, id, disabled }) {
  return (
    <button
      id={id}
      type='button'
      role='switch'
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked)
      }}
      onKeyDown={e => {
        if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
          e.preventDefault()
          onCheckedChange(!checked)
        }
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 ${checked ? 'bg-pink-500' : 'bg-gray-300 dark:bg-[#3a2b36]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ minWidth: 44 }}
      disabled={disabled}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#18171A] shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
        style={{ minWidth: 20 }}
      />
    </button>
  )
} 