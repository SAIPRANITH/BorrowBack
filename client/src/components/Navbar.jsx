import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/api'
import { Bell, User, LogOut, ChevronRight, LayoutDashboard, Compass, Layers, ArrowRightLeft, Landmark, Wallet, LineChart, Activity } from 'lucide-react'

export default function Navbar() {
 const { user, logout } = useContext(AuthContext)
 const [unread, setUnread] = useState(0)
 const loc = useLocation()
 
 useEffect(() => {
 api.get('/notifications/unread-count').then(r => { if (r.data.success) setUnread(r.data.count) }).catch(() => {})
 }, [loc])

 const links = user?.role === 'admin' ? [
   { name: 'Overview', path: '/admin', icon: LayoutDashboard },
   { name: 'Accounts & History', path: '/admin/accounts', icon: User },
   { name: 'Analytics', path: '/admin/analytics', icon: LineChart },
   { name: 'Alerts', path: '/admin/alerts', icon: Bell },
   { name: 'System Health', path: '/admin/system', icon: Activity },
 ] : [
   { name: 'Home', path: '/', icon: LayoutDashboard },
   { name: 'Browse', path: '/browse', icon: Compass },
   { name: 'Borrows', path: '/my-borrows', icon: ArrowRightLeft },
   { name: 'Loans', path: '/money-loans', icon: Landmark },
   { name: 'My Items', path: '/my-items', icon: Layers },
   { name: 'Finances', path: '/fines', icon: Wallet },
 ]
 const mobileLinks = user?.role === 'admin'
  ? links.slice(0, 5)
  : [
    ...links.slice(0, 4),
    { name: 'Account', path: '/profile', icon: User },
   ]

 return (
 <>
 {/* ================= DESKTOP SIDEBAR ================= */}
 <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#1b1c18]/95 backdrop-blur-xl border-r border-white/[0.06] z-50 p-5 overflow-y-auto custom-scrollbar">

 {/* Logo */}
 <Link to="/" className="relative z-10 flex items-center gap-3 mb-10 group shrink-0">
 <div className="brand-mark relative overflow-hidden flex items-center justify-center">
 <img src="/icons/borrowback-mark.svg" alt="" className="relative z-10 w-7 h-7" />
 </div>
 <span className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-50 transition-colors">
 Borrow<span className="text-cyan-300">Back</span>
 </span>
 </Link>

 {/* Navigation Links */}
 <nav className="relative z-10 flex-1 space-y-2 mb-8 shrink-0">
 <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-1 drop-shadow-md">Navigation</div>
 {links.map(l => {
 const active = l.path === '/'
  ? loc.pathname === '/'
  : l.path === '/admin'
   ? loc.pathname === l.path
   : loc.pathname === l.path || loc.pathname.startsWith(`${l.path}/`)
 return (
 <Link
 key={l.path}
 to={l.path}
 className={`group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
 active 
 ? 'text-cyan-200 bg-cyan-500/[0.08] border border-cyan-400/15 shadow-sm'
 : 'text-zinc-400 hover:text-zinc-100 border border-transparent hover:bg-white/[0.04]'
 }`}
 >
 {/* Active background subtle glow */}
 {active && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.04] to-transparent"></div>}
 {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-cyan-500/70 rounded-r-md"></div>}
 
 <div className="flex items-center gap-3 relative z-10">
 <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-cyan-300 group-hover:bg-cyan-500/[0.06]'}`}>
 <l.icon strokeWidth={2} className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
 </div>
 <span className="tracking-wide">{l.name}</span>
 </div>
 
 {active && <ChevronRight className="w-4 h-4 text-cyan-300/50 absolute right-3 transition-transform group-hover:translate-x-1" />}
 </Link>
 )
 })}
 </nav>

 {/* Bottom User Profile Card */}
 <div className="mt-auto shrink-0 space-y-3">
 <Link
 to="/notifications"
 className="relative flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold text-zinc-300 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group overflow-hidden"
 >
 <div className="flex items-center gap-3 relative z-10">
 <Bell className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors group-hover:animate-swing" />
 Alerts
 </div>
 {unread > 0 ? (
 <span className="relative z-10 w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500 text-xs font-black text-[#0a0a0e] shadow-[0_0_12px_rgba(34,211,238,0.5)]">
 {unread > 9 ? '9+' : unread}
 </span>
 ) : null}
 </Link>

 <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors shadow-lg shadow-black/20">
 <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0">
 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0 relative">
 {user?.name?.[0]?.toUpperCase() || 'U'}
 <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 </div>
 <div className="flex flex-col min-w-0 pr-2">
 <span className="text-[15px] font-bold text-zinc-100 truncate group-hover:text-cyan-400 transition-colors">{user?.name || 'My Account'}</span>
 <span className="text-xs font-medium text-zinc-500 truncate">{user?.email || 'user@example.com'}</span>
 </div>
 </Link>
 <button
 onClick={logout}
 className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
 title="Sign Out"
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>
 </aside>

 {/* ================= MOBILE TOP HEADER ================= */}
 <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#1b1c18]/95 backdrop-blur-xl border-b border-white/[0.06] z-50 flex items-center justify-between px-4">
 <Link to="/" className="flex items-center gap-2 relative z-10">
 <div className="brand-mark brand-mark--small flex items-center justify-center">
 <img src="/icons/borrowback-mark.svg" alt="" className="w-5 h-5" />
 </div>
 <span className="text-lg font-bold tracking-tight text-white">
 Borrow<span className="text-cyan-300">Back</span>
 </span>
 </Link>
 <div className="flex items-center gap-3 relative z-10">
 <Link to="/notifications" className="relative p-2 rounded-xl bg-white/5 text-zinc-400">
 <Bell className="w-5 h-5" />
 {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">{unread}</span>}
 </Link>
 </div>
 </header>

 {/* ================= MOBILE BOTTOM NAV ================= */}
 <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#1b1c18]/95 backdrop-blur-xl border-t border-white/[0.06] z-50 flex items-center justify-around px-1 pb-safe">
 {mobileLinks.map(l => {
 const active = l.path === '/'
  ? loc.pathname === '/'
  : l.path === '/admin'
   ? loc.pathname === l.path
   : loc.pathname === l.path || loc.pathname.startsWith(`${l.path}/`)
 return (
 <Link
 key={l.path}
 to={l.path}
 className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${
 active ? 'text-cyan-200' : 'text-zinc-500 hover:text-zinc-300'
 }`}
 >
 <l.icon className="w-5 h-5" />
 <span className="text-[9px] font-bold tracking-tight text-center leading-none">
 {l.name}
 </span>
 </Link>
 )
 })}
 </div>
 </>
 )
}
