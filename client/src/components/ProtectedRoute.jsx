import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Package } from 'lucide-react'

export default function ProtectedRoute() {
 const { user, loading } = useContext(AuthContext)

 if (loading) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b]">
 <div className="relative mb-6">
 <div className="loading-spinner"></div>
 <Package className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
 </div>
 <h2 className="text-xl font-bold text-gradient mb-2">BorrowBack</h2>
 <p className="text-zinc-500 text-sm animate-pulse">Loading your workspace...</p>
 </div>
 )
 }

 if (!user) return <Navigate to="/login" replace />
 return <Outlet />
}
