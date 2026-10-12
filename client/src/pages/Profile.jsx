import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Star, Package, Repeat, Inbox, 
  IndianRupee, Edit3, Lock, Bell, ChevronRight,
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
    phone: user?.phone || ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [failedPhoto, setFailedPhoto] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [statsError, setStatsError] = useState('');

  const fetchProfileData = useCallback(async () => {
    const endpoints = [
      ['items', '/items/mine'],
      ['borrow history', '/borrows/mine'],
      ['incoming requests', '/borrows/incoming'],
      ['financial summary', '/borrows/financial'],
    ];
    const results = await Promise.allSettled(
      endpoints.map(([, endpoint]) => api.get(endpoint))
    );
    const [itemsRes, borrowsRes, incomingRes, finRes] = results;
    const failedEndpoints = results.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [];
      console.error(`Could not load profile ${endpoints[index][0]}:`, result.reason);
      return [endpoints[index][0]];
    });

    setStats({
      items: itemsRes.status === 'fulfilled' ? itemsRes.value.data?.count ?? 0 : null,
      borrows: borrowsRes.status === 'fulfilled' ? borrowsRes.value.data?.count ?? 0 : null,
      requests: incomingRes.status === 'fulfilled' ? incomingRes.value.data?.count ?? 0 : null,
      financial: finRes.status === 'fulfilled' ? finRes.value.data?.summary ?? null : null,
    });
    setStatsError(
      failedEndpoints.length
        ? `Could not load ${failedEndpoints.join(', ')}. Check your connection and retry.`
        : ''
    );
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    if (user) {
      setFormData({ 
        name: user.name, 
        phone: user.phone || ''
      });
      fetchProfileData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchProfileData]);

  const handleInputChange = (e) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Choose an image file.' });
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose an image smaller than 5 MB.' });
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
    setMessage(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const profileData = photoFile ? new FormData() : {
        name: formData.name,
        phone: formData.phone,
      };
      if (photoFile) {
        profileData.append('name', formData.name);
        profileData.append('phone', formData.phone);
        profileData.append('image', photoFile);
      }
      const result = await updateUser(profileData);
      if (result && result.success) {
        setPhotoFile(null);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update profile' });
      }
    } catch {
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

  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
  const joinDate = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Unknown';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const photoSource = photoPreview || user?.profilePhoto || '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-12">
      {/* Profile Hero Card */}
      <div className="glass-card overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 relative">
        {/* Banner */}
        <div aria-hidden="true" className="profile-banner-abstract h-40 sm:h-52 relative overflow-hidden" />

        {/* Content */}
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 relative z-10 mb-6">
            <div className="relative h-28 w-28 shrink-0">
              {photoSource && failedPhoto !== photoSource ? (
                <img
                  src={photoSource}
                  alt={user?.name ? `${user.name}'s profile` : 'Profile'}
                  onError={() => setFailedPhoto(photoSource)}
                  className="h-full w-full rounded-2xl border-4 border-zinc-900 object-cover shadow-2xl"
                />
              ) : (
                <div role="img" aria-label={`Profile initials: ${initial}`} className="flex h-full w-full items-center justify-center rounded-2xl border-4 border-zinc-900 bg-gradient-to-br from-red-500 to-orange-500 text-4xl font-bold text-white shadow-2xl">
                  {initial}
                </div>
              )}
            </div>
            <div className="mb-2 min-w-0 w-full flex-1 text-center sm:text-left">
              <h1 className="mb-1 break-words text-3xl font-bold text-white">{user?.name || 'Your profile'}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-zinc-400 text-sm">
                <div className="flex min-w-0 max-w-full items-center gap-1.5 break-all">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{user?.email || 'Email unavailable'}</span>
                </div>
                {user?.phone && (
                  <div className="flex min-w-0 max-w-full items-center gap-1.5 break-words">
                    <Phone className="h-4 w-4 shrink-0" />
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
      {statsError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
          <span>{statsError}</span>
          <button
            type="button"
            onClick={() => fetchProfileData()}
            className="font-semibold text-amber-200 underline underline-offset-4 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}
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
            <p className="text-2xl font-bold text-white">{stats.items ?? '—'}</p>
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
            <p className="text-2xl font-bold text-white">{stats.borrows ?? '—'}</p>
            <p className="text-xs text-zinc-400 mt-1">My Borrows</p>
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
            <p className="text-2xl font-bold text-white">{stats.requests ?? '—'}</p>
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
                      <p className="text-xl font-bold text-emerald-400">
                        {stats.financial ? `₹${stats.financial.borrower?.totalDepositsPaid ?? 0}` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/5"></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Fines Paid</p>
                      <p className="text-xl font-bold text-red-400">
                        {stats.financial ? `₹${stats.financial.borrower?.totalFinesPaid ?? 0}` : '—'}
                      </p>
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
                      <p className="text-xl font-bold text-emerald-400">
                        {stats.financial ? `₹${stats.financial.owner?.totalDepositsCollected ?? 0}` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/5"></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Fines Collected</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {stats.financial ? `₹${stats.financial.owner?.totalFinesCollected ?? 0}` : '—'}
                      </p>
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
                  <label htmlFor="profile-name" className="text-sm font-medium text-zinc-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="profile-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      autoComplete="name"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-phone" className="text-sm font-medium text-zinc-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="tel" 
                      id="profile-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      autoComplete="tel"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-photo" className="text-sm font-medium text-zinc-400 ml-1">Profile photo</label>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <label htmlFor="profile-photo" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-red-400/50 hover:bg-white/[0.04] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-400">
                      <User className="h-4 w-4 text-red-400" />
                      Choose photo
                    </label>
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                    <span className="text-xs text-zinc-400">
                      {photoFile ? `${photoFile.name} selected` : 'JPG, PNG or WebP · up to 5 MB'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
          <section className="glass-card rounded-3xl border border-white/5 bg-zinc-900/60 p-6 animate-scale-in">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Mail className="h-5 w-5 text-red-400" />
              Help &amp; support
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-zinc-400">
              Need help with your account, a return, or a payment? Get in touch.
            </p>
            <div className="space-y-3">
              <a href="tel:8498970129" className="flex items-center gap-3 text-sm font-medium text-zinc-200 transition hover:text-white">
                <Phone className="h-4 w-4 shrink-0 text-red-400" />
                8498970129
              </a>
              <a href="mailto:saipranithreddyvaka@gmail.com" className="flex min-w-0 items-start gap-3 text-sm font-medium text-zinc-200 transition hover:text-white">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span className="break-all">saipranithreddyvaka@gmail.com</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
