import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Star, Package, Repeat, Inbox, 
  IndianRupee, ShieldCheck, Edit3, Lock, Bell, ChevronRight, 
  CheckCircle2, AlertCircle, Loader2, Coins, Settings
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    items: 0,
    borrows: 0,
    requests: 0,
    financial: null
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    profilePhoto: user?.profilePhoto || ''
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [itemsRes, borrowsRes, incomingRes, finRes] = await Promise.all([
          api.get('/items/mine').catch(() => ({ data: { count: 0 } })),
          api.get('/borrows/mine').catch(() => ({ data: { count: 0 } })),
          api.get('/borrows/incoming').catch(() => ({ data: { count: 0 } })),
          api.get('/borrows/financial').catch(() => ({ data: { summary: null } }))
        ]);

        setStats({
          items: itemsRes.data?.count || 0,
          borrows: borrowsRes.data?.count || 0,
          requests: incomingRes.data?.count || 0,
          financial: finRes.data?.summary || {
            totalDepositsPaid: 0,
            totalFinesPaid: 0,
            totalDepositsCollected: 0,
            totalFinesCollected: 0
          }
        });
      } catch (error) {
        console.error("Error fetching profile stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      setFormData({ 
        name: user.name, 
        phone: user.phone || '',
        profilePhoto: user.profilePhoto || '' 
      });
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const result = await updateUser(formData);
      if (result && result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Unknown';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-12">
      {/* Profile Hero Card */}
      <div className="glass-card overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 relative">
        {/* Banner */}
        <div 
          className="h-52 relative overflow-hidden flex items-start justify-end p-4 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1400&auto=format&fit=crop")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#18181b]/95" />
          
          <div className="relative z-10 flex items-center gap-2 bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl mt-2 mr-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-100 tracking-wide uppercase">Verified Student</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 relative z-10 mb-6">
            <div className="relative group">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-zinc-900 shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-2xl border-4 border-zinc-900 shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-zinc-900 animate-pulse"></div>
            </div>
            <div className="flex-1 text-center sm:text-left mb-2">
              <h1 className="text-3xl font-bold text-white mb-1">{user?.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-zinc-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-full text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {joinDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-scale-in" style={{animationDelay: '100ms'}}>
        <div className="stat-card glass-card rounded-2xl p-5 border border-white/5 bg-zinc-900/60 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white flex items-baseline gap-1">
              {user?.averageRating ? user.averageRating.toFixed(1) : '0.0'}
              <span className="text-sm font-normal text-zinc-500">/ 5.0</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">{user?.totalRatings || 0} reviews</p>
          </div>
        </div>
        
        <Link to="/my-items" className="stat-card glass-card rounded-2xl p-5 border border-white/5 bg-zinc-900/60 flex flex-col gap-3 transition-colors hover:bg-zinc-800/60">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.items}</p>
            <p className="text-xs text-zinc-400 mt-1">Items Listed</p>
          </div>
        </Link>
        
        <Link to="/my-borrows" className="stat-card glass-card rounded-2xl p-5 border border-white/5 bg-zinc-900/60 flex flex-col gap-3 transition-colors hover:bg-zinc-800/60">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
              <Repeat className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.borrows}</p>
            <p className="text-xs text-zinc-400 mt-1">Active Borrows</p>
          </div>
        </Link>
        
        <Link to="/requests" className="stat-card glass-card rounded-2xl p-5 border border-white/5 bg-zinc-900/60 flex flex-col gap-3 transition-colors hover:bg-zinc-800/60">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
              <Inbox className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.requests}</p>
            <p className="text-xs text-zinc-400 mt-1">Incoming Requests</p>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Financials & Edit Profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Financial Overview Section */}
          <div className="glass-card rounded-3xl border border-white/5 bg-zinc-900/60 p-6 animate-scale-in" style={{animationDelay: '200ms'}}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-400" />
              Financial Overview
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Borrowing Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Deposits Paid</p>
                      <p className="text-xl font-bold text-emerald-400">₹{stats.financial?.borrower?.totalDepositsPaid || 0}</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/5"></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Fines Paid</p>
                      <p className="text-xl font-bold text-red-400">₹{stats.financial?.borrower?.totalFinesPaid || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Lending Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Deposits Collected</p>
                      <p className="text-xl font-bold text-emerald-400">₹{stats.financial?.owner?.totalDepositsCollected || 0}</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/5"></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Fines Collected</p>
                      <p className="text-xl font-bold text-emerald-400">₹{stats.financial?.owner?.totalFinesCollected || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="glass-card rounded-3xl border border-white/5 bg-zinc-900/60 p-6 animate-scale-in" style={{animationDelay: '300ms'}}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Profile
            </h2>
            
            {message && (
              <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-600" />
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-11 text-zinc-500 cursor-not-allowed focus:outline-none"
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-zinc-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400 ml-1">Profile Photo URL</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="url" 
                      name="profilePhoto"
                      value={formData.profilePhoto}
                      onChange={handleInputChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Actions */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl border border-white/5 bg-zinc-900/60 p-6 animate-scale-in" style={{animationDelay: '400ms'}}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-zinc-400" />
              Quick Links
            </h2>
            <div className="flex flex-col gap-2">
              <Link to="/my-items" className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-3 text-zinc-300 group-hover:text-white transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-800 text-blue-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">My Items</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>
              
              <Link to="/my-borrows" className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-3 text-zinc-300 group-hover:text-white transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">My Borrows</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>
              
              <Link to="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-3 text-zinc-300 group-hover:text-white transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>

              <Link to="/money-loans" className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-3 text-zinc-300 group-hover:text-white transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-800 text-indigo-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">Money Loans</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
