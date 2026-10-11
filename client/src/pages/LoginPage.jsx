import React, { useState, useContext, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Mail, Lock, ArrowRight, Loader2, Fingerprint, ShieldCheck, Download } from 'lucide-react'

export default function LoginPage() {
 const { login, user } = useContext(AuthContext)
 const navigate = useNavigate()
 const location = useLocation()
 
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [heroLine, setHeroLine] = useState('Lend what you can.')
 const [error, setError] = useState(
 location.state?.reason === 'inactivity'
 ? 'You were signed out after 5 minutes of inactivity. Please sign in again.'
 : ''
 )
 const [loading, setLoading] = useState(false)


 // Redirect if already logged in
 useEffect(() => {
 if (user) navigate('/')
 }, [user, navigate])


 useEffect(() => {
 if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

 const heroLines = [
 'Lend what you can.',
 'Share what you have.',
 'Pass good things on.',
 ]
 const intervalId = window.setInterval(() => {
 setHeroLine(current => {
 const choices = heroLines.filter(line => line !== current)
 return choices[Math.floor(Math.random() * choices.length)]
 })
 }, 5000)

 return () => window.clearInterval(intervalId)
 }, [])


 const handleSubmit = async (e) => {
 e.preventDefault()
 setError('')
 setLoading(true)
 try {
 const res = await login(email, password)
 if (res && !res.success) setError(res.message)
 } catch (loginError) {
 setError(loginError?.response?.data?.message || loginError?.message || 'Login failed')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="auth-page auth-page--login min-h-screen relative flex items-center justify-center overflow-hidden text-zinc-100">
 <div aria-hidden="true" className="ambient-photo-layer">
 <span className="ambient-photo ambient-photo--book" />
 <span className="ambient-photo ambient-photo--camera" />
 <span className="ambient-photo ambient-photo--electronics" />
 </div>
 <div aria-hidden="true" className="auth-background-art absolute pointer-events-none">
 <div className="auth-background-mark" />
 </div>

 {/* ================= CONTENT CONTAINER ================= */}
 <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
 
 {/* Left Side: Info */}
 <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-in-up">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-semibold backdrop-blur-md">
 Borrowing and lending on campus
 </div>
 <h1 className="login-hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.02]">
 Borrow what you need. <br />
 <span key={heroLine} className="login-hero-highlight">
 {heroLine}
 </span>
 </h1>
 <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
 Find items listed by other members, request to borrow, and keep track of returns, deposits, and loan repayments.
 </p>
 
 <div className="pt-6 hidden lg:grid grid-cols-3 gap-5 border-t border-white/10">
 <p className="text-sm text-zinc-300">Browse items<br /><span className="text-xs text-zinc-500">See what others have listed.</span></p>
 <p className="text-sm text-zinc-300">Track returns<br /><span className="text-xs text-zinc-500">Keep due dates and status together.</span></p>
 <p className="text-sm text-zinc-300">Record payments<br /><span className="text-xs text-zinc-500">Confirm them with the other person.</span></p>
 </div>
 <p className="login-developer-credit">
 Built with care by <strong>Sai Pranith Reddy Vaka</strong>
 </p>
 </div>

 {/* Right Side: Login Card */}
 <div className="w-full max-w-[440px] flex-shrink-0">

 <div className="auth-card p-8 sm:p-10 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
 
 {/* Subtle inner highlight */}
 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

 {/* Logo & Header */}
 <div className="text-center mb-8 relative">
 <div className="auth-logo-mark inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative group">
 <img src="/icons/borrowback-mark.svg" alt="" className="w-9 h-9 relative z-10" />
 <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
 </div>
 
 <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
 Welcome Back
 </h2>
 <p className="text-zinc-400 text-sm font-medium">
 Sign in to your campus account.
 </p>
 </div>

 {/* Error Message */}
 {error && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-center gap-2 animate-slide-down">
 <ShieldCheck className="w-4 h-4 text-red-400" />
 <span>{error}</span>
 </div>
 )}

 {/* Form */}
 <form onSubmit={handleSubmit} autoComplete="on" className="space-y-5 relative">
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
 Campus Email
 </label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
 <Mail className="w-4.5 h-4.5" />
 </div>
 <input
 type="email"
 name="email"
 autoComplete="username"
 autoCapitalize="none"
 spellCheck="false"
 required
 className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0e]/50 border border-white/5 group- rounded-xl text-white text-[15px] focus:border-cyan-500/50 focus:bg-[#0a0a0e]/80 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none shadow-inner"
 placeholder="name@university.edu"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between ml-1">
 <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
 Password
 </label>
 <span className="text-[11px] text-zinc-500 font-medium">
 Need help? Contact your campus administrator.
 </span>
 </div>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
 <Lock className="w-4.5 h-4.5" />
 </div>
 <input
 type="password"
 name="password"
 autoComplete="current-password"
 required
 className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0e]/50 border border-white/5 group- rounded-xl text-white text-[15px] focus:border-cyan-500/50 focus:bg-[#0a0a0e]/80 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none shadow-inner"
 placeholder="••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="auth-submit w-full mt-2 py-4 rounded-xl font-bold text-[15px] text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
 >
 {/* Shimmer effect inside button */}
 <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
 
 {loading ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Fingerprint className="w-5 h-5" />
 Authenticate
 <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group- transition-all" />
 </>
 )}
 </button>
 </form>

 {/* Footer */}
 <div className="mt-8 text-center text-sm font-medium text-zinc-400 relative">
 Don't have an account?{' '}
 <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-4 hover:underline">
 Join the network
 </Link>
 <a
 href="/downloads/BorrowBack.apk"
 className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
 download
 >
 <Download className="w-4 h-4" />
 Download the Android app
 </a>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
