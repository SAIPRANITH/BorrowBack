import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import { Heart, Package } from 'lucide-react'

export default function Layout() {
 const location = useLocation()
 
 // Scroll to top on every route change
 useEffect(() => {
 window.scrollTo({ top: 0, behavior: 'instant' })
 }, [location.pathname])

 return (
 <div className="min-h-screen relative flex flex-col md:flex-row bg-[#09090b]">
 {/* Background ambient orbs and dot-grid pattern */}
 <div className="fixed inset-0 pointer-events-none z-0">
 <div
 className="absolute inset-0 opacity-[0.03]"
 style={{
 backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 1) 1px, transparent 1px)',
 backgroundSize: '32px 32px',
 }}
 />
 <div 
 className="absolute inset-0 opacity-10 bg-cover bg-center"
 style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&auto=format&fit=crop")' }}
 />
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
 <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
 </div>

 {/* The Sidebar */}
 <Navbar />

 {/* Main Content Area */}
 <main 
 key={location.pathname} 
 className="flex-1 w-full md:ml-72 relative z-10 pt-20 md:pt-4 p-4 sm:p-6 lg:p-8 animate-fade-in-up pb-24 md:pb-0 flex flex-col min-h-screen"
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
 <div className="flex items-center justify-center gap-1.5 bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
 Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> for Campus Communities
 </div>
 <div className="flex items-center justify-center gap-4 text-xs font-medium">
 <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
 <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
 <a href="#" className="hover:text-cyan-400 transition-colors">Support</a>
 </div>
 </footer>
 </main>
 </div>
 )
}
