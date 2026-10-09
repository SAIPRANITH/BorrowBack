import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/api'
import {
 Package,
 Star,
 IndianRupee,
 Calendar,
 User,
 AlertCircle,
 Loader,
 Trash2,
 ArrowLeft,
 ShieldCheck,
 Clock,
 CheckCircle2,
 Tag,
 Info,
 ChevronRight
} from 'lucide-react'

export default function ItemDetail() {
 const { id } = useParams()
 const { user } = useContext(AuthContext)
 const navigate = useNavigate()
 const [item, setItem] = useState(null)
 const [loading, setLoading] = useState(true)
 const [dueDate, setDueDate] = useState('')
 const [msg, setMsg] = useState({ type: '', text: '' })
 const [submitting, setSubmitting] = useState(false)

 useEffect(() => {
 api
 .get(`/items/${id}`)
 .then((r) => {
 if (r.data.success) setItem(r.data.item)
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [id])

 const handleBorrow = async (e) => {
 e.preventDefault()
 setSubmitting(true)
 setMsg({ type: '', text: '' })
 try {
 await api.post('/borrows', { itemId: item._id, dueDate })
 setMsg({ type: 'success', text: 'Borrow request sent successfully! Waiting for owner approval.' })
 } catch (err) {
 setMsg({
 type: 'error',
 text: err.response?.data?.message || 'Failed to send borrow request'
 })
 }
 setSubmitting(false)
 }

 const handleDelete = async () => {
 if (!confirm('Are you sure you want to delete this item?')) return
 try {
 await api.delete(`/items/${id}`)
 navigate('/my-items')
 } catch {}
 }

 if (loading) {
 return (
 <div className="flex justify-center items-center py-32 animate-pulse-glow">
 <div className="loading-spinner" />
 </div>
 )
 }

 if (!item) {
 return (
 <div className="max-w-md mx-auto text-center py-24 glass-card p-8 rounded-3xl border border-white/10 animate-scale-in">
 <div className=" mb-4">
 <Package className="w-16 h-16 text-zinc-600 mx-auto " />
 </div>
 <h2 className="text-xl font-bold text-zinc-100 text-glow-blue">Item Not Found</h2>
 <p className="text-xs text-zinc-400 mt-2 mb-6">
 This item may have been removed or is no longer listed.
 </p>
 <button
 onClick={() => navigate('/browse')}
 className="btn-primary text-xs py-2.5 px-5 rounded-xl animate-border-glow"
 >
 Browse Other Items
 </button>
 </div>
 )
 }

 const isOwner = user?._id === item.owner?._id
 const todayStr = new Date().toISOString().split('T')[0]

 return (
 <div className="max-w-5xl mx-auto animate-card-enter pb-12">
 {/* Navigation Breadcrumb & Back Button */}
 <div className="flex items-center justify-between gap-4 mb-6">
 <button
 onClick={() => navigate(-1)}
 className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 transition-all"
 >
 <ArrowLeft className="w-4 h-4 animate-bounce-soft" />
 <span>Back</span>
 </button>

 <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
 <Link to="/browse" className="hover:text-blue-400 transition-colors">
 Browse
 </Link>
 <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
 <span className="capitalize text-zinc-400">{item.category}</span>
 <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
 <span className="text-zinc-200 truncate max-w-[200px] text-glow-blue">{item.name}</span>
 </div>
 </div>

 {/* Main Two-Column Item Showcase */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
 {/* Left Column: Large Rounded Image Display */}
 <div className="lg:col-span-6 space-y-4">
 <div className="rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-zinc-900/80 group min-h-[380px] sm:min-h-[440px] flex items-center justify-center animate-border-glow">
 {item.imageUrl ? (
 <img
 src={item.imageUrl}
 alt={item.name}
 className="w-full h-full max-h-[500px] object-cover transition-transform duration-700 ease-out"
 />
 ) : (
 <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/40 via-zinc-900 to-cyan-950/30 p-8 text-center">
 <div className=" w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
 <Package className="w-10 h-10 " />
 </div>
 <p className="text-sm font-semibold text-zinc-300">No Image Uploaded</p>
 <p className="text-xs text-zinc-500 mt-1">
 Item provided as described by the campus owner
 </p>
 </div>
 )}

 {/* Gradient bottom shadow for image */}
 <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />

 {/* Top Left: Category badge */}
 <div className="absolute top-4 left-4 z-10 ">
 <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-blue-300 shadow-lg animate-pulse-glow">
 <Tag className="w-3.5 h-3.5 text-blue-400" />
 {item.category}
 </span>
 </div>

 {/* Top Right: Status Badge */}
 <div className="absolute top-4 right-4 z-10 ">
 <span className={`badge-${item.status} shadow-lg backdrop-blur-md px-3.5 py-1.5 text-xs uppercase tracking-wider animate-pulse-glow`}>
 {item.status}
 </span>
 </div>
 </div>

 {/* Campus Safety Badges */}
 <div className="grid grid-cols-3 gap-3">
 <div className="glass-card p-3 rounded-2xl text-center border border-white/5 animate-scale-in" style={{animationDelay: '0.1s'}}>
 <div className=" mx-auto mb-1">
 <ShieldCheck className="w-4 h-4 text-emerald-400" />
 </div>
 <p className="text-[11px] font-semibold text-zinc-200">Verified Peer</p>
 <p className="text-[10px] text-zinc-500">Student ID match</p>
 </div>
 <div className="glass-card p-3 rounded-2xl text-center border border-white/5 animate-scale-in" style={{animationDelay: '0.2s'}}>
 <div className=" mx-auto mb-1">
 <IndianRupee className="w-4 h-4 text-blue-400" />
 </div>
 <p className="text-[11px] font-semibold text-zinc-200">Held Deposit</p>
 <p className="text-[10px] text-zinc-500">Auto return refund</p>
 </div>
 <div className="glass-card p-3 rounded-2xl text-center border border-white/5 animate-scale-in" style={{animationDelay: '0.3s'}}>
 <div className=" mx-auto mb-1">
 <Clock className="w-4 h-4 text-amber-400" />
 </div>
 <p className="text-[11px] font-semibold text-zinc-200">Tracked Dates</p>
 <p className="text-[10px] text-zinc-500">Daily fine tracking</p>
 </div>
 </div>
 </div>

 {/* Right Column: Information, Owner, and Borrow Request Form */}
 <div className="lg:col-span-6 space-y-6">
 {/* Main Info Card */}
 <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6 animate-scale-in">
 {/* Title & Heading */}
 <div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug text-glow-cyan">
 {item.name}
 </h1>
 <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1.5">
 <span>Listed under</span>
 <span className="text-blue-400 font-semibold capitalize">{item.category}</span>
 </p>
 </div>

 {/* Pricing & Metric Stat Pills */}
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {/* Deposit */}
 <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-border-glow">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
 Refundable Deposit
 </span>
 <div className="text-xl font-extrabold text-emerald-300 flex items-center">
 <IndianRupee className="w-4 h-4 mr-1" />
 {item.depositAmount}
 </div>
 </div>

 {/* Fine Per Day */}
 <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-border-glow">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400 block mb-1">
 Overdue Fine
 </span>
 <div className="text-xl font-extrabold text-red-300 flex items-center">
 <IndianRupee className="w-4 h-4 mr-1" />
 {item.finePerDay}
 <span className="text-xs font-normal text-red-400/80 ml-1">/day</span>
 </div>
 </div>

 {/* Rating */}
 <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 col-span-2 sm:col-span-1 animate-border-glow">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">
 Item Rating
 </span>
 <div className="text-xl font-extrabold text-amber-300 flex items-center gap-1">
 <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-rotate-in" />
 <span>
 {item.averageRating && item.averageRating > 0
 ? item.averageRating.toFixed(1)
 : '5.0'}
 </span>
 </div>
 </div>
 </div>

 {/* Description */}
 <div className="space-y-2 pt-2 border-t border-zinc-800">
 <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-glow-blue">
 Item Description
 </h3>
 <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
 {item.description || 'No detailed description provided by the owner.'}
 </p>
 </div>

 {/* Owner Details Card */}
 {item.owner && (
 <div className="pt-4 border-t border-zinc-800 animate-scale-in">
 <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 text-glow-blue">
 Listed By
 </h3>
 <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 transition-colors animate-border-glow">
 <div className="flex items-center gap-3.5">
 <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow-md border border-white/10 ">
 {item.owner.name?.[0]?.toUpperCase() || 'U'}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-white text-glow-cyan">{item.owner.name}</span>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold animate-pulse-glow">
 Verified
 </span>
 </div>
 <p className="text-xs text-zinc-400 mt-0.5">{item.owner.email}</p>
 </div>
 </div>

 {item.owner.averageRating > 0 && (
 <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-rotate-in" />
 <span>{item.owner.averageRating.toFixed(1)}</span>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Status Message / Notification Banner */}
 {msg.text && (
 <div
 className={`px-4 py-3.5 rounded-xl flex items-start gap-3 text-sm animate-scale-in ${
 msg.type === 'error'
 ? 'bg-red-500/10 border border-red-500/20 text-red-300 animate-pulse-glow'
 : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 animate-pulse-glow'
 }`}
 >
 {msg.type === 'error' ? (
 <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce-soft" />
 ) : (
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce-soft" />
 )}
 <span className="leading-snug">{msg.text}</span>
 </div>
 )}

 {/* Action Form for Borrowers */}
 {!isOwner && item.status === 'available' && (
 <div className="pt-4 border-t border-zinc-800">
 <div className="mb-4">
 <h3 className="text-base font-bold text-white flex items-center gap-2 text-glow-cyan">
 <Calendar className="w-4 h-4 text-blue-400 animate-rotate-in" />
 Request to Borrow
 </h3>
 <p className="text-xs text-zinc-400 mt-1">
 Select your expected return date to send a request to the owner.
 </p>
 </div>

 <form onSubmit={handleBorrow} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
 Return Due Date
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <Calendar className="w-4 h-4" />
 </div>
 <input
 type="date"
 required
 min={todayStr}
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none pl-11 py-3 rounded-xl w-full focus:ring-blue-500/50"
 />
 </div>
 </div>

 <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 animate-border-glow">
 <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400 animate-pulse-glow" />
 <p className="leading-relaxed">
 You will need to pay the ₹{item.depositAmount} deposit upon item handover,
 which will be fully refunded once the item is returned on time.
 </p>
 </div>

 <button
 type="submit"
 disabled={submitting}
 className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 shadow-xl shadow-blue-600/25 /40 active:translate-y-0 transition-all animate-border-glow"
 >
 {submitting ? (
 <>
 <Loader className="w-4 h-4 animate-spin" />
 <span>Sending Request...</span>
 </>
 ) : (
 <>
 <span>Request to Borrow</span>
 <CheckCircle2 className="w-4 h-4 ml-1" />
 </>
 )}
 </button>
 </form>
 </div>
 )}

 {/* Unavailable State Notice */}
 {!isOwner && item.status !== 'available' && (
 <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 text-center space-y-1 animate-scale-in">
 <p className="text-sm font-semibold text-zinc-300 text-glow-cyan">Item Currently Unavailable</p>
 <p className="text-xs text-zinc-500">
 This item is marked as <span className="text-amber-400 font-medium animate-pulse-glow">{item.status}</span>{' '}
 and cannot accept borrow requests right now.
 </p>
 </div>
 )}

 {/* Owner Controls */}
 {isOwner && (
 <div className="pt-4 border-t border-zinc-800 space-y-3 animate-scale-in">
 <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between animate-border-glow">
 <span className="text-xs font-semibold text-blue-300">
 You are the owner of this listing
 </span>
 <Link
 to="/my-items"
 className="text-xs font-bold text-blue-400 hover:underline hover:text-cyan-400 transition-colors"
 >
 Manage Items &rarr;
 </Link>
 </div>

 <button
 onClick={handleDelete}
 className="btn-danger w-full py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-600/20 /30 transition-all animate-border-glow"
 >
 <Trash2 className="w-4 h-4 animate-bounce-soft" />
 <span>Delete Listing</span>
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )
}
