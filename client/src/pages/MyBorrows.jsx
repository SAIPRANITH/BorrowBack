import React, { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'

import api from '../api/api'

import PaymentModal from '../components/PaymentModal'

import {

 Package,

 RotateCcw,

 IndianRupee,

 Loader,

 Calendar,

 User,

 Clock,

 CheckCircle2,

 AlertTriangle,

 ArrowUpRight,

 ShieldAlert,

 Layers,

 Sparkles

} from 'lucide-react'



export default function MyBorrows() {

 const [borrows, setBorrows] = useState([])
 const [loading, setLoading] = useState(true)
 const [loadError, setLoadError] = useState('')
 const [acting, setActing] = useState('')

 const [tab, setTab] = useState('all')



 const load = async () => {

 setLoadError('')

 try {

 const r = await api.get('/borrows/mine')

 if (!r.data.success) throw new Error('The server did not return your borrow records.')
 setBorrows(r.data.borrows || [])

 } catch (error) {
 console.error('Error loading your borrows:', error)
 setLoadError(error.response?.data?.message || error.message || 'Could not load your borrow records. Please retry.')
 } finally {
 setLoading(false)
 }

 }



 useEffect(() => {

 load()

 }, [])



 const [paymentModal, setPaymentModal] = useState({ isOpen: false, id: null, action: null, amount: 0, title: '' })



 const act = async (id, action, data) => {

 setActing(id + action)

 try {

 await api.put(`/borrows/${id}/${action}`, data)

 await load()
 return true
 } catch (error) {
 window.alert(error.response?.data?.message || 'Could not update the borrow record. Please try again.')
 return false
 } finally {
 setActing('')
 }

 }



 const handlePayClick = (id, action, amount, title) => {

 setPaymentModal({ isOpen: true, id, action, amount, title })

 }



 const handlePaymentSuccess = () => {

 if (paymentModal.id && paymentModal.action) {

 return act(paymentModal.id, paymentModal.action)

 }

 return false

 }



 const filtered = tab === 'all' ? borrows : borrows.filter(b => b.status === tab)



 // Counts for tab badges

 const counts = {

 all: borrows.length,

 pending: borrows.filter(b => b.status === 'pending').length,

 active: borrows.filter(b => b.status === 'active').length,

 returned: borrows.filter(b => b.status === 'returned').length,

 overdue: borrows.filter(b => b.status === 'overdue').length,

 }



 // Calculate quick metrics for hero

 const activeCount = counts.active

 const overdueCount = counts.overdue

 const totalDepositCommitted = borrows

 .filter(b => b.status === 'active' || b.status === 'pending')

 .reduce((sum, b) => sum + (Number(b.depositAmount) || 0), 0)



 if (loading) {

 return (

 <div className="flex flex-col items-center justify-center py-28 animate-scale-in">

 <div className="loading-spinner mb-4"></div>

 <p className="text-zinc-500 text-sm">Loading your borrows...</p>

 </div>

 )

 }



 const tabs = [

 { key: 'all', label: 'All Borrows' },

 { key: 'pending', label: 'Pending' },

 { key: 'active', label: 'Active' },

 { key: 'returned', label: 'Returned' },

 { key: 'overdue', label: 'Overdue' },

 ]



 return (

 <div className="space-y-6">
 {loadError ? (
 <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 <span>{loadError}</span>
 <button type="button" onClick={() => { setLoading(true); load() }} className="font-semibold text-red-100 underline underline-offset-2">
 Retry
 </button>
 </div>
 ) : null}

 {/* Hero Section */}

 <div className="relative rounded-2xl overflow-hidden animate-card-enter border border-zinc-800/80 shadow-2xl">

 <div

 className="absolute inset-0 bg-cover bg-center"

 style={{

 backgroundImage:

 'url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&auto=format&fit=crop)'

 }}

 ></div>

 <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/40 to-transparent"></div>



 <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

 <div className="max-w-xl">

 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">

 <Layers className="w-3.5 h-3.5" /> Community Borrowing

 </div>

 <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">

 My <span className="text-gradient text-glow-cyan">Borrows</span>

 </h1>

 <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed">

 Keep track of your borrowed items, due dates, security deposits, and return schedules in one place.

 </p>

 </div>



 {/* Quick Metrics */}

 <div className="grid grid-cols-3 gap-3 w-full md:w-auto">

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Active</span>

 <span className="text-xl sm:text-2xl font-bold text-cyan-400">{activeCount}</span>

 </div>

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Overdue</span>

 <span className={`text-xl sm:text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-zinc-300'}`}>

 {overdueCount}

 </span>

 </div>

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Deposits</span>

 <span className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center justify-center">

 <IndianRupee className="w-4 h-4" />{totalDepositCommitted}

 </span>

 </div>

 </div>

 </div>

 </div>



 {/* Tab Navigation */}

 <div className="animate-card-enter stagger-1">

 <div className="flex items-center gap-2 p-1.5 bg-zinc-900/70 backdrop-blur-md rounded-xl border border-zinc-800/80 overflow-x-auto no-scrollbar">

 {tabs.map(t => {

 const isActive = tab === t.key

 const count = counts[t.key]

 return (

 <button

 key={t.key}

 onClick={() => setTab(t.key)}

 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${

 isActive

 ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'

 : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'

 }`}

 >

 <span>{t.label}</span>

 <span

 className={`text-xs px-2 py-0.5 rounded-full font-semibold ${

 isActive

 ? 'bg-white/20 text-white'

 : count > 0

 ? 'bg-zinc-800 text-zinc-300'

 : 'bg-zinc-800/40 text-zinc-500'

 }`}

 >

 {count}

 </span>

 </button>

 )

 })}

 </div>

 </div>



 {/* Borrow Cards List */}

 {filtered.length === 0 ? (

 <div className="glass-card hover:animate-border-glow text-center py-20 px-4 animate-scale-in border border-zinc-800/60">

 <div className="w-16 h-16 rounded-2xl animate-bounce-soft bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">

 <Package className="w-8 h-8 text-zinc-500" />

 </div>

 <h3 className="text-zinc-200 font-semibold text-base mb-1">No borrows in this tab</h3>

 <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">

 {tab === 'all'

 ? "You haven't borrowed any items yet. Explore items available in your campus community!"

 : `You do not have any borrows with status "${tab}".`}

 </p>

 <Link to="/browse" className="btn-primary hover:animate-border-glow inline-flex items-center gap-2 text-sm">

 <Sparkles className="w-4 h-4" /> Browse Items

 </Link>

 </div>

 ) : (

 <div className="space-y-4 animate-card-enter stagger-2">

 {filtered.map(b => {

 const isOverdue = b.status === 'overdue' || (b.status === 'active' && new Date(b.dueDate) < new Date())

 const formattedDueDate = new Date(b.dueDate).toLocaleDateString('en-IN', {

 day: 'numeric',

 month: 'short',

 year: 'numeric'

 })



 return (

 <div

 key={b._id}

 className="glass-card hover:animate-border-glow p-5 md:p-6 border border-zinc-800/80 transition-all duration-300"

 >

 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

 {/* Left info */}

 <div className="flex items-start gap-4">

 <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">

 <Package className="w-6 h-6 text-cyan-400" />

 </div>



 <div className="space-y-1.5 flex-1 min-w-0">

 <div className="flex items-center gap-2.5 flex-wrap">

 <h2 className="text-zinc-100 font-bold text-base md:text-lg truncate">

 {b.item?.name || 'Item'}

 </h2>

 <span className={`badge-${b.status} capitalize tracking-wide`}>

 {b.status}

 </span>

 {isOverdue && b.status !== 'returned' && (

 <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">

 <AlertTriangle className="w-3 h-3" /> Overdue

 </span>

 )}

 </div>



 <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">

 <span className="flex items-center gap-1">

 <User className="w-3.5 h-3.5 text-zinc-500" />

 Owner: <span className="text-zinc-200 font-medium">{b.owner?.name || 'Unknown'}</span>

 </span>

 <span className="text-zinc-600">&bull;</span>

 <span className="flex items-center gap-1">

 <Calendar className="w-3.5 h-3.5 text-zinc-500" />

 Due: <span className="text-zinc-200 font-medium">{formattedDueDate}</span>

 </span>

 </div>



 {/* Deposit & Fine Stats */}

 <div className="flex items-center gap-2 pt-2 flex-wrap text-xs">

 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800">

 <span className="text-zinc-500">Deposit:</span>

 <span className="text-zinc-200 font-semibold flex items-center">

 <IndianRupee className="w-3 h-3" />{b.depositAmount}

 </span>

 {b.depositPaid ? (

 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">

 <CheckCircle2 className="w-2.5 h-2.5" /> Paid

 </span>

 ) : (

 <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">

 Unpaid

 </span>

 )}

 </div>



 {b.fineAmount > 0 && (

 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800">

 <span className="text-zinc-500">Fine:</span>

 <span className="text-red-400 font-semibold flex items-center">

 <IndianRupee className="w-3 h-3" />{b.fineAmount}

 </span>

 {b.finePaid ? (

 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">

 <CheckCircle2 className="w-2.5 h-2.5" /> Paid

 </span>

 ) : (

 <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">

 <ShieldAlert className="w-2.5 h-2.5" /> Pending

 </span>

 )}

 </div>

 )}

 </div>

 </div>

 </div>



 {/* Actions */}

 <div className="flex items-center gap-2.5 flex-wrap lg:justify-end border-t lg:border-t-0 border-zinc-800/80 pt-3 lg:pt-0">

 {b.status === 'active' && (

 <button

 onClick={() => act(b._id, 'signal-return')}

 disabled={acting === b._id + 'signal-return'}

 className="btn-primary hover:animate-border-glow text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === b._id + 'signal-return' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <RotateCcw className="w-3.5 h-3.5" />

 Signal Return

 </>

 )}

 </button>

 )}



 {b.status === 'active' && !b.depositPaid && (

 <button

 onClick={() => handlePayClick(b._id, 'pay-deposit', b.depositAmount, 'Pay Security Deposit')}

 disabled={acting === b._id + 'pay-deposit'}

 className="btn-success text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === b._id + 'pay-deposit' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <IndianRupee className="w-3.5 h-3.5" />

 Pay Deposit

 </>

 )}

 </button>

 )}



 {b.fineAmount > 0 && !b.finePaid && (

 <button

 onClick={() => handlePayClick(b._id, 'pay-fine', b.fineAmount, 'Pay Late Fine')}

 disabled={acting === b._id + 'pay-fine'}

 className="btn-danger text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === b._id + 'pay-fine' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <IndianRupee className="w-3.5 h-3.5" />

 Pay Fine

 </>

 )}

 </button>

 )}

 </div>

 </div>

 </div>

 )

 })}

 </div>

 )}



 <PaymentModal

 isOpen={paymentModal.isOpen}

 onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}

 amount={paymentModal.amount}

 title={paymentModal.title}

 invoiceId={`B${paymentModal.id?.substring(0, 7).toUpperCase()}`}

 onSuccess={handlePaymentSuccess}

 />

 </div>

 )

}
