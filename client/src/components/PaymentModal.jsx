import React, { useState } from 'react'
import { X, CreditCard, Smartphone, Building, Wallet, CheckCircle2, Loader2, Fingerprint, ShieldCheck } from 'lucide-react'

export default function PaymentModal({
 isOpen,
 onClose,
 amount,
 onSuccess,
 title = "Pay Invoice",
 invoiceId = `E${Math.floor(Math.random() * 1000000)}C`
}) {
 const [selectedMethod, setSelectedMethod] = useState('Credit Card')
 const [isProcessing, setIsProcessing] = useState(false)
 const [isSuccess, setIsSuccess] = useState(false)
 const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

 if (!isOpen) return null

 const methods = [
 { id: 'Credit Card', icon: CreditCard },
 { id: 'Debit Card', icon: CreditCard },
 { id: 'UPI', icon: Smartphone },
 { id: 'Net Banking', icon: Building },
 { id: 'Wallet', icon: Wallet },
 ]

 const handlePay = () => {
 setIsProcessing(true)
 setTimeout(() => {
 setIsProcessing(false)
 setIsSuccess(true)
 setTimeout(() => {
 setIsSuccess(false)
 onSuccess()
 onClose()
 }, 1500)
 }, 1500)
 }

 const handleMouseMove = (e) => {
 const x = (e.clientX / window.innerWidth - 0.5) * 20
 const y = (e.clientY / window.innerHeight - 0.5) * 20
 setMousePos({ x, y })
 }

 return (
 <div 
 className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden perspective-1000"
 onMouseMove={handleMouseMove}
 >
 {/* Immersive Backdrop */}
 <div 
 className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-xl transition-opacity animate-fade-in"
 onClick={!isProcessing ? onClose : undefined}
 >
 <div 
 className="absolute inset-0 opacity-10"
 style={{
 backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
 backgroundSize: '40px 40px',
 transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`
 }}
 />
 </div>
 
 {/* Modal Box */}
 <div 
 className="relative w-full max-w-[420px] bg-[#13141c]/80 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden animate-fade-in-up"
 style={{ transform: `rotateX(${-mousePos.y * 0.2}deg) rotateY(${mousePos.x * 0.2}deg)` }}
 >
 {/* Subtle inner highlight */}
 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

 {/* Floating elements inside modal for depth */}
 <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-3xl opacity-20 animate-pulse-glow pointer-events-none" />
 <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 blur-3xl opacity-20 animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

 {/* Header */}
 <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
 <ShieldCheck className="w-5 h-5 text-cyan-400" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
 <p className="text-xs text-zinc-400 font-medium">Invoice #{invoiceId}</p>
 </div>
 </div>
 <button 
 onClick={onClose}
 disabled={isProcessing}
 className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-full transition-all disabled:opacity-50"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="relative p-6 z-10">
 {isSuccess ? (
 <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
 <CheckCircle2 className="w-10 h-10 text-emerald-400" />
 </div>
 <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Payment Successful</h3>
 <p className="text-zinc-400 text-sm">₹{amount} has been paid securely.</p>
 </div>
 ) : (
 <>
 {/* Amount Card - Floating Glass */}
 <div className="relative bg-[#0a0a0e]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center mb-8 shadow-inner overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
 <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Amount Due</span>
 <div className="text-[46px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 leading-none tracking-tight drop-shadow-sm flex items-center justify-center gap-1">
 <span className="text-3xl text-zinc-500">₹</span>
 {amount}
 </div>
 <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
 <CheckCircle2 className="w-3 h-3" /> Secure Encrypted
 </div>
 </div>

 {/* Methods */}
 <div className="mb-8">
 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Payment Method</h3>
 <div className="grid grid-cols-3 gap-2">
 {methods.map(m => {
 const Icon = m.icon
 const isSelected = selectedMethod === m.id
 return (
 <button
 key={m.id}
 onClick={() => setSelectedMethod(m.id)}
 className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 border ${
 isSelected 
 ? 'bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] transform scale-[1.02]' 
 : 'bg-[#0a0a0e]/40 border-white/5 text-zinc-400 hover:text-white '
 }`}
 >
 <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'opacity-70'}`} />
 <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : ''}`}>
 {m.id}
 </span>
 </button>
 )
 })}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-3 mt-4">
 <button 
 onClick={onClose}
 disabled={isProcessing}
 className="px-5 py-4 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white transition-all disabled:opacity-50"
 >
 Cancel
 </button>
 <button 
 onClick={handlePay}
 disabled={isProcessing}
 className="flex-1 py-4 rounded-xl font-bold text-[15px] text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_4px_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
 >
 {/* Shimmer effect inside button */}
 <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
 
 {isProcessing ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Fingerprint className="w-5 h-5" />
 Pay Securely
 </>
 )}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )
}
