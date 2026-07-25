import React from 'react'

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} rounded-2xl bg-gradient-to-br from-blue-400/40 via-blue-500/80 to-blue-600 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[55%] h-[55%] text-white">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </div>
  )
}
