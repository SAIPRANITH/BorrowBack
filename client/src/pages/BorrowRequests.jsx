import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { 
 Check, 
 X, 
 RotateCcw, 
 Package, 
 Loader, 
 Clock, 
 Calendar, 
 IndianRupee, 
 Sparkles, 
 CheckCircle2, 
 AlertCircle, 
 ArrowRight, 
 User,
 ShieldCheck,
 Inbox,
 Send
} from 'lucide-react'

const getDepositStatus = (borrow) => borrow.depositStatus
 || (Number(borrow.depositAmount ?? borrow.item?.depositAmount) > 0
  ? (borrow.depositPaid ? (borrow.status === 'returned' ? 'return_pending' : 'held') : 'pending')
  : 'not_required')

export default function BorrowRequests() {
 const [requests, setRequests] = useState([])
 const [active, setActive] = useState([])
 const [loading, setLoading] = useState(true)
 const [acting, setActing] = useState('')
 const [loadError, setLoadError] = useState('')

 const load = async () => {
 setLoadError('')
 try {
 const [reqR, lendR] = await Promise.all([
 api.get('/borrows/incoming'), 
 api.get('/borrows/lending')
 ])
 if (reqR.data.success) setRequests(reqR.data.requests.filter(r => r.status === 'pending'))
 if (lendR.data.success) setActive(lendR.data.history.filter(b =>
  ['active', 'overdue'].includes(b.status)
  || (b.status === 'returned' && ['return_pending', 'return_sent'].includes(getDepositStatus(b)))
 ))
 } catch (err) {
 console.error('Failed to load borrow requests:', err)
 setLoadError(err.response?.data?.message || 'Could not load borrow requests. Please retry.')
 }
 setLoading(false)
 }

 useEffect(() => { 
 load() 
 }, [])

 const act = async (id, action) => {
 setActing(id + action)
 try { 
 await api.put(`/borrows/${id}/${action}`)
 await load()
 } catch (err) {
 console.error(`Failed to perform ${action}:`, err)
 window.alert(err.response?.data?.message || 'Could not update this borrow. Please try again.')
 }
 setActing('')
 }

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-28 animate-scale-in">
 <div className="loading-spinner mb-4"></div>
 <p className="text-zinc-400 text-sm font-medium">Checking borrow requests...</p>
 </div>
 )
 }

 // Helper function for user initials avatar
 const getInitials = (name) => {
 if (!name) return 'U'
 const parts = name.trim().split(' ')
 if (parts.length >= 2) {
 return (parts[0][0] + parts[1][0]).toUpperCase()
 }
 return name.slice(0, 2).toUpperCase()
 }

 return (
 <div className="space-y-8 animate-scale-in">
 {loadError && (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
   <span>{loadError}</span>
   <button type="button" onClick={() => { setLoading(true); load() }} className="font-semibold text-red-100 underline underline-offset-2">Retry</button>
  </div>
 )}
 {/* Hero Section */}
 <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-card-enter">
 {/* Background image with overlays */}
 <div 
 className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 "
 style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1400&auto=format&fit=crop")' }}
 />
 <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/40 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

 {/* Hero Content */}
 <div className="relative z-10 p-8 md:p-12 lg:p-14">
 <div className="max-w-2xl">
 <div className="flex items-center gap-2 mb-3">
 <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
 <Inbox className="w-3.5 h-3.5" /> Request Manager
 </span>
 </div>
 
 <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight mb-3">
 Borrow <span className="text-amber-400">Requests</span>
 </h1>
 
 <p className="text-zinc-300 text-sm sm:text-base opacity-90 leading-relaxed mb-6">
 Review incoming borrow requests from peers across campus, accept or decline proposals, and confirm returned items safely.
 </p>
 </div>

 {/* Status Metrics */}
 <div className="flex flex-wrap items-center gap-3 text-xs">
 <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300">
 <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
 <span>Pending Requests: <strong className="text-amber-400 font-semibold">{requests.length}</strong></span>
 </div>
 <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300">
 <span className="w-2 h-2 rounded-full bg-blue-400"></span>
 <span>Borrow & Deposit Follow-ups: <strong className="text-blue-400 font-semibold">{active.length}</strong></span>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 {requests.length === 0 && active.length === 0 ? (
 <div className="glass-card hover:animate-border-glow text-center py-20 px-6 animate-scale-in border border-white/5 rounded-2xl">
 <div className="w-16 h-16 rounded-2xl animate-bounce-soft bg-zinc-800/80 flex items-center justify-center mx-auto mb-4 border border-white/5">
 <Inbox className="w-8 h-8 text-zinc-600" />
 </div>
 <p className="text-zinc-200 text-lg font-bold">No pending requests or active borrows</p>
 <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
 When campus peers request to borrow your listed items, they will show up here for your approval.
 </p>
 <Link 
 to="/my-items"
 className="mt-6 btn-primary hover:animate-border-glow inline-flex items-center gap-2 text-sm py-2.5 px-5"
 >
 <span>View My Listed Items</span>
 <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 ) : (
 <div className="space-y-10">
 {/* Section 1: Pending Requests */}
 {requests.length > 0 && (
 <div className="space-y-4 animate-card-enter stagger-1">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
 <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
 Pending Requests ({requests.length})
 </h2>
 </div>
 <span className="text-xs text-zinc-500 font-medium">Awaiting your response</span>
 </div>

 <div className="space-y-4">
 {requests.map(r => {
 const initials = getInitials(r.borrower?.name)
 const isActingAccept = acting === r._id + 'accept'
 const isActingReject = acting === r._id + 'reject'
 const isActing = isActingAccept || isActingReject

 return (
 <div 
 key={r._id} 
 className="glass-card hover:animate-border-glow p-5 md:p-6 rounded-2xl border border-white/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
 >
 {/* Left Side: Avatar & Information */}
 <div className="flex items-start gap-4 sm:gap-5">
 {/* User Avatar Circle */}
 <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-cyan-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 ring-2 ring-white/10 transition-transform">
 {initials}
 </div>

 {/* Request Details */}
 <div className="space-y-1.5">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h3 className="text-zinc-100 font-bold text-base sm:text-lg">
 {r.item?.name || 'Item'}
 </h3>
 <span className="badge-pending animate-pulse-glow">Pending Approval</span>
 </div>

 <p className="text-zinc-400 text-sm">
 Requested by <span className="text-zinc-200 font-semibold">{r.borrower?.name || 'Student'}</span>
 {r.borrower?.email && (
 <span className="text-zinc-500 text-xs ml-1.5 font-normal">
 ({r.borrower.email})
 </span>
 )}
 </p>

 {/* Info Pills */}
 <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
 <span className="inline-flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-white/5 text-zinc-300">
 <Calendar className="w-3.5 h-3.5 text-cyan-400" />
 Due: <strong className="text-zinc-200">{new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
 </span>

 {r.item?.depositAmount !== undefined && (
 <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
 <IndianRupee className="w-3.5 h-3.5" />
 {r.item.depositAmount} Deposit
 </span>
 )}

 {r.item?.finePerDay !== undefined && (
 <span className="text-zinc-500">
 ₹{r.item.finePerDay}/day fine
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Right Side: Action Buttons */}
 <div className="flex items-center gap-3 self-end md:self-center shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
 <button 
 onClick={() => act(r._id, 'accept')} 
 disabled={isActing} 
 className="btn-success flex-1 md:flex-initial text-xs py-2.5 px-5 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
 title="Accept this request"
 >
 {isActingAccept ? (
 <Loader className="w-4 h-4 animate-rotate-in" />
 ) : (
 <>
 <Check className="w-4 h-4" />
 <span>Accept Request</span>
 </>
 )}
 </button>

 <button 
 onClick={() => act(r._id, 'reject')} 
 disabled={isActing} 
 className="btn-danger flex-1 md:flex-initial text-xs py-2.5 px-5 flex items-center justify-center gap-2 shadow-md shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
 title="Decline this request"
 >
 {isActingReject ? (
 <Loader className="w-4 h-4 animate-rotate-in" />
 ) : (
 <>
 <X className="w-4 h-4" />
 <span>Decline</span>
 </>
 )}
 </button>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* Section 2: Active Borrows (Confirm Return) */}
 {active.length > 0 && (
 <div className="space-y-4 animate-card-enter stagger-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
 <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
 Borrow & Deposit Follow-ups ({active.length})
 </h2>
 </div>
 <span className="text-xs text-zinc-500 font-medium">Confirm returns and settle deposits</span>
 </div>

 <div className="space-y-4">
 {active.map(b => {
 const initials = getInitials(b.borrower?.name)
 const isActingReturn = acting === b._id + 'confirm-return'
 const depositStatus = getDepositStatus(b)
 const depositAmount = Number(b.depositAmount ?? b.item?.depositAmount ?? 0)
 const isOverdue = new Date(b.dueDate) < new Date()

 return (
 <div 
 key={b._id} 
 className="glass-card hover:animate-border-glow p-5 md:p-6 rounded-2xl border border-white/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
 >
 {/* Left Side: Avatar & Information */}
 <div className="flex items-start gap-4 sm:gap-5">
 {/* User Avatar Circle */}
 <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-cyan-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10 ring-2 ring-white/10 transition-transform">
 {initials}
 </div>

 {/* Details */}
 <div className="space-y-1.5">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h3 className="text-zinc-100 font-bold text-base sm:text-lg">
 {b.item?.name || 'Item'}
 </h3>
 <span className={b.status === 'returned' ? 'badge-returned' : isOverdue ? 'badge-overdue animate-pulse-glow' : 'badge-active animate-pulse-glow'}>
 {b.status === 'returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Active Borrow'}
 </span>
 </div>

 <p className="text-zinc-400 text-sm">
 Currently with <span className="text-zinc-200 font-semibold">{b.borrower?.name || 'Student'}</span>
 {b.borrower?.email && (
 <span className="text-zinc-500 text-xs ml-1.5 font-normal">
 ({b.borrower.email})
 </span>
 )}
 </p>

 {/* Info Pills */}
 <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
 isOverdue 
 ? 'bg-red-500/10 border-red-500/20 text-red-400 font-medium' 
 : 'bg-zinc-900/80 border-white/5 text-zinc-300'
 }`}>
 <Calendar className="w-3.5 h-3.5 text-cyan-400" />
 Return Due: <strong className={isOverdue ? 'text-red-400' : 'text-zinc-200'}>
 {new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
 </strong>
 </span>

 {depositAmount > 0 && (
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium ${
  ['held', 'return_pending', 'return_sent', 'returned'].includes(depositStatus)
   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
   : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
 }`}>
 <IndianRupee className="w-3.5 h-3.5" />
 ₹{depositAmount} Deposit · {depositStatus.replace(/_/g, ' ')}
 </span>
 )}

 {b.borrowDate && (
 <span className="text-zinc-500">
 Lent on: {new Date(b.borrowDate).toLocaleDateString('en-IN')}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Right Side: Action Button */}
 <div className="self-end md:self-center shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
 {b.status === 'returned' && depositStatus === 'return_pending' ? (
 <button
  onClick={() => act(b._id, 'return-deposit')}
  disabled={acting === b._id + 'return-deposit'}
  className="btn-primary w-full md:w-auto text-xs py-2.5 px-6 flex items-center justify-center gap-2"
  title="Confirm you returned the deposit to the borrower"
 >
  {acting === b._id + 'return-deposit' ? <Loader className="w-4 h-4 animate-rotate-in" /> : <IndianRupee className="w-4 h-4" />}
  Mark Deposit Returned
 </button>
 ) : b.status === 'returned' && depositStatus === 'return_sent' ? (
 <span className="text-xs text-cyan-300">Deposit marked returned — waiting for borrower acknowledgement</span>
 ) : b.status === 'returned' ? (
 <span className="text-xs text-zinc-400">Return complete</span>
 ) : depositStatus === 'payment_pending' ? (
 <div className="flex flex-wrap gap-2">
  <button
   onClick={() => act(b._id, 'confirm-deposit')}
   disabled={acting === b._id + 'confirm-deposit' || acting === b._id + 'reject-deposit'}
   className="btn-success text-xs py-2.5 px-4"
  >
   Confirm Deposit Received
  </button>
  <button
   onClick={() => act(b._id, 'reject-deposit')}
   disabled={acting === b._id + 'confirm-deposit' || acting === b._id + 'reject-deposit'}
   className="btn-danger text-xs py-2.5 px-4"
  >
   Not Received
  </button>
 </div>
 ) : b.returnSignaledAt ? (
 <button 
 onClick={() => act(b._id, 'confirm-return')} 
 disabled={isActingReturn} 
 className="btn-primary hover:animate-border-glow w-full md:w-auto text-xs py-2.5 px-6 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
 title="Confirm that the borrower has returned this item"
 >
 {isActingReturn ? (
 <Loader className="w-4 h-4 animate-rotate-in" />
 ) : (
 <>
 <RotateCcw className="w-4 h-4" />
 <span>Confirm Return & Release</span>
 </>
 )}
 </button>
 ) : (
 <span className="text-xs text-zinc-400">Waiting for borrower to signal return</span>
 )}
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )
}
