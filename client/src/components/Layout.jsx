import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
 const location = useLocation()
 
 // Scroll to top on every route change
 useEffect(() => {
 window.scrollTo({ top: 0, behavior: 'instant' })
 }, [location.pathname])

 return (
 <div className="classy-app min-h-screen relative flex flex-col md:flex-row">
 <div aria-hidden="true" className="site-background-art">
 <div className="site-background-mark" />
 </div>
 <div aria-hidden="true" className="site-background-emblems">
 <span className="site-background-emblems__mark site-background-emblems__mark--one" />
 <span className="site-background-emblems__mark site-background-emblems__mark--two" />
 <span className="site-background-emblems__mark site-background-emblems__mark--three" />
 <span className="site-background-emblems__mark site-background-emblems__mark--four" />
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
 <footer className="site-footer mt-16 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-zinc-500 text-sm pb-8 md:pb-6 max-w-6xl mx-auto w-full">
 <div className="flex items-center gap-2 font-semibold justify-center md:justify-start">
 <img src="/icons/borrowback-mark.svg" alt="" className="w-5 h-5" />
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
