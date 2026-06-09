import React from 'react'

const SIZES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${SIZES[size]} border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin ${className}`}
    />
  )
}
