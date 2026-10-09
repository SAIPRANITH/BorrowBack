import React, { useState, useEffect } from 'react'

import api from '../api/api'

import {

 Bell,

 CheckCheck,

 Package,

 PackagePlus,

 CheckCircle2,

 XCircle,

 Clock,

 AlertTriangle,

 RotateCcw,

 Star,

 IndianRupee,

 Sparkles,

 Inbox

} from 'lucide-react'



export default function Notifications() {

 const [notifs, setNotifs] = useState([])

 const [loading, setLoading] = useState(true)

 const [filter, setFilter] = useState('all')



 const load = async () => {

 try {

 const r = await api.get('/notifications')

 if (r.data.success) setNotifs(r.data.notifications)

 } catch {}

 setLoading(false)

 }



 useEffect(() => {

 load()

 }, [])



 const markRead = async (id) => {

 try {

 await api.put(`/notifications/${id}/read`)

 load()

 } catch {}

 }



 const markAll = async () => {

 try {

 await api.put('/notifications/read-all')

 load()

 } catch {}

 }



 const unreadCount = notifs.filter((n) => n.status === 'unread').length

 const filteredNotifs =

 filter === 'unread' ? notifs.filter((n) => n.status === 'unread') : notifs



 // Helper to determine icon, colors and label by notification type

 const getTypeMeta = (type) => {

 switch (type) {

 case 'request':

 return {

 icon: PackagePlus,

 color: 'text-indigo-400',

 bg: 'bg-indigo-500/15 border-indigo-500/30',

 badge: 'Request',

 badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'

 }

 case 'approval':

 return {

 icon: CheckCircle2,

 color: 'text-emerald-400',

 bg: 'bg-emerald-500/15 border-emerald-500/30',

 badge: 'Approved',

 badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'

 }

 case 'rejection':

 return {

 icon: XCircle,

 color: 'text-rose-400',

 bg: 'bg-rose-500/15 border-rose-500/30',

 badge: 'Declined',

 badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20'

 }

 case 'reminder':

 return {

 icon: Clock,

 color: 'text-amber-400',

 bg: 'bg-amber-500/15 border-amber-500/30',

 badge: 'Reminder',

 badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20'

 }

 case 'overdue':

 return {

 icon: AlertTriangle,

 color: 'text-red-400',

 bg: 'bg-red-500/15 border-red-500/30',

 badge: 'Overdue',

 badgeClass: 'bg-red-500/10 text-red-300 border-red-500/20'

 }

 case 'fine':

 return {

 icon: IndianRupee,

 color: 'text-orange-400',

 bg: 'bg-orange-500/15 border-orange-500/30',

 badge: 'Fine',

 badgeClass: 'bg-orange-500/10 text-orange-300 border-orange-500/20'

 }

 case 'return':

 return {

 icon: RotateCcw,

 color: 'text-cyan-400',

 bg: 'bg-cyan-500/15 border-cyan-500/30',

 badge: 'Return',

 badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'

 }

 case 'rating':

 return {

 icon: Star,

 color: 'text-amber-400',

 bg: 'bg-amber-500/15 border-amber-500/30',

 badge: 'Review',

 badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20'

 }

 default:

 return {

 icon: Bell,

 color: 'text-indigo-400',

 bg: 'bg-indigo-500/15 border-indigo-500/30',

 badge: 'Notice',

 badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'

 }

 }

 }



 const formatTimestamp = (dateStr) => {

 try {

 const date = new Date(dateStr)

 const now = new Date()

 const diffMs = now - date

 const diffMins = Math.floor(diffMs / (1000 * 60))

 const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))



 if (diffMins < 1) return 'Just now'

 if (diffMins < 60) return `${diffMins}m ago`

 if (diffHours < 24) return `${diffHours}h ago`

 if (diffDays < 7) return `${diffDays}d ago`

 return date.toLocaleDateString('en-IN', {

 month: 'short',

 day: 'numeric',

 hour: '2-digit',

 minute: '2-digit'

 })

 } catch {

 return dateStr

 }

 }



 if (loading) {

 return (

 <div className="flex justify-center items-center py-32">

 <div className="loading-spinner" />

 </div>

 )

 }



 return (

 <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up pb-12">

 {/* Hero Section with Campus Background & Dark Overlay */}

 <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

 {/* Background photo */}

 <div

 className="absolute inset-0 bg-cover bg-center"

 style={{

 backgroundImage:

 "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop')"

 }}

 />



 {/* Dark overlays */}

 <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/80" />

 <div className="absolute inset-0 bg-indigo-950/30 backdrop-blur-sm" />



 {/* Hero Content */}

 <div className="relative z-10 p-6 sm:p-8">

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

 <div className="space-y-1.5">

 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">

 <Sparkles className="w-3.5 h-3.5" />

 <span>Activity Center</span>

 </div>

 <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">

 Notifications

 {unreadCount > 0 && (

 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">

 {unreadCount} new

 </span>

 )}

 </h1>

 <p className="text-zinc-400 text-xs sm:text-sm max-w-md">

 Stay updated on borrow requests, approvals, returns, deadlines, and peer reviews.

 </p>

 </div>



 {/* Actions */}

 {notifs.some((n) => n.status === 'unread') && (

 <button

 onClick={markAll}

 className="btn-outline text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border-zinc-700/80 transition-all shadow-md self-start sm:self-auto"

 >

 <CheckCheck className="w-4 h-4 text-indigo-400" />

 <span>Mark all as read</span>

 </button>

 )}

 </div>



 {/* Filter Tabs */}

 <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 text-xs">

 <button

 onClick={() => setFilter('all')}

 className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${

 filter === 'all'

 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'

 : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'

 }`}

 >

 All ({notifs.length})

 </button>

 <button

 onClick={() => setFilter('unread')}

 className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${

 filter === 'unread'

 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'

 : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'

 }`}

 >

 <span>Unread</span>

 {unreadCount > 0 && (

 <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />

 )}

 </button>

 </div>

 </div>

 </div>



 {/* Notifications List */}

 {filteredNotifs.length === 0 ? (

 <div className="glass-card p-12 text-center rounded-3xl border border-white/5 animate-fade-in">

 <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-white/5 flex items-center justify-center mx-auto mb-4 text-zinc-500">

 <Inbox className="w-8 h-8" />

 </div>

 <h3 className="text-base font-semibold text-zinc-200">

 {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}

 </h3>

 <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">

 {filter === 'unread'

 ? 'You have caught up with all your campus activities!'

 : 'When students request items, leave ratings, or make updates, they will appear here.'}

 </p>

 {filter === 'unread' && notifs.length > 0 && (

 <button

 onClick={() => setFilter('all')}

 className="btn-outline text-xs mt-4 py-2 px-4 rounded-xl"

 >

 View all notifications

 </button>

 )}

 </div>

 ) : (

 <div className="space-y-3">

 {filteredNotifs.map((n) => {

 const meta = getTypeMeta(n.type)

 const Icon = meta.icon

 const isUnread = n.status === 'unread'



 return (

 <div

 key={n._id}

 onClick={() => isUnread && markRead(n._id)}

 className={`group glass-card p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${

 isUnread

 ? 'bg-zinc-900/80 border-indigo-500/30 shadow-lg shadow-indigo-500/5 '

 : 'bg-zinc-900/40 border-white/5 opacity-75 hover:opacity-100 '

 }`}

 >

 <div className="flex items-start gap-4">

 {/* Type Icon Badge */}

 <div

 className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.color} transition-transform`}

 >

 <Icon className="w-5 h-5" />

 </div>



 {/* Body Content */}

 <div className="flex-1 min-w-0">

 <div className="flex items-center justify-between gap-2 mb-1">

 <div className="flex items-center gap-2">

 <span

 className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeClass}`}

 >

 {meta.badge}

 </span>

 {isUnread && (

 <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400">

 <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />

 New

 </span>

 )}

 </div>



 <span className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0">

 <Clock className="w-3 h-3" />

 {formatTimestamp(n.createdAt)}

 </span>

 </div>



 <p

 className={`text-sm leading-relaxed ${

 isUnread ? 'text-zinc-100 font-medium' : 'text-zinc-300'

 }`}

 >

 {n.message}

 </p>



 {isUnread && (

 <p className="text-[11px] text-indigo-400/80 font-medium mt-2 flex items-center gap-1">

 Click to mark as read

 </p>

 )}

 </div>

 </div>

 </div>

 )

 })}

 </div>

 )}

 </div>

 )

}

