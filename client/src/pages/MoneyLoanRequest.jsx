import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import {
 IndianRupee,
 Loader,
 AlertCircle,
 ArrowLeft,
 Banknote,
 Calendar,
 Percent,
 FileText,
 UserCheck,
 ShieldCheck,
 Star,
 Info,
 Send
} from 'lucide-react'

export default function MoneyLoanRequest() {
 const navigate = useNavigate()
 const [lenders, setLenders] = useState([])
 const [form, setForm] = useState({
 lenderId: '',
 amount: '',
 interestRate: '0',
 dueDate: '',
 purpose: '',
 note: ''
 })
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [error, setError] = useState('')

 useEffect(() => {
 api
 .get('/money-loans/lenders')
 .then(r => {
 if (r.data.success) setLenders(r.data.lenders)
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [])

 const principal = Number(form.amount || 0)
 const interestRate = Number(form.interestRate || 0)
 const interestAmount = (principal * interestRate) / 100
 const total = principal + interestAmount

 const selectedLender = lenders.find(l => l._id === form.lenderId)

 const handleSubmit = async (e) => {
 e.preventDefault()
 setError('')
 setSubmitting(true)
 try {
 await api.post('/money-loans', {
 lenderId: form.lenderId,
 amount: Number(form.amount),
 interestRate: Number(form.interestRate),
 dueDate: form.dueDate,
 purpose: form.purpose,
 note: form.note
 })
 navigate('/money-loans')
 } catch (err) {
 setError(err.response?.data?.message || 'Failed to create request')
 }
 setSubmitting(false)
 }

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-28 animate-fade-in">
 <div className="loading-spinner mb-4"></div>
 <p className="text-zinc-500 text-sm">Loading available lenders...</p>
 </div>
 )
 }

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 {/* Back button */}
 <button
 onClick={() => navigate(-1)}
 className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium group"
 >
 <ArrowLeft className="w-4 h-4 transition-transform group-" />
 Back to Loans
 </button>

 {/* Hero with background */}
 <div className="relative rounded-2xl overflow-hidden animate-fade-in-up border border-zinc-800/80 shadow-2xl">
 <div
 className="absolute inset-0 bg-cover bg-center"
 style={{
 backgroundImage:
 'url(https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&auto=format&fit=crop)'
 }}
 ></div>
 <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-[#09090b]/75"></div>

 <div className="relative z-10 p-6 sm:p-8">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
 <ShieldCheck className="w-3.5 h-3.5" /> Peer Lending Network
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-3">
 <Banknote className="w-7 h-7 text-indigo-400" />
 Request a <span className="text-gradient">Peer Loan</span>
 </h1>
 <p className="text-zinc-400 text-sm mt-2 max-w-lg leading-relaxed">
 Borrow directly from verified community lenders with agreed interest rates, transparent payback schedules, and zero hidden costs.
 </p>
 </div>
 </div>

 {/* Form Glass Card */}
 <div className="glass-card p-6 sm:p-8 border border-zinc-800/80 animate-fade-in-up stagger-1">
 {error && (
 <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-start gap-2.5 text-sm animate-fade-in">
 <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
 <span>{error}</span>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Select Lender */}
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
 <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Select Lender
 </label>
 <select
 required
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none p-3"
 value={form.lenderId}
 onChange={e => setForm({ ...form, lenderId: e.target.value })}
 >
 <option value="">Choose a lender...</option>
 {lenders.map(l => (
 <option key={l._id} value={l._id}>
 {l.name} ({l.email}) — Rating: {l.averageRating ? `${l.averageRating}★` : 'N/A'}
 </option>
 ))}
 </select>

 {selectedLender && (
 <div className="mt-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between text-xs animate-fade-in">
 <span className="text-zinc-400">
 Selected: <strong className="text-zinc-200">{selectedLender.name}</strong> ({selectedLender.email})
 </span>
 <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
 <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
 {selectedLender.averageRating || 'New'}
 </span>
 </div>
 )}
 </div>

 {/* Amount & Interest Rate */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
 <IndianRupee className="w-3.5 h-3.5 text-indigo-400" /> Amount (₹)
 </label>
 <div className="relative">
 <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
 <input
 type="number"
 min="100"
 required
 placeholder="e.g. 1500"
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none pl-9 p-3"
 value={form.amount}
 onChange={e => setForm({ ...form, amount: e.target.value })}
 />
 </div>
 <span className="text-[11px] text-zinc-500 mt-1 block">Minimum loan ₹100</span>
 </div>

 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
 <Percent className="w-3.5 h-3.5 text-indigo-400" /> Agreed Interest (%)
 </label>
 <div className="relative">
 <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
 <input
 type="number"
 min="0"
 placeholder="0"
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none pl-9 p-3"
 value={form.interestRate}
 onChange={e => setForm({ ...form, interestRate: e.target.value })}
 />
 </div>
 <span className="text-[11px] text-zinc-500 mt-1 block">Enter 0 for interest-free loans</span>
 </div>
 </div>

 {/* Due Date */}
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Repayment Due Date
 </label>
 <input
 type="date"
 required
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none p-3"
 value={form.dueDate}
 onChange={e => setForm({ ...form, dueDate: e.target.value })}
 />
 </div>

 {/* Purpose */}
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
 <FileText className="w-3.5 h-3.5 text-indigo-400" /> Purpose of Loan
 </label>
 <input
 required
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none p-3"
 value={form.purpose}
 onChange={e => setForm({ ...form, purpose: e.target.value })}
 placeholder="e.g. Semester books, Project hardware, Hostel fee"
 />
 </div>

 {/* Note (optional) */}
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
 Note (Optional)
 </label>
 <textarea
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none p-3"
 rows={3}
 value={form.note}
 onChange={e => setForm({ ...form, note: e.target.value })}
 placeholder="Add any additional context or payment terms for the lender..."
 />
 </div>

 {/* Dynamic Loan Breakdown Preview */}
 {form.amount && (
 <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-indigo-900/20 to-purple-950/40 border border-indigo-500/25 animate-fade-in space-y-3">
 <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-indigo-500/20">
 <span className="flex items-center gap-1">
 <Info className="w-3.5 h-3.5 text-indigo-400" /> Repayment Summary
 </span>
 {form.dueDate && (
 <span>Due: {new Date(form.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
 )}
 </div>

 <div className="grid grid-cols-2 gap-2 text-xs">
 <div>
 <span className="text-zinc-500 block">Principal Amount:</span>
 <span className="text-zinc-200 font-semibold">₹{principal}</span>
 </div>
 <div>
 <span className="text-zinc-500 block">Interest ({interestRate}%):</span>
 <span className="text-zinc-200 font-semibold">+₹{interestAmount.toFixed(0)}</span>
 </div>
 </div>

 <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between">
 <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
 Total Repayable:
 </span>
 <span className="text-2xl font-black text-indigo-400 flex items-center">
 <IndianRupee className="w-5 h-5" />{total.toFixed(0)}
 </span>
 </div>
 </div>
 )}

 {/* Submit Button */}
 <button
 type="submit"
 disabled={submitting}
 className="btn-primary w-full flex justify-center items-center gap-2 py-3 text-sm font-bold shadow-lg shadow-indigo-600/30"
 >
 {submitting ? (
 <Loader className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Send className="w-4 h-4" /> Send Loan Request
 </>
 )}
 </button>
 </form>
 </div>
 </div>
 )
}
