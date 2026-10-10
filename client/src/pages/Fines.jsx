import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import api from '../api/api'


import {

 IndianRupee,

 TrendingUp,

 TrendingDown,

 PieChart,

 BarChart3,

 ShieldCheck,

 AlertCircle,

 CheckCircle2,


 ArrowDownLeft,

 ArrowUpRight,

 Receipt,

 Scale

} from 'lucide-react'



function DonutChart({ value1, value2, label1, label2, color1, color2 }) {

 const total = value1 + value2

 const pct1 = total > 0 ? (value1 / total) * 100 : 50

 return (

 <div className="flex items-center gap-5">

 <div className="relative w-24 h-24 flex-shrink-0">

 <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 36 36">

 <path

 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"

 fill="none"

 stroke={color2}

 strokeWidth="3.5"

 strokeDasharray="100, 100"

 opacity="0.25"

 />

 <path

 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"

 fill="none"

 stroke={color1}

 strokeWidth="3.5"

 strokeDasharray={`${pct1}, 100`}

 strokeLinecap="round"

 />

 </svg>

 <div className="absolute inset-0 flex flex-col items-center justify-center">

 <span className="text-zinc-500 text-[9px] uppercase font-semibold">Total</span>

 <span className="text-zinc-200 text-xs font-bold">₹{total}</span>

 </div>

 </div>

 <div className="space-y-2 flex-1 min-w-0">

 <div className="flex items-center justify-between text-xs">

 <div className="flex items-center gap-2">

 <div className="w-2.5 h-2.5 rounded-full" style={{ background: color1 }}></div>

 <span className="text-zinc-400">{label1}</span>

 </div>

 <span className="text-zinc-200 font-bold">₹{value1}</span>

 </div>

 <div className="flex items-center justify-between text-xs">

 <div className="flex items-center gap-2">

 <div className="w-2.5 h-2.5 rounded-full" style={{ background: color2 }}></div>

 <span className="text-zinc-400">{label2}</span>

 </div>

 <span className="text-zinc-200 font-bold">₹{value2}</span>

 </div>

 </div>

 </div>

 )

}



function HBar({ label, value, maxVal, color }) {

 const pct = maxVal > 0 ? Math.max((value / maxVal) * 100, 2) : 2

 return (

 <div className="space-y-1.5">

 <div className="flex justify-between text-xs">

 <span className="text-zinc-400 font-medium">{label}</span>

 <span className="text-zinc-200 font-bold">₹{value}</span>

 </div>

 <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">

 <div

 className="h-full rounded-full transition-all duration-700"

 style={{ width: `${pct}%`, background: color }}

 ></div>

 </div>

 </div>

 )

}



export default function Fines() {

 const [summary, setSummary] = useState(null)

 const [loanSummary, setLoanSummary] = useState(null)

 const [loading, setLoading] = useState(true)
 const [loadError, setLoadError] = useState('')

 const loadFinancialSummary = async () => {
 setLoading(true)
 setLoadError('')
 try {
 const [fR, mR] = await Promise.all([api.get('/borrows/financial'), api.get('/money-loans/financial')])
 if (!fR.data.success || !mR.data.success) {
  throw new Error('The server returned incomplete financial information.')
 }
 setSummary(fR.data.summary)
 setLoanSummary(mR.data.summary)
 } catch (error) {
 console.error('Failed to load financial summaries:', error)
 setLoadError(error.response?.data?.message || error.message || 'Could not load financial details. Please try again.')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 loadFinancialSummary()
 }, [])



 if (loading) {

 return (

 <div className="flex flex-col items-center justify-center py-32 animate-scale-in">

 <div className="loading-spinner mb-4"></div>

 <p className="text-zinc-500 text-sm">Loading financial data...</p>

 </div>

 )

 }

 if (loadError && !summary && !loanSummary) {
 return (
  <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center" role="alert">
   <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
   <p className="text-sm text-red-200">{loadError}</p>
   <button type="button" onClick={loadFinancialSummary} className="mt-4 rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/10">
    Retry
   </button>
  </div>
 )
 }



 const b = summary?.borrower || {}

 const o = summary?.owner || {}

 const lb = loanSummary?.borrower || {}

 const ll = loanSummary?.lender || {}
 const loanAwaitingConfirmation = (lb.awaitingConfirmation || 0) > 0
 const loanFullyRepaid = lb.totalPending === 0
  && !loanAwaitingConfirmation
  && lb.totalBorrowed > 0

 const allVals = [

 b.totalDepositsPaid || 0,

 b.totalDepositsPending || 0,
 b.totalDepositsAwaitingConfirmation || 0,
 b.totalFinesPaid || 0,
 b.totalFinesPending || 0,
 o.totalDepositsCollected || 0,
 o.totalDepositsHeld || 0,
 o.totalDepositsReturnPending || 0,
 o.totalDepositsReturned || 0,
 o.totalFinesCollected || 0

 ]

 const maxVal = Math.max(...allVals, 1)



 // Aggregate metrics for top summary cards

 const topStats = [

 {

 title: 'Deposits Paid',

 value: b.totalDepositsPaid || 0,

 sub: `Pending: ₹${b.totalDepositsPending || 0} · Verification: ₹${b.totalDepositsAwaitingConfirmation || 0}`,

 icon: ShieldCheck,

 color: 'text-cyan-400',

 border: 'border-cyan-500/20',

 bg: 'bg-cyan-500/10'

 },

 {

 title: 'Fines Incurred',

 value: (b.totalFinesPaid || 0) + (b.totalFinesPending || 0),

 sub: `Unpaid: ₹${b.totalFinesPending || 0}`,

 icon: AlertCircle,

 color: (b.totalFinesPending || 0) > 0 ? 'text-red-400' : 'text-zinc-300',

 border: 'border-red-500/20',

 bg: 'bg-red-500/10'

 },

 {

 title: 'Total Borrowed',

 value: lb.totalBorrowed || 0,

 sub: `Repaid: ₹${lb.totalRepaid || 0}`,

 icon: ArrowDownLeft,

 color: 'text-amber-400',

 border: 'border-amber-500/20',

 bg: 'bg-amber-500/10'

 },

 {

 title: 'Total Lent Out',

 value: ll.totalLent || 0,

 sub: `Recovered: ₹${ll.totalRecovered || 0}`,

 icon: ArrowUpRight,

 color: 'text-emerald-400',

 border: 'border-emerald-500/20',

 bg: 'bg-emerald-500/10'

 },

 ]



 // Structured breakdown entries for the financial transactions table

 const transactionEntries = [

 {

 id: 'tx-1',

 category: 'Item Security Deposit',

 role: 'Borrower',

 type: 'Paid',

 amount: b.totalDepositsPaid || 0,

 status: 'Paid',

 badgeClass: 'badge-returned',

 note: 'Returned by the owner after the item is safely returned'

 },

 {

 id: 'tx-2',

 category: 'Item Security Deposit',

 role: 'Borrower',

 type: 'Pending',

 amount: b.totalDepositsPending || 0,

 status: 'Pending',

 badgeClass: 'badge-pending animate-pulse-glow',

 note: 'Awaiting deposit payment'
 },
 {
 id: 'tx-2-confirmation',
 category: 'Security Deposit Verification',
 role: 'Borrower',
 type: 'Reported paid',
 amount: b.totalDepositsAwaitingConfirmation || 0,
 status: 'Awaiting owner confirmation',
 badgeClass: 'badge-pending animate-pulse-glow',
 note: 'The owner must confirm receipt before the deposit is treated as paid'
 },

 {

 id: 'tx-3',

 category: 'Overdue Borrow Fine',

 role: 'Borrower',

 type: 'Paid',

 amount: b.totalFinesPaid || 0,

 status: 'Settled',

 badgeClass: 'badge-repaid',

 note: 'Cleared overdue late charges'

 },

 {

 id: 'tx-4',

 category: 'Overdue Borrow Fine',

 role: 'Borrower',

 type: 'Pending',

 amount: b.totalFinesPending || 0,

 status: 'Overdue',

 badgeClass: 'badge-overdue animate-pulse-glow',

 note: 'Active fine pending payment'

 },

 {

 id: 'tx-5',

 category: 'Deposits Collected',

 role: 'Item Owner',

 type: 'Collected',

 amount: o.totalDepositsCollected || 0,

 status: 'Held in Escrow',

 badgeClass: 'badge-active animate-pulse-glow',

 note: 'Total deposits confirmed by borrowers over time'
 },
 {
 id: 'tx-5-held',
 category: 'Deposits Currently Held',
 role: 'Item Owner',
 type: 'Held',
 amount: o.totalDepositsHeld || 0,
 status: 'Held',
 badgeClass: 'badge-active animate-pulse-glow',
 note: `₹${o.totalDepositsReturnPending || 0} in the return/acknowledgement process`
 },
 {
 id: 'tx-5-returned',
 category: 'Deposits Returned',
 role: 'Item Owner',
 type: 'Returned',
 amount: o.totalDepositsReturned || 0,
 status: 'Acknowledged',
 badgeClass: 'badge-returned',
 note: 'Borrowers acknowledged receipt of returned deposits'
 },

 {

 id: 'tx-6',

 category: 'Fines Collected',

 role: 'Item Owner',

 type: 'Income',

 amount: o.totalFinesCollected || 0,

 status: 'Credited',

 badgeClass: 'badge-available',

 note: 'Late fees received from borrowers'

 },

 {

 id: 'tx-7',

 category: 'Peer Loan Borrowed',

 role: 'Loan Borrower',

 type: 'Principal',

 amount: lb.totalBorrowed || 0,

 status: loanFullyRepaid ? 'Fully Repaid' : loanAwaitingConfirmation ? 'Awaiting lender confirmation' : 'Active',
 badgeClass: loanFullyRepaid ? 'badge-repaid' : loanAwaitingConfirmation ? 'badge-pending animate-pulse-glow' : 'badge-active animate-pulse-glow',

 note: `Repaid: ₹${lb.totalRepaid || 0} | Pending: ₹${lb.totalPending || 0} | Awaiting confirmation: ₹${lb.awaitingConfirmation || 0}`

 },

 {

 id: 'tx-8',

 category: 'Peer Loan Lent',

 role: 'Loan Lender',

 type: 'Investment',

 amount: ll.totalLent || 0,

 status: ll.totalOutstanding === 0 && ll.totalLent > 0 ? 'Recovered' : 'Outstanding',

 badgeClass: ll.totalOutstanding === 0 && ll.totalLent > 0 ? 'badge-returned' : 'badge-active animate-pulse-glow',

 note: `Recovered: ₹${ll.totalRecovered || 0} | Outstanding: ₹${ll.totalOutstanding || 0}`

 },

 ]



 return (

 <div className="max-w-5xl mx-auto space-y-8">
 {loadError ? (
 <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 <span>{loadError}</span>
 <button type="button" onClick={loadFinancialSummary} className="font-semibold text-red-100 underline underline-offset-2">
  Retry
 </button>
 </div>
 ) : null}

 {/* Hero with background */}

 <div className="relative rounded-2xl overflow-hidden animate-card-enter border border-zinc-800/80 shadow-2xl">

 <div

 className="absolute inset-0 bg-cover bg-center"

 style={{

 backgroundImage:

 'url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&auto=format&fit=crop)'

 }}

 ></div>

 <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-[#09090b]/70"></div>



 <div className="relative z-10 p-6 sm:p-8 md:p-10">

 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">

 <Scale className="w-3.5 h-3.5" /> Financial Balance Sheet

 </div>

 <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 flex items-center gap-3">

 <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />

 Financial <span className="text-gradient text-glow-cyan">Overview</span>

 </h1>

 <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">

 Complete overview of your security deposits, overdue fines, repayments, and peer money loan balances.

 </p>

 </div>

 </div>



 {/* Top Summary Stat Cards */}

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-card-enter stagger-1">

 {topStats.map((stat, i) => {

 const Icon = stat.icon

 return (

 <div

 key={i}

 className={`glass-card hover:animate-border-glow p-5 border ${stat.border} transition-all duration-300`}

 >

 <div className="flex items-center justify-between mb-3">

 <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">

 {stat.title}

 </span>

 <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>

 <Icon className={`w-4 h-4 ${stat.color}`} />

 </div>

 </div>

 <div className="flex items-baseline gap-1">

 <span className={`text-2xl font-black ${stat.color} flex items-center`}>

 <IndianRupee className="w-5 h-5" />{stat.value}

 </span>

 </div>

 <p className="text-zinc-500 text-xs mt-1.5">{stat.sub}</p>

 </div>

 )

 })}

 </div>



 {/* Borrower & Owner Visual Cards */}

 <div className="grid md:grid-cols-2 gap-6">

 {/* As Borrower */}

 <div className="glass-card hover:animate-border-glow p-6 border border-zinc-800/80 animate-card-enter stagger-2">

 <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/80">

 <div className="flex items-center gap-2.5">

 <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">

 <TrendingDown className="w-4 h-4 text-amber-400" />

 </div>

 <h2 className="text-lg font-bold text-zinc-100">As Borrower</h2>

 </div>

 <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">

 Item Deposits & Fines

 </span>

 </div>



 <div className="mb-6 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">

 <DonutChart

 value1={b.totalDepositsPaid || 0}

 value2={b.totalDepositsPending || 0}

 label1="Paid"

 label2="Pending"

 color1="#6366f1"

 color2="#f59e0b"

 />

 </div>



 <div className="space-y-3.5">

 <HBar label="Deposits Paid" value={b.totalDepositsPaid || 0} maxVal={maxVal} color="#6366f1" />

 <HBar label="Deposits Pending" value={b.totalDepositsPending || 0} maxVal={maxVal} color="#f59e0b" />
 <HBar label="Deposits Awaiting Verification" value={b.totalDepositsAwaitingConfirmation || 0} maxVal={maxVal} color="#06b6d4" />
 <HBar label="Deposit Return In Progress" value={b.totalDepositsReturnPending || 0} maxVal={maxVal} color="#a78bfa" />

 <HBar label="Fines Paid" value={b.totalFinesPaid || 0} maxVal={maxVal} color="#10b981" />

 <HBar label="Fines Pending" value={b.totalFinesPending || 0} maxVal={maxVal} color="#ef4444" />

 </div>

 </div>



 {/* As Owner */}

 <div className="glass-card hover:animate-border-glow p-6 border border-zinc-800/80 animate-card-enter stagger-2">

 <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/80">

 <div className="flex items-center gap-2.5">

 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

 <TrendingUp className="w-4 h-4 text-emerald-400" />

 </div>

 <h2 className="text-lg font-bold text-zinc-100">As Owner</h2>

 </div>

 <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">

 Collections & Earnings

 </span>

 </div>



 <div className="mb-6 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">

 <DonutChart

 value1={o.totalDepositsCollected || 0}

 value2={o.totalFinesCollected || 0}

 label1="Deposits"

 label2="Fines"

 color1="#10b981"

 color2="#8b5cf6"

 />

 </div>



 <div className="space-y-3.5">

 <HBar label="Deposits Collected" value={o.totalDepositsCollected || 0} maxVal={maxVal} color="#10b981" />
 <HBar label="Deposits Held" value={o.totalDepositsHeld || 0} maxVal={maxVal} color="#06b6d4" />
 <HBar label="Deposit Return In Progress" value={o.totalDepositsReturnPending || 0} maxVal={maxVal} color="#a78bfa" />
 <HBar label="Deposits Returned" value={o.totalDepositsReturned || 0} maxVal={maxVal} color="#6366f1" />

 <HBar label="Fines Collected" value={o.totalFinesCollected || 0} maxVal={maxVal} color="#8b5cf6" />

 </div>

 </div>

 </div>



 {/* Loan Summary */}

 <div className="glass-card hover:animate-border-glow p-6 border border-zinc-800/80 animate-card-enter stagger-3">

 <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/80">

 <div className="flex items-center gap-2.5">

 <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">

 <PieChart className="w-4 h-4 text-cyan-400" />

 </div>

 <h2 className="text-lg font-bold text-zinc-100">Peer Loan Summary</h2>

 </div>

 <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">

 Credit & Lending Stats

 </span>

 <Link to="/money-loans" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
 Manage repayments
 </Link>

 </div>



 <div className="grid md:grid-cols-2 gap-6">

 <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">

 <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">

 <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" /> As Borrower

 </h3>

 <div className="grid grid-cols-3 gap-2.5">

 {[

 { l: 'Borrowed', v: lb.totalBorrowed || 0, c: 'text-zinc-100' },

 { l: 'Repaid', v: lb.totalRepaid || 0, c: 'text-emerald-400' },

 { l: 'Pending', v: lb.totalPending || 0, c: 'text-amber-400' }

 ].map(x => (

 <div key={x.l} className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3 text-center">

 <p className="text-[11px] text-zinc-500 font-medium mb-1">{x.l}</p>

 <p className={`text-base sm:text-lg font-bold ${x.c} flex items-center justify-center`}>

 <IndianRupee className="w-3 h-3" />{x.v}

 </p>

 </div>

 ))}

 </div>

 </div>



 <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">

 <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">

 <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> As Lender

 </h3>

 <div className="grid grid-cols-3 gap-2.5">

 {[

 { l: 'Total Lent', v: ll.totalLent || 0, c: 'text-zinc-100' },

 { l: 'Recovered', v: ll.totalRecovered || 0, c: 'text-emerald-400' },

 { l: 'Outstanding', v: ll.totalOutstanding || 0, c: 'text-amber-400' }

 ].map(x => (

 <div key={x.l} className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3 text-center">

 <p className="text-[11px] text-zinc-500 font-medium mb-1">{x.l}</p>

 <p className={`text-base sm:text-lg font-bold ${x.c} flex items-center justify-center`}>

 <IndianRupee className="w-3 h-3" />{x.v}

 </p>

 </div>

 ))}

 </div>

 </div>

 </div>

 </div>



 {/* Enhanced Transactions / Ledger Breakdown Table */}

 <div className="glass-card hover:animate-border-glow overflow-hidden border border-zinc-800/80 animate-card-enter stagger-4">

 <div className="p-5 md:p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

 <div className="flex items-center gap-2.5">

 <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">

 <Receipt className="w-4 h-4 text-cyan-400" />

 </div>

 <div>

 <h2 className="text-lg font-bold text-zinc-100">Financial Ledger Breakdown</h2>

 <p className="text-zinc-500 text-xs">All active and settled financial line items</p>

 </div>

 </div>

 <span className="text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800 self-start sm:self-auto">

 {transactionEntries.length} Records

 </span>

 </div>



 <div className="overflow-x-auto">

 <table className="w-full text-left border-collapse">

 <thead>

 <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">

 <th className="py-3.5 px-4 sm:px-6">Description / Category</th>

 <th className="py-3.5 px-4">Role</th>

 <th className="py-3.5 px-4">Type</th>

 <th className="py-3.5 px-4">Amount</th>

 <th className="py-3.5 px-4">Status</th>

 <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>

 </tr>

 </thead>

 <tbody className="divide-y divide-zinc-800/50 text-xs">

 {transactionEntries.map((row, idx) => {

 const displayStatus = row.status

 const displayBadge = row.badgeClass

 const isPeerLoan = row.category === 'Peer Loan Borrowed'
 const isOwed = isPeerLoan
  ? row.amount > 0 && !loanFullyRepaid
  : row.role.includes('Borrower') && ['Pending', 'Overdue', 'Active', 'Awaiting owner confirmation'].includes(row.status)



 return (

 <tr

 key={row.id}

 className={`hover:bg-zinc-800/30 transition-colors ${

 idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'

 }`}

 >

 <td className="py-3.5 px-4 sm:px-6 font-semibold text-zinc-200">

 {row.category}

 </td>

 <td className="py-3.5 px-4 text-zinc-400">

 <span className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-[11px]">

 {row.role}

 </span>

 </td>

 <td className="py-3.5 px-4 text-zinc-400 font-medium">

 {row.type}

 </td>

 <td className="py-3.5 px-4 font-bold text-zinc-100">

 <span className="flex items-center">

 <IndianRupee className="w-3.5 h-3.5 text-zinc-400" />

 {row.amount}

 </span>

 </td>

 <td className="py-3.5 px-4">

 <span className={`${displayBadge} text-[10px] uppercase font-bold tracking-wider`}>

 {displayStatus}

 </span>

 </td>

 <td className="py-3.5 px-4 sm:px-6 text-right text-zinc-500 text-[11px]">

 {isOwed ? (
 <Link
 to={row.category === 'Peer Loan Borrowed' ? '/money-loans' : '/my-borrows'}
 className="font-semibold text-cyan-400 hover:text-cyan-300"
 >
 {isPeerLoan ? 'Manage in Peer Money Loans' : 'Open My Borrows to record an external payment'}
 </Link>
 ) : row.note}

 </td>

 </tr>

 )

 })}

 </tbody>

 </table>

 </div>

 </div>

 </div>

 )

}
