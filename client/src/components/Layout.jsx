import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import { Package } from 'lucide-react'

export default function Layout() {
 const location = useLocation()
 
 // Scroll to top on every route change
 useEffect(() => {
 window.scrollTo({ top: 0, behavior: 'instant' })
 }, [location.pathname])

 return (
 <div className="min-h-screen relative flex flex-col md:flex-row bg-[#0c1117]">
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <div className="absolute -top-48 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-cyan-900/[0.08] blur-[140px]" />
 <div className="absolute -bottom-56 left-1/4 h-[30rem] w-[30rem] rounded-full bg-slate-700/[0.06] blur-[140px]" />
 </div>

 {/* The Sidebar */}
 <Navbar />

 {/* Main Content Area */}
 <main 
 key={location.pathname} 
 className="flex-1 w-full md:ml-64 relative z-10 pt-20 md:pt-6 p-4 sm:p-6 lg:p-8 pb-24 md:pb-0 flex flex-col min-h-screen"
 >
 <div className="max-w-6xl mx-auto w-full flex-1">
 <Outlet />
 </div>

 {/* Global Footer */}
 <footer className="mt-16 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-zinc-500 text-sm pb-8 md:pb-6 max-w-6xl mx-auto w-full">
 <div className="flex items-center gap-2 font-semibold justify-center md:justify-start">
 <Package className="w-4 h-4 text-cyan-400/70" />
 <span>BorrowBack &copy; 2026</span>
 </div>
 <p className="text-xs">
 Borrow and lend items with people on your campus.
 </p>
 </footer>
 </main>
 </div>
 )
}
