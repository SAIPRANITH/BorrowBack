import React, { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'

import api from '../api/api'

import PaymentModal from '../components/PaymentModal'

import {

 Banknote,

 Plus,

 Check,

 X,

 IndianRupee,

 Loader,

 Package,

 RotateCcw,

 Calendar,

 User,

 ArrowUpRight,

 ArrowDownLeft,

 Percent,

 AlertCircle,

 FileText,

 ShieldCheck,

 TrendingUp,

 Clock,

 CheckCircle2

} from 'lucide-react'



export default function MoneyLoans() {

 const [tab, setTab] = useState('mine')

 const [loans, setLoans] = useState([])

 const [requests, setRequests] = useState([])

 const [lending, setLending] = useState([])

 const [summary, setSummary] = useState(null)
 const [loading, setLoading] = useState(true)
 const [loadError, setLoadError] = useState('')
 const [acting, setActing] = useState('')

 const [paymentModal, setPaymentModal] = useState({ isOpen: false, id: null, action: null, amount: 0, title: '' })

 const isLoanOverdue = loan => loan.status === 'overdue'
  || (loan.status === 'active' && new Date(loan.dueDate) < new Date())



 const load = async () => {

 setLoadError('')

 try {

 const [mR, iR, lR, fR] = await Promise.all([

 api.get('/money-loans/mine'),

 api.get('/money-loans/incoming'),

 api.get('/money-loans/lending'),

 api.get('/money-loans/financial')

 ])

 if (![mR, iR, lR, fR].every(response => response.data.success)) {
 throw new Error('The server returned incomplete loan information.')
 }

 if (mR.data.success) setLoans(mR.data.loans || [])

 if (iR.data.success) setRequests(iR.data.requests || [])

 if (lR.data.success) setLending(lR.data.loans || [])

 if (fR.data.success) setSummary(fR.data.summary)

 } catch (error) {
 console.error('Error loading peer loans:', error)
 setLoadError(error.response?.data?.message || error.message || 'Could not load loan information. Please retry.')
 } finally {
 setLoading(false)
 }

 }



 useEffect(() => {

 load()

 }, [])



 const act = async (id, action) => {

 setActing(id + action)

 try {

 await api.put(`/money-loans/${id}/${action}`)

 await load()
 return true

 } catch (error) {
 window.alert(error.response?.data?.message || 'Could not update the loan. Please try again.')
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



 if (loading) {

 return (

 <div className="flex flex-col items-center justify-center py-28 animate-scale-in">

 <div className="loading-spinner mb-4"></div>

 <p className="text-zinc-500 text-sm">Loading loan records...</p>

 </div>

 )

 }



 const tabs = [

 { key: 'mine', label: 'My Loans', count: loans.length },

 { key: 'overdue', label: 'Overdue', count: loans.filter(isLoanOverdue).length + lending.filter(isLoanOverdue).length },

 { key: 'incoming', label: 'Incoming Requests', count: requests.length, alert: requests.length > 0 },

 { key: 'lending', label: 'Lending History', count: lending.length },

 { key: 'summary', label: 'Financial Summary' },

 ]

 const overdueLoans = [
 ...loans.filter(isLoanOverdue).map(loan => ({ loan, side: 'borrower' })),
 ...lending.filter(isLoanOverdue).map(loan => ({ loan, side: 'lender' }))
 ]



 const LoanCard = ({ loan, actions }) => {

 const formattedDueDate = new Date(loan.dueDate).toLocaleDateString('en-IN', {

 day: 'numeric',

 month: 'short',

 year: 'numeric'

 })

 const isOverdue = isLoanOverdue(loan)



 return (

 <div className="glass-card hover:animate-border-glow p-5 md:p-6 border border-zinc-800/80 transition-all duration-300">

 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

 {/* Main Info */}

 <div className="space-y-3 flex-1 min-w-0">

 {/* Top row: Amount + Status */}

 <div className="flex items-center gap-3 flex-wrap">

 <div className="flex items-center text-xl sm:text-2xl font-black text-zinc-100">

 <IndianRupee className="w-5 h-5 text-cyan-400" />

 <span>{loan.amount}</span>

 </div>

 <span className={`badge-${loan.status === 'repaid_pending' ? 'pending' : loan.status} capitalize tracking-wider`}>

 {loan.status === 'repaid_pending' ? 'Awaiting confirmation' : loan.status === 'repaid' ? 'Paid' : loan.status}

 </span>

 {isOverdue && (

 <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">

 <Clock className="w-3 h-3" /> Overdue

 </span>

 )}

 </div>

 {loan.status === 'repaid_pending' && (
 <p className="text-xs font-medium text-amber-300">
 {loan.borrower
  ? 'Borrower reported payment — confirm only after you receive it to complete this loan.'
  : 'Payment reported — waiting for your lender to confirm receipt.'}
 </p>
 )}



 {/* Purpose */}

 {loan.purpose && (

 <p className="text-zinc-300 text-sm font-medium flex items-center gap-2">

 <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Purpose:</span>

 <span>{loan.purpose}</span>

 </p>

 )}



 {/* Parties & Terms Grid */}

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs text-zinc-400">

 {loan.lender && (

 <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">

 <User className="w-3.5 h-3.5 text-cyan-400" />

 <span className="text-zinc-500">Lender:</span>

 <span className="text-zinc-200 font-medium truncate">{loan.lender.name}</span>

 </div>

 )}

 {loan.borrower && (

  <div className="flex flex-col gap-1 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">

  <span className="flex items-center gap-1.5">
  <User className="w-3.5 h-3.5 text-cyan-400" />

 <span className="text-zinc-500">Borrower:</span>

 <span className="text-zinc-200 font-medium truncate">{loan.borrower.name}</span>
  </span>
  {loan.borrower.phone && (
  <a href={`tel:${loan.borrower.phone}`} className="pl-5 text-cyan-300 hover:text-cyan-200">
  {loan.borrower.phone}
  </a>
  )}

 </div>

 )}

 <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">

 <Percent className="w-3.5 h-3.5 text-cyan-400" />

 <span className="text-zinc-500">Interest:</span>

 <span className="text-zinc-200 font-medium">{loan.interestRate}%</span>

 </div>

 <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">

 <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />

 <span className="text-zinc-500">Total Repayable:</span>

 <span className="text-emerald-400 font-bold">₹{loan.totalRepayable}</span>

 </div>

 <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">

 <Calendar className="w-3.5 h-3.5 text-cyan-400" />

 <span className="text-zinc-500">Due:</span>

 <span className="text-zinc-200 font-medium">{formattedDueDate}</span>

 </div>

 </div>



 {/* Note if available */}

 {loan.note && (

 <div className="flex items-start gap-1.5 text-xs text-zinc-400 italic bg-zinc-900/40 p-2 rounded border border-zinc-800/40">

 <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />

 <span>"{loan.note}"</span>

 </div>

 )}

 </div>



 {/* Action buttons */}

 {actions && (

 <div className="flex items-center gap-2.5 flex-wrap lg:justify-end border-t lg:border-t-0 border-zinc-800/80 pt-3 lg:pt-0">

 {actions}

 </div>

 )}

 </div>

 </div>

 )

 }



 // Calculate percentage helpers for summary

 const borrowerRepaidPct = summary?.borrower?.totalBorrowed > 0

 ? Math.round(((summary.borrower.totalRepaid || 0) / summary.borrower.totalBorrowed) * 100)

 : 0

 const lenderRecoveredPct = summary?.lender?.totalLent > 0

 ? Math.round(((summary.lender.totalRecovered || 0) / summary.lender.totalLent) * 100)

 : 0



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

 'url(https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&auto=format&fit=crop)'

 }}

 ></div>

 <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/40 to-transparent"></div>



 <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

 <div className="max-w-xl">

 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">

 <ShieldCheck className="w-3.5 h-3.5" /> Verified Campus Lending

 </div>

 <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">

 Peer Money <span className="text-gradient text-glow-cyan">Loans</span>

 </h1>

 <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed">

 Borrow and lend money securely within the verified campus community with transparent terms and automated tracking.

 </p>

 <div className="mt-5">

 <Link to="/money-loans/request" className="btn-primary hover:animate-border-glow inline-flex items-center gap-2 text-sm">

 <Plus className="w-4 h-4" /> Request Loan

 </Link>

 </div>

 </div>



 {/* Top Hero Stats */}

 <div className="grid grid-cols-3 gap-3 w-full md:w-auto">

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Borrowed</span>

 <span className="text-lg sm:text-2xl font-bold text-amber-400 flex items-center justify-center">

 <IndianRupee className="w-3.5 h-3.5" />{summary?.borrower?.totalBorrowed || 0}

 </span>

 </div>

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Lent</span>

 <span className="text-lg sm:text-2xl font-bold text-emerald-400 flex items-center justify-center">

 <IndianRupee className="w-3.5 h-3.5" />{summary?.lender?.totalLent || 0}

 </span>

 </div>

 <div className="glass-card hover:animate-border-glow px-4 py-3 text-center border border-white/5 bg-zinc-900/60">

 <span className="text-zinc-500 text-[11px] block uppercase font-medium">Requests</span>

 <span className={`text-lg sm:text-2xl font-bold ${requests.length > 0 ? 'text-cyan-400' : 'text-zinc-400'}`}>

 {requests.length}

 </span>

 </div>

 </div>

 </div>

 </div>



 {/* Tabs */}

 <div className="animate-card-enter stagger-1">

 <div className="flex items-center gap-2 p-1.5 bg-zinc-900/70 backdrop-blur-md rounded-xl border border-zinc-800/80 overflow-x-auto no-scrollbar">

 {tabs.map(t => {

 const isActive = tab === t.key

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

 {typeof t.count !== 'undefined' && (

 <span

 className={`text-xs px-2 py-0.5 rounded-full font-semibold ${

 isActive

 ? 'bg-white/20 text-white'

 : t.alert

 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'

 : t.count > 0

 ? 'bg-zinc-800 text-zinc-300'

 : 'bg-zinc-800/40 text-zinc-500'

 }`}

 >

 {t.count}

 </span>

 )}

 </button>

 )

 })}

 </div>

 </div>



 {/* Tab: My Loans */}

 {tab === 'mine' && (

 loans.length === 0 ? (

 <div className="glass-card hover:animate-border-glow text-center py-20 px-4 animate-scale-in border border-zinc-800/60">

 <div className="w-16 h-16 rounded-2xl animate-bounce-soft bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">

 <Banknote className="w-8 h-8 text-zinc-500" />

 </div>

 <h3 className="text-zinc-200 font-semibold text-base mb-1">No loan requests yet</h3>

 <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">

 Need short-term funds for college supplies, books, or fees? Request a loan from peer lenders.

 </p>

 <Link to="/money-loans/request" className="btn-primary hover:animate-border-glow inline-flex items-center gap-2 text-sm">

 <Plus className="w-4 h-4" /> Request a Loan

 </Link>

 </div>

 ) : (

 <div className="space-y-4 animate-card-enter stagger-2">

 {loans.map(l => (

 <LoanCard

 key={l._id}

 loan={l}

 actions={

 ['active', 'overdue'].includes(l.status) ? (

 <button

 onClick={() => handlePayClick(l._id, 'repay', l.totalRepayable || l.amount, 'Repay Loan')}

 disabled={acting === l._id + 'repay'}

 className="btn-success text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === l._id + 'repay' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <IndianRupee className="w-3.5 h-3.5" /> Pay Now

 </>

 )}

 </button>

 ) : null

 }

 />

 ))}

 </div>

 )

 )}

 {/* Tab: Overdue Loans */}

 {tab === 'overdue' && (

 overdueLoans.length === 0 ? (

 <div className="glass-card text-center py-16 px-4 border border-zinc-800/60">

 <h3 className="text-zinc-200 font-semibold text-base mb-1">No overdue loans</h3>

 <p className="text-zinc-500 text-sm">Loans past their due date will appear here.</p>

 </div>

 ) : (

 <div className="space-y-4 animate-card-enter stagger-2">

 {overdueLoans.map(({ loan, side }) => (

 <LoanCard

 key={`${side}-${loan._id}`}

 loan={loan}

 actions={side === 'borrower' ? (

 <button

 onClick={() => handlePayClick(loan._id, 'repay', loan.totalRepayable || loan.amount, 'Repay Overdue Loan')}

 disabled={acting === loan._id + 'repay'}

 className="btn-success text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === loan._id + 'repay' ? <Loader className="w-3.5 h-3.5 animate-rotate-in" /> : <><IndianRupee className="w-3.5 h-3.5" /> Pay Now</>}

 </button>

 ) : <span className="text-xs text-amber-400">Awaiting borrower repayment</span>}

 />

 ))}

 </div>

 )

 )}



 {/* Tab: Incoming Requests */}

 {tab === 'incoming' && (

 requests.length === 0 ? (

 <div className="glass-card hover:animate-border-glow text-center py-20 px-4 animate-scale-in border border-zinc-800/60">

 <div className="w-16 h-16 rounded-2xl animate-bounce-soft bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">

 <Package className="w-8 h-8 text-zinc-500" />

 </div>

 <h3 className="text-zinc-200 font-semibold text-base mb-1">No incoming loan requests</h3>

 <p className="text-zinc-500 text-sm max-w-sm mx-auto">

 When peers request loans from you, they will appear here for your review and approval.

 </p>

 </div>

 ) : (

 <div className="space-y-4 animate-card-enter stagger-2">

 {requests.map(r => (

 <LoanCard

 key={r._id}

 loan={r}

 actions={

 <>

 <button

 onClick={() => act(r._id, 'accept')}

 disabled={acting === r._id + 'accept'}

 className="btn-success text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === r._id + 'accept' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <Check className="w-3.5 h-3.5" /> Accept

 </>

 )}

 </button>

 <button

 onClick={() => act(r._id, 'reject')}

 disabled={acting === r._id + 'reject'}

 className="btn-danger text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === r._id + 'reject' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <X className="w-3.5 h-3.5" /> Reject

 </>

 )}

 </button>

 </>

 }

 />

 ))}

 </div>

 )

 )}



 {/* Tab: Lending History */}

 {tab === 'lending' && (

 lending.length === 0 ? (

 <div className="glass-card hover:animate-border-glow text-center py-20 px-4 animate-scale-in border border-zinc-800/60">

 <div className="w-16 h-16 rounded-2xl animate-bounce-soft bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">

 <Clock className="w-8 h-8 text-zinc-500" />

 </div>

 <h3 className="text-zinc-200 font-semibold text-base mb-1">No lending history</h3>

 <p className="text-zinc-500 text-sm max-w-sm mx-auto">

 You haven't funded any loans yet. Peer loans you accept will be tracked here.

 </p>

 </div>

 ) : (

 <div className="space-y-4 animate-card-enter stagger-2">

 {lending.map(l => (

 <LoanCard

 key={l._id}

 loan={l}

 actions={

 l.status === 'repaid_pending' ? (

 <button

 onClick={() => act(l._id, 'confirm-repay')}

 disabled={acting === l._id + 'confirm-repay'}

 className="btn-primary hover:animate-border-glow text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"

 >

 {acting === l._id + 'confirm-repay' ? (

 <Loader className="w-3.5 h-3.5 animate-rotate-in" />

 ) : (

 <>

 <Check className="w-3.5 h-3.5" /> Confirm Repayment Received

 </>

 )}

 </button>

 ) : null

 }

 />

 ))}

 </div>

 )

 )}



 {/* Tab: Financial Summary */}

 {tab === 'summary' && summary && (

 <div className="grid md:grid-cols-2 gap-6 animate-card-enter stagger-2">

 {/* As Borrower Card */}

 <div className="glass-card hover:animate-border-glow p-6 border border-zinc-800/80">

 <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">

 <div className="flex items-center gap-3">

 <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">

 <ArrowDownLeft className="w-5 h-5 text-amber-400" />

 </div>

 <div>

 <h2 className="text-lg font-bold text-zinc-100">As Borrower</h2>

 <p className="text-zinc-500 text-xs">Total debt and repayment status</p>

 </div>

 </div>

 <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">

 {borrowerRepaidPct}% Repaid

 </span>

 </div>



 {/* Progress bar */}

 <div className="mb-6 space-y-1.5">

 <div className="flex justify-between text-xs text-zinc-400">

 <span>Repayment Progress</span>

 <span className="font-semibold text-zinc-200">{borrowerRepaidPct}%</span>

 </div>

 <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">

 <div

 className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700"

 style={{ width: `${Math.min(borrowerRepaidPct, 100)}%` }}

 ></div>

 </div>

 </div>



 <div className="space-y-3">

 {[

 {

 label: 'Total Borrowed',

 value: summary.borrower?.totalBorrowed,

 color: 'text-zinc-100',

 icon: Banknote,

 bg: 'bg-zinc-800/50'

 },

 {

 label: 'Total Repaid',

 value: summary.borrower?.totalRepaid,

 color: 'text-emerald-400',

 icon: CheckCircle2,

 bg: 'bg-emerald-500/10'

 },

 {

 label: 'Pending Repayment',

 value: summary.borrower?.totalPending,

 color: 'text-amber-400',

 icon: AlertCircle,

 bg: 'bg-amber-500/10'

 },

 {

 label: 'Awaiting Lender Confirmation',

 value: summary.borrower?.awaitingConfirmation,

 color: 'text-cyan-400',

 icon: Clock,

 bg: 'bg-cyan-500/10'

 }

 ].map(x => {

 const Icon = x.icon

 return (

 <div

 key={x.label}

 className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5"

 >

 <div className="flex items-center gap-2.5">

 <div className={`w-8 h-8 rounded-lg ${x.bg} flex items-center justify-center`}>

 <Icon className={`w-4 h-4 ${x.color}`} />

 </div>

 <span className="text-zinc-400 text-sm font-medium">{x.label}</span>

 </div>

 <span className={`text-base font-bold ${x.color} flex items-center`}>

 <IndianRupee className="w-4 h-4" />{x.value || 0}

 </span>

 </div>

 )

 })}

 </div>

 </div>



 {/* As Lender Card */}

 <div className="glass-card hover:animate-border-glow p-6 border border-zinc-800/80">

 <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">

 <div className="flex items-center gap-3">

 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

 <ArrowUpRight className="w-5 h-5 text-emerald-400" />

 </div>

 <div>

 <h2 className="text-lg font-bold text-zinc-100">As Lender</h2>

 <p className="text-zinc-500 text-xs">Total investments and recovery status</p>

 </div>

 </div>

 <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">

 {lenderRecoveredPct}% Recovered

 </span>

 </div>



 {/* Progress bar */}

 <div className="mb-6 space-y-1.5">

 <div className="flex justify-between text-xs text-zinc-400">

 <span>Recovery Progress</span>

 <span className="font-semibold text-zinc-200">{lenderRecoveredPct}%</span>

 </div>

 <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">

 <div

 className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-700"

 style={{ width: `${Math.min(lenderRecoveredPct, 100)}%` }}

 ></div>

 </div>

 </div>



 <div className="space-y-3">

 {[

 {

 label: 'Total Lent',

 value: summary.lender?.totalLent,

 color: 'text-zinc-100',

 icon: Banknote,

 bg: 'bg-zinc-800/50'

 },

 {

 label: 'Recovered',

 value: summary.lender?.totalRecovered,

 color: 'text-emerald-400',

 icon: CheckCircle2,

 bg: 'bg-emerald-500/10'

 },

 {

 label: 'Outstanding Balance',

 value: summary.lender?.totalOutstanding,

 color: 'text-amber-400',

 icon: AlertCircle,

 bg: 'bg-amber-500/10'

 }

 ].map(x => {

 const Icon = x.icon

 return (

 <div

 key={x.label}

 className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5"

 >

 <div className="flex items-center gap-2.5">

 <div className={`w-8 h-8 rounded-lg ${x.bg} flex items-center justify-center`}>

 <Icon className={`w-4 h-4 ${x.color}`} />

 </div>

 <span className="text-zinc-400 text-sm font-medium">{x.label}</span>

 </div>

 <span className={`text-base font-bold ${x.color} flex items-center`}>

 <IndianRupee className="w-4 h-4" />{x.value || 0}

 </span>

 </div>

 )

 })}

 </div>

 </div>

 </div>

 )}



 <PaymentModal

 isOpen={paymentModal.isOpen}

 onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}

 amount={paymentModal.amount}

 title={paymentModal.title}

 invoiceId={`L${paymentModal.id?.substring(0, 7).toUpperCase()}`}

 onSuccess={handlePaymentSuccess}

 />

 </div>

 )

}
