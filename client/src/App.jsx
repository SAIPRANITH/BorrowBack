import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import BrowseItems from './pages/BrowseItems'
import ItemDetail from './pages/ItemDetail'
import MyItems from './pages/MyItems'
import BorrowRequests from './pages/BorrowRequests'
import MyBorrows from './pages/MyBorrows'
import Fines from './pages/Fines'
import MoneyLoans from './pages/MoneyLoans'
import MoneyLoanRequest from './pages/MoneyLoanRequest'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import { AuthContext } from './context/AuthContext'
import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

function AdminRoute() {
  const { user, loading } = useContext(AuthContext)
  if (loading) return null
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}

function UserRoute() {
  const { user, loading } = useContext(AuthContext)
  if (loading) return null
  return user?.role === 'user' ? <Outlet /> : <Navigate to="/admin" replace />
}

function RoleBasedRedirect() {
  const { user, loading } = useContext(AuthContext)
  if (loading) return null
  return user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />
}

function App() {
 return (
 <Routes>
 <Route path="/login" element={<LoginPage />} />
 <Route path="/register" element={<RegisterPage />} />
 <Route element={<ProtectedRoute />}>
 <Route element={<Layout />}>
 <Route path="/" element={<RoleBasedRedirect />} />
 <Route path="/notifications" element={<Notifications />} />
 <Route path="/profile" element={<Profile />} />
 
 <Route element={<UserRoute />}>
   <Route path="/browse" element={<BrowseItems />} />
   <Route path="/items/:id" element={<ItemDetail />} />
   <Route path="/my-items" element={<MyItems />} />
   <Route path="/requests" element={<BorrowRequests />} />
   <Route path="/my-borrows" element={<MyBorrows />} />
   <Route path="/fines" element={<Fines />} />
   <Route path="/money-loans" element={<MoneyLoans />} />
   <Route path="/money-loans/request" element={<MoneyLoanRequest />} />
 </Route>

 <Route element={<AdminRoute />}>
   <Route path="/admin" element={<AdminDashboard />} />
   <Route path="/admin/accounts" element={<AdminDashboard />} />
   <Route path="/admin/analytics" element={<AdminDashboard />} />
   <Route path="/admin/alerts" element={<AdminDashboard />} />
   <Route path="/admin/system" element={<AdminDashboard />} />
 </Route>
 </Route>
 </Route>
 </Routes>
 )
}

export default App
