import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
 Package,
 User,
 Mail,
 Phone,
 Lock,
 AlertCircle,
 Loader,
 ArrowRight,
 ShieldCheck,
 CheckCircle2,
 Sparkles,
 Zap,
 Repeat
} from 'lucide-react'

export default function RegisterPage() {
 const { register } = useContext(AuthContext)
 const [form, setForm] = useState({
 name: '',
 email: '',
 password: '',
 confirmPassword: '',
 phone: ''
 })
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)

 const handleSubmit = async (e) => {
 e.preventDefault()
 setError('')
 if (form.password !== form.confirmPassword) {
 return setError('Passwords do not match')
 }
 setLoading(true)
 const res = await register({
 name: form.name,
 email: form.email,
 password: form.password,
 phone: form.phone
 })
 if (res && !res.success) setError(res.message)
 setLoading(false)
 }

 const perks = [
 {
 icon: Zap,
 title: 'Instant Borrowing',
 desc: 'Browse hundreds of available items listed by students on your campus.'
 },
 {
 icon: ShieldCheck,
 title: 'Protected Deposits',
 desc: 'Automated escrow, secure return verification, and penalty management.'
 },
 {
 icon: Repeat,
 title: 'Peer Financing',
 desc: 'Transparent money lending with agreed interest rates and return schedules.'
 }
 ]

 return (
 <div className="min-h-screen flex bg-[#09090b] text-zinc-100 selection:bg-blue-500/30 selection:text-white">
 {/* Left: Campus background image + community perks */}
 <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
 {/* Background Photo */}
 <div
 className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
 style={{
 backgroundImage:
 "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&auto=format&fit=crop')",
 }}
 />

 {/* Dark layered overlays that keep the photo visible */}
 <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/90" />
 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
 <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none " />
 <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none " style={{ animationDelay: '1s' }} />

 {/* Content */}
 <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
 {/* Brand Header */}
 <div className="flex items-center gap-3 animate-scale-in">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-cyan-500/25 border border-white/20 ">
 <Package className="w-6 h-6 text-white animate-bounce-soft" />
 </div>
 <div>
 <span className="text-2xl font-black tracking-tight text-gradient text-glow-cyan">BorrowBack</span>
 <p className="text-xs text-zinc-400 font-medium tracking-wide">Campus Resource Network</p>
 </div>
 </div>

 {/* Middle Pitch */}
 <div className="my-auto py-10 max-w-xl animate-scale-in">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 animate-pulse-glow">
 <Sparkles className="w-3.5 h-3.5 animate-rotate-in" />
 <span>Join 500+ Campus Members</span>
 </div>

 <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.15] mb-5 text-glow-blue">
 Be Part of the <br />
 <span className="text-gradient">Sharing Economy</span>
 </h1>

 <p className="text-zinc-400 text-base leading-relaxed mb-8">
 Why buy when you can borrow? Set up your verified student account in under two minutes
 to unlock campus gear sharing and secure peer lending.
 </p>

 <div className="space-y-3.5">
 {perks.map((p, i) => (
 <div
 key={i}
 className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/5 transition-all animate-card-enter hover:animate-border-glow group"
 style={{ animationDelay: `${i * 0.1}s` }}
 >
 <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 ">
 <p.icon className="w-4 h-4 transition-transform " />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-zinc-200">{p.title}</h3>
 <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Footer badge */}
 <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 animate-scale-in">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse-glow" />
 <span>Free to join for verified university students</span>
 </div>
 <span>No hidden fees</span>
 </div>
 </div>
 </div>

 {/* Right: Register Form */}
 <div className="flex-1 flex items-center justify-center relative z-10 p-6 sm:p-10 lg:p-16 overflow-y-auto">
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] -top-32 -right-32 " />
 <div className="absolute w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[140px] -bottom-32 -left-20 " style={{ animationDelay: '1.5s' }} />
 </div>

 <div className="w-full max-w-md relative z-10 animate-scale-in my-auto py-6 glass-card p-8 rounded-3xl border border-white/10 shadow-2xl animate-border-glow">
 {/* Mobile Header Logo */}
 <div className="lg:hidden text-center mb-8">
 <div className="inline-flex items-center gap-3 mb-2">
 <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ">
 <Package className="w-6 h-6 text-white animate-bounce-soft" />
 </div>
 <span className="text-2xl font-black text-gradient text-glow-cyan">BorrowBack</span>
 </div>
 <p className="text-zinc-400 text-xs">Create your campus account</p>
 </div>

 {/* Form Header */}
 <div className="mb-6">
 <h2 className="text-3xl font-extrabold text-white tracking-tight text-glow-blue">Create Account</h2>
 <p className="text-zinc-400 text-sm mt-2">
 Fill in your details below to get started with BorrowBack.
 </p>
 </div>

 {/* Error Banner */}
 {error && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl mb-5 flex items-start gap-3 text-sm animate-scale-in">
 <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse-glow" />
 <div className="leading-snug">{error}</div>
 </div>
 )}

 {/* Registration Form */}
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Full Name */}
 <div className="animate-card-enter">
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
 Full Name
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <User className="w-4 h-4" />
 </div>
 <input
 type="text"
 required
 className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
 placeholder="Alex Johnson"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 />
 </div>
 </div>

 {/* Email */}
 <div className="animate-card-enter" style={{ animationDelay: '0.1s' }}>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
 Email Address
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <Mail className="w-4 h-4" />
 </div>
 <input
 type="email"
 required
 className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
 placeholder="alex@university.edu"
 value={form.email}
 onChange={(e) => setForm({ ...form, email: e.target.value })}
 />
 </div>
 </div>

 {/* Phone */}
 <div className="animate-card-enter" style={{ animationDelay: '0.2s' }}>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
 Phone Number
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <Phone className="w-4 h-4" />
 </div>
 <input
 type="tel"
 required
 className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
 placeholder="+91 98765 43210"
 value={form.phone}
 onChange={(e) => setForm({ ...form, phone: e.target.value })}
 />
 </div>
 </div>

 {/* Password Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-card-enter" style={{ animationDelay: '0.3s' }}>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
 Password
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <Lock className="w-4 h-4" />
 </div>
 <input
 type="password"
 required
 className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
 placeholder="Create password"
 value={form.password}
 onChange={(e) => setForm({ ...form, password: e.target.value })}
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
 Confirm
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
 <Lock className="w-4 h-4" />
 </div>
 <input
 type="password"
 required
 className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
 placeholder="Repeat password"
 value={form.confirmPassword}
 onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
 />
 </div>
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="btn-primary w-full flex justify-center items-center py-3.5 px-6 rounded-xl font-semibold text-sm shadow-xl shadow-blue-600/25 /40 active:translate-y-0 transition-all duration-200 !mt-5 animate-pulse-glow"
 >
 {loading ? (
 <Loader className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <span className="relative flex items-center gap-2">
 <span>Create Account</span>
 <ArrowRight className="w-4 h-4 ml-2 animate-rotate-in" />
 </span>
 </>
 )}
 </button>
 </form>

 {/* Footer Sign In Callout */}
 <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
 <p className="text-sm text-zinc-400">
 Already have an account?{' '}
 <Link
 to="/login"
 className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline-offset-4 hover:underline text-glow-blue"
 >
 Sign in
 </Link>
 </p>
 </div>
 </div>
 </div>
 </div>
 )
}
