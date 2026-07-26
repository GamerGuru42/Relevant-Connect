import React from 'react'

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} relative rounded-[28%] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 translate-x-[-10%] translate-y-[-10%] rounded-[28%]"></div>
      <div className="absolute inset-0 rounded-[28%] ring-1 ring-inset ring-white/30"></div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-[50%] h-[50%] text-white drop-shadow-md relative z-10">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </div>
  )
}
