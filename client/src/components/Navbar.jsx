import { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/api'
import { Bell, User, LogOut, ChevronRight, LayoutDashboard, Compass, Layers, ArrowRightLeft, Landmark, Wallet, LineChart, Activity } from 'lucide-react'

export default function Navbar() {
 const { user, logout } = useContext(AuthContext)
 const [unread, setUnread] = useState(0)
 const loc = useLocation()
 
 useEffect(() => {
 api.get('/notifications/unread-count')
   .then(r => { if (r.data.success) setUnread(r.data.count) })
   .catch(error => console.error('Failed to load unread alert count:', error))
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
   { name: 'My Items', path: '/my-items', icon: Layers },
   { name: 'Loans', path: '/money-loans', icon: Landmark },
   { name: 'Finances', path: '/fines', icon: Wallet },
 ]
 const mobileLinks = user?.role === 'admin'
  ? links.slice(0, 5)
  : [
    ...links.slice(0, 5),
    { name: 'Account', path: '/profile', icon: User },
   ]

 return (
 <>
 {/* ================= DESKTOP SIDEBAR ================= */}
 <aside className="site-sidebar hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#1b1c18]/95 backdrop-blur-xl border-r border-white/[0.06] z-50 p-5 overflow-y-auto custom-scrollbar">

 {/* Logo */}
 <Link to="/" className="relative z-10 flex items-center gap-3 mb-10 group shrink-0">
 <div className="brand-mark relative overflow-hidden flex items-center justify-center">
 <img src="/icons/borrowback-mark.svg" alt="" className="relative z-10 w-7 h-7" />
 </div>
 <span className="text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors">
 Borrow<span className="text-[#ff6258]">Back</span>
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
 className={`sidebar-link group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
 active 
 ? 'sidebar-link--active text-[#ff8a80] bg-[#ff493e]/[0.08] border border-[#ff6258]/20 shadow-sm'
 : 'text-zinc-400 hover:text-zinc-100 border border-transparent hover:bg-white/[0.04]'
 }`}
 >
 {/* Active background subtle glow */}
 {active && <div className="absolute inset-0 bg-gradient-to-r from-[#ff493e]/[0.05] to-transparent"></div>}
 {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#ff6258] rounded-r-md"></div>}
 
 <div className="flex items-center gap-3 relative z-10">
 <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'text-[#ff6258]' : 'text-zinc-500 group-hover:text-[#ff8a80] group-hover:bg-[#ff493e]/[0.06]'}`}>
 <l.icon strokeWidth={2} className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
 </div>
 <span className="tracking-wide">{l.name}</span>
 </div>
 
 {active && <ChevronRight className="w-4 h-4 text-[#ff8a80]/60 absolute right-3 transition-transform group-hover:translate-x-1" />}
 </Link>
 )
 })}
 </nav>

 {/* Bottom User Profile Card */}
 <div className="mt-auto shrink-0 space-y-3">
 <Link
 to="/notifications"
 className="relative flex min-h-12 items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-zinc-200 bg-white/[0.025] border border-white/[0.08] hover:border-white/15 hover:bg-white/[0.04] transition-colors group"
 aria-label={unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'}
 >
 <div className="flex items-center gap-3 relative z-10">
 <Bell className="w-5 h-5 text-[#ff6258] transition-colors" />
 Alerts
 </div>
 {unread > 0 ? (
 <span className="relative z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff493e] px-1 text-xs font-bold text-white">
 {unread > 9 ? '9+' : unread}
 </span>
 ) : null}
 </Link>

 <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
 <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0">
 <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-bold text-white shadow-inner">
 {user?.profilePhoto ? (
   <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
 ) : (user?.name?.[0]?.toUpperCase() || 'U')}
 <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 </div>
 <div className="flex min-w-0 flex-col">
 <span title={user?.name || 'My Account'} className="truncate text-sm font-semibold text-zinc-100">{user?.name || 'My Account'}</span>
 <span title={user?.email || ''} className="truncate text-[11px] font-medium text-zinc-400">{user?.email || 'Account details'}</span>
 </div>
 </Link>
 <button
 onClick={logout}
 className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
 title="Sign Out"
 aria-label="Sign out"
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>
 </aside>

 {/* ================= MOBILE TOP HEADER ================= */}
 <header className="site-mobile-nav md:hidden fixed top-0 inset-x-0 h-16 bg-[#1b1c18]/95 backdrop-blur-xl border-b border-white/[0.06] z-50 flex items-center justify-between px-4">
 <Link to="/" className="flex items-center gap-2 relative z-10">
 <div className="brand-mark brand-mark--small flex items-center justify-center">
 <img src="/icons/borrowback-mark.svg" alt="" className="w-5 h-5" />
 </div>
 <span className="text-lg font-bold tracking-tight text-white">
 Borrow<span className="text-[#ff6258]">Back</span>
 </span>
 </Link>
 <div className="flex items-center gap-3 relative z-10">
 <Link to="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} className="relative rounded-xl bg-white/5 p-2 text-zinc-300">
 <Bell className="w-5 h-5" />
 {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff493e] px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
 </Link>
 </div>
 </header>

 {/* ================= MOBILE BOTTOM NAV ================= */}
 <div className="site-mobile-nav site-mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#1b1c18]/95 backdrop-blur-xl border-t border-white/[0.06] z-50 flex items-center justify-around px-1 pb-safe">
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
 className={`mobile-nav-link flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${
 active ? 'mobile-nav-link--active' : ''
 } ${
 active ? 'text-[#ff8a80]' : 'text-zinc-500 hover:text-zinc-300'
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
