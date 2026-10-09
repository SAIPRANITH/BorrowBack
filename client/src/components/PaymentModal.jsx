import React, { useEffect, useState } from 'react'
import { Loader2, X, Wallet, ShieldAlert } from 'lucide-react'

export default function PaymentModal({
 isOpen,
 onClose,
 amount,
 onSuccess,
 title = 'Record External Payment',
 invoiceId = `E${Math.floor(Math.random() * 1000000)}C`
}) {
 const [isProcessing, setIsProcessing] = useState(false)
 const [error, setError] = useState('')

 useEffect(() => {
  if (isOpen) setError('')
 }, [isOpen])

 if (!isOpen) return null

 const handleRecordPayment = async () => {
  setError('')
  setIsProcessing(true)
  try {
   const result = await onSuccess()
   if (result === false) {
    setError('The payment record could not be saved. Please retry.')
    return
   }
   onClose()
  } catch (requestError) {
   setError(requestError?.response?.data?.message || requestError?.message || 'The payment record could not be saved. Please retry.')
  } finally {
   setIsProcessing(false)
  }
 }

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
   <button
    type="button"
    aria-label="Close payment details"
    className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm"
    onClick={isProcessing ? undefined : onClose}
   />

   <section
    role="dialog"
    aria-modal="true"
    aria-labelledby="payment-dialog-title"
    className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-[#13141c] p-6 shadow-2xl"
   >
    <div className="mb-5 flex items-start justify-between gap-4">
     <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
       <ShieldAlert className="h-5 w-5" />
      </div>
      <div>
       <h2 id="payment-dialog-title" className="text-lg font-bold text-white">{title}</h2>
       <p className="text-xs text-zinc-400">Reference #{invoiceId}</p>
      </div>
     </div>
     <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      disabled={isProcessing}
      className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
     >
      <X className="h-4 w-4" />
     </button>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
     <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Amount to record</span>
     <p className="text-4xl font-black text-white">₹{Number(amount || 0).toLocaleString('en-IN')}</p>
    </div>

    <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
     <p className="text-sm font-semibold text-amber-200">BorrowBack does not process online payments.</p>
     <p className="mt-1 text-xs leading-relaxed text-zinc-300">
      No money will be transferred or charged here. Continue only if you have already paid the other person using an agreed method outside the app.
     </p>
    </div>

    {error ? <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

    <div className="mt-5 flex gap-3">
     <button
      type="button"
      onClick={onClose}
      disabled={isProcessing}
      className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/5"
     >
      Cancel
     </button>
     <button
      type="button"
      onClick={handleRecordPayment}
      disabled={isProcessing}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
     >
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      {isProcessing ? 'Saving...' : 'I already paid — mark as paid'}
     </button>
    </div>
   </section>
  </div>
 )
}
