import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/api'
import { Package, Search, List, Handshake, ShoppingBag, Banknote, CreditCard, Bell, User, LogOut, ShieldCheck, ChevronRight, LayoutDashboard, Compass, Layers, Inbox, ArrowRightLeft, Landmark, Wallet, Shield, LineChart, Server, Activity } from 'lucide-react'

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
   { name: 'Dashboard', path: '/', icon: LayoutDashboard },
   { name: 'Browse Items', path: '/browse', icon: Compass },
   { name: 'My Inventory', path: '/my-items', icon: Layers },
   { name: 'Requests', path: '/requests', icon: Inbox },
   { name: 'My Borrows', path: '/my-borrows', icon: ArrowRightLeft },
   { name: 'Money Loans', path: '/money-loans', icon: Landmark },
   { name: 'Finances', path: '/fines', icon: Wallet },
 ]

 return (
 <>
 {/* ================= DESKTOP SIDEBAR ================= */}
 <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-72 bg-[#09090b]/80 backdrop-blur-3xl border-r border-white/5 z-50 p-6 overflow-y-auto custom-scrollbar shadow-2xl">
 
 {/* Faint textured background and ambient glow matching website */}
 <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-screen opacity-10"></div>
 <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/20 via-indigo-900/5 to-transparent"></div>
 </div>

 {/* Logo */}
 <Link to="/" className="relative z-10 flex items-center gap-3 mb-10 group shrink-0">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all relative overflow-hidden">
 <Package className="w-5 h-5 text-white relative z-10" />
 </div>
 <span className="text-2xl font-black tracking-tight text-white group-hover:text-blue-50 transition-colors">
 Borrow<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Back</span>
 </span>
 </Link>

 {/* Navigation Links */}
 <nav className="relative z-10 flex-1 space-y-2 mb-8 shrink-0">
 <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-1 drop-shadow-md">Navigation</div>
 {links.map(l => {
 const active = loc.pathname === l.path
 return (
 <Link
 key={l.path}
 to={l.path}
 className={`group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
 active 
 ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-sm' 
 : 'text-zinc-400 hover:text-white border border-transparent hover:bg-white/5'
 }`}
 >
 {/* Active background subtle glow */}
 {active && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent"></div>}
 {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-blue-500 rounded-r-md"></div>}
 
 <div className="flex items-center gap-3 relative z-10">
 <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-500/10'}`}>
 <l.icon strokeWidth={2} className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
 </div>
 <span className="tracking-wide">{l.name}</span>
 </div>
 
 {active && <ChevronRight className="w-4 h-4 text-blue-500/50 absolute right-3 transition-transform group-hover:translate-x-1" />}
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
 <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#09090b]/80 backdrop-blur-3xl border-b border-white/5 z-50 flex items-center justify-between px-4 overflow-hidden">
 {/* Faint textured background */}
 <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-screen opacity-10"></div>
 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-transparent"></div>
 </div>
 <Link to="/" className="flex items-center gap-2 relative z-10">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
 <Package className="w-4 h-4 text-white" />
 </div>
 <span className="text-lg font-black tracking-tight text-white">
 Borrow<span className="text-blue-400">Back</span>
 </span>
 </Link>
 <div className="flex items-center gap-3 relative z-10">
 <Link to="/notifications" className="relative p-2 rounded-xl bg-white/5 text-zinc-400">
 <Bell className="w-5 h-5" />
 {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">{unread}</span>}
 </Link>
 <Link to="/profile" className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs border border-white/10">
 {user?.name?.[0]?.toUpperCase() || 'U'}
 </Link>
 </div>
 </header>

 {/* ================= MOBILE BOTTOM NAV ================= */}
 <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#09090b]/80 backdrop-blur-3xl border-t border-white/10 z-50 flex items-center justify-around px-1 pb-safe overflow-hidden">
 {/* Faint textured background */}
 <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-screen opacity-10"></div>
 </div>
 {links.slice(0, 5).map(l => {
 const active = loc.pathname === l.path
 return (
 <Link
 key={l.path}
 to={l.path}
 className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${
 active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
 }`}
 >
 <l.icon className={`w-5 h-5 ${active ? 'animate-bounce' : ''}`} />
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
