import React, { useState, useContext, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Mail, Lock, ArrowRight, Loader2, Package, Fingerprint, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
 const { login, user } = useContext(AuthContext)
 const navigate = useNavigate()
 const location = useLocation()
 
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [error, setError] = useState(
 location.state?.reason === 'inactivity'
 ? 'You were signed out after 5 minutes of inactivity. Please sign in again.'
 : ''
 )
 const [loading, setLoading] = useState(false)
 const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

 // Redirect if already logged in
 useEffect(() => {
 if (user) navigate('/')
 }, [user, navigate])

 const handleMouseMove = (e) => {
 // Parallax effect calculations
 const x = (e.clientX / window.innerWidth - 0.5) * 20
 const y = (e.clientY / window.innerHeight - 0.5) * 20
 setMousePos({ x, y })
 }

 const handleSubmit = async (e) => {
 e.preventDefault()
 setError('')
 setLoading(true)
 const res = await login(email, password)
 if (res && !res.success) setError(res.message)
 setLoading(false)
 }

 return (
 <div 
 className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0a0e] selection:bg-cyan-500/30 text-zinc-100"
 onMouseMove={handleMouseMove}
 >
 {/* ================= BACKGROUND EFFECTS ================= */}
 <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
 {/* Dynamic Grid */}
 <div 
 className="absolute inset-0 opacity-[0.03]"
 style={{
 backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
 backgroundSize: '40px 40px',
 transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`
 }}
 />

 {/* Floating Glowing Orbs */}
 <div 
 className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-glow"
 style={{ transform: `translate(${-mousePos.x * 2}px, ${-mousePos.y * 2}px)` }}
 />
 <div 
 className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[150px] "
 style={{ transform: `translate(${mousePos.x * 3}px, ${mousePos.y * 3}px)`, animationDelay: '1s' }}
 />
 <div 
 className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[100px] animate-pulse-glow"
 style={{ transform: `translate(${mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)`, animationDelay: '2s' }}
 />
 </div>

 {/* ================= CONTENT CONTAINER ================= */}
 <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
 
 {/* Left Side: Info */}
 <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-in-up">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-semibold backdrop-blur-md">
 <Sparkles className="w-4 h-4" /> Next-Gen Campus Network
 </div>
 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
 Borrow smarter, <br />
 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
 live better.
 </span>
 </h1>
 <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
 BorrowBack is the ultimate smart campus borrowing, return, and lost-and-found management system. Securely share items, request short-term funds, and track everything seamlessly.
 </p>
 
 <div className="pt-6 hidden lg:flex items-center gap-8">
 <div className="space-y-1">
 <div className="text-3xl font-bold text-white">10k+</div>
 <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Active Users</div>
 </div>
 <div className="w-px h-12 bg-white/10"></div>
 <div className="space-y-1">
 <div className="text-3xl font-bold text-white">15k+</div>
 <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Items Shared</div>
 </div>
 <div className="w-px h-12 bg-white/10"></div>
 <div className="space-y-1">
 <div className="text-3xl font-bold text-white">Zero</div>
 <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Lost Items</div>
 </div>
 </div>
 </div>

 {/* Right Side: Login Card */}
 <div 
 className="w-full max-w-[440px] flex-shrink-0"
 style={{ transform: `perspective(1000px) rotateX(${-mousePos.y * 0.15}deg) rotateY(${mousePos.x * 0.15}deg)` }}
 >
 <div className="bg-[#13141c]/80 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
 
 {/* Subtle inner highlight */}
 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

 {/* Logo & Header */}
 <div className="text-center mb-8 relative">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-cyan-500/30 mb-5 relative group">
 <Package className="w-8 h-8 text-white relative z-10" />
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
 <form onSubmit={handleSubmit} className="space-y-5 relative">
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
 <span className="text-[11px] text-cyan-500 hover:text-cyan-400 cursor-pointer font-medium transition-colors">
 Forgot?
 </span>
 </div>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
 <Lock className="w-4.5 h-4.5" />
 </div>
 <input
 type="password"
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
 className="w-full mt-2 py-4 rounded-xl font-bold text-[15px] text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_4px_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
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
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
