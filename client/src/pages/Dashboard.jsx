import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import {
  Package,
  Repeat,
  Inbox,
  Bell,
  Wallet,
  Search,
  Plus,
  Banknote,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myItemsCount: 0,
    activeBorrowsCount: 0,
    incomingRequestsCount: 0,
    unreadAlertsCount: 0
  });
  
  const [financials, setFinancials] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          itemsMineRes,
          borrowsMineRes,
          borrowsIncomingRes,
          notificationsRes,
          recentItemsRes,
          financialsRes
        ] = await Promise.all([
          api.get('/items/mine').catch(() => ({ data: { count: 0 } })),
          api.get('/borrows/mine').catch(() => ({ data: { borrows: [] } })),
          api.get('/borrows/incoming').catch(() => ({ data: { count: 0 } })),
          api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
          api.get('/items?sort=-createdAt&limit=6').catch(() => ({ data: { items: [] } })),
          api.get('/borrows/financial').catch(() => ({ data: { summary: null } }))
        ]);
        
        setStats({
          myItemsCount: itemsMineRes.data.count || 0,
          activeBorrowsCount: borrowsMineRes.data.borrows ? borrowsMineRes.data.borrows.filter((b) => b.status === 'active').length : 0,
          incomingRequestsCount: borrowsIncomingRes.data.count || 0,
          unreadAlertsCount: notificationsRes.data.count || 0
        });

        if (recentItemsRes.data && recentItemsRes.data.items) {
          setRecentItems(recentItemsRes.data.items);
        }
        
        if (borrowsMineRes.data && borrowsMineRes.data.borrows) {
          setActiveBorrows(borrowsMineRes.data.borrows.filter((b) => b.status === 'active'));
        }

        setFinancials(financialsRes.data.summary);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const borrowerDeposits = financials?.borrower?.totalDepositsPaid || 0;
  const ownerDeposits = financials?.owner?.totalDepositsCollected || 0;
  const financialBalance = ownerDeposits - borrowerDeposits;

  return (
    <div className="pb-10 max-w-7xl mx-auto space-y-6">
      
      {/* Welcome Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in-up stagger-1">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1400&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/90 via-[#09090b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-12">
          <div>
            <p className="text-zinc-300 text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3 drop-shadow-md">
              Welcome back, <span className="text-cyan-400">{user?.name?.split(' ')[0] || 'User'}</span>! 🚀
            </h1>
            <p className="text-zinc-200 text-sm max-w-lg drop-shadow leading-relaxed">
              Manage your items, track borrows, and see what's new in the campus community.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link to="/browse" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-cyan-500/25 px-5 py-2.5 rounded-xl text-sm font-semibold">
              <Search className="w-5 h-5" />
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAIN COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
            <div className="glass-card bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-indigo-500/50 transition-colors shadow-lg">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-white mb-1 drop-shadow-sm">{stats.myItemsCount}</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">My Items</p>
            </div>
            
            <div className="glass-card bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-lg">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-white mb-1 drop-shadow-sm">{stats.activeBorrowsCount}</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Borrows</p>
            </div>
            
            <div className="glass-card bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition-colors shadow-lg">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-white mb-1 drop-shadow-sm">{stats.incomingRequestsCount}</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Requests</p>
            </div>
            
            <div className="glass-card bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-rose-500/50 transition-colors shadow-lg">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Bell className="w-6 h-6" />
                {stats.unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-zinc-900 animate-pulse"></span>
                )}
              </div>
              <h3 className="text-3xl font-black text-white mb-1 drop-shadow-sm">{stats.unreadAlertsCount}</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Alerts</p>
            </div>
          </div>

          {/* Recently Added Items */}
          <div className="glass-card bg-zinc-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 animate-fade-in-up stagger-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Recently Added
              </h2>
              <Link to="/browse" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium bg-cyan-400/10 px-3 py-1.5 rounded-lg transition-colors">
                View Catalog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentItems.length > 0 ? (
                recentItems.map(item => (
                  <Link to={`/items/${item._id}`} key={item._id} className="glass-card bg-zinc-800/40 hover:bg-zinc-800/80 border border-white/5 rounded-2xl overflow-hidden block group transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/30">
                    <div className="h-40 bg-zinc-900 relative">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover relative z-10 opacity-90 group-hover:opacity-100 transition-opacity" 
                          onError={(e) => { 
                            e.target.style.display = 'none'; 
                            if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'; 
                          }}
                        />
                      ) : null}
                      <div 
                        className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex justify-center items-center"
                        style={{ display: item.imageUrl ? 'none' : 'flex' }}
                      >
                        <Package className="w-10 h-10 text-indigo-400/50" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80 z-20"></div>
                      {item.category && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 z-30">
                          {item.category}
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3 z-30">
                        <span className="text-emerald-400 font-bold text-sm bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">₹{item.depositAmount || 0}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-zinc-100 truncate group-hover:text-cyan-400 transition-colors">{item.name}</h3>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No items found in catalog yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions */}
          <div className="glass-card bg-zinc-900/60 border border-white/5 rounded-3xl p-6 animate-fade-in-up stagger-3">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/my-items" className="bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all group">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-zinc-300">List Item</span>
              </Link>
              <Link to="/money-loans" className="bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                  <Banknote className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-zinc-300">Loans</span>
              </Link>
              <Link to="/fines" className="bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-rose-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all group">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:scale-110 transition-all">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-xs font-medium text-zinc-300">Fines</span>
              </Link>
              <Link to="/notifications" className="bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all group relative">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-zinc-300">Alerts</span>
                {stats.unreadAlertsCount > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-zinc-800"></span>
                )}
              </Link>
            </div>
          </div>

          {/* Wallet / Financial Summary */}
          <div className="glass-card bg-zinc-900/60 border border-white/5 rounded-3xl overflow-hidden animate-fade-in-up stagger-4 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Your Wallet
              </h2>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Net Balance</p>
                <p className={`text-xl font-bold ${financialBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {financialBalance >= 0 ? '+' : '-'}₹{Math.abs(financialBalance)}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-5 relative z-10">
              <div>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> As Borrower</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Deposits Paid</span><span className="text-zinc-300 font-medium">₹{borrowerDeposits}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Fines Paid</span><span className="text-zinc-300 font-medium">₹{financials?.borrower?.totalFinesPaid || 0}</span></div>
                </div>
              </div>
              <div className="h-px w-full bg-white/5"></div>
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> As Lender</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Deposits Held</span><span className="text-zinc-300 font-medium">₹{ownerDeposits}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Fines Earned</span><span className="text-emerald-400 font-medium">₹{financials?.owner?.totalFinesCollected || 0}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Borrows Mini */}
          <div className="glass-card bg-zinc-900/60 border border-white/5 rounded-3xl p-6 animate-fade-in-up stagger-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Active Borrows
              </h2>
              <Link to="/my-borrows" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">View All</Link>
            </div>
            
            <div className="space-y-3">
              {activeBorrows.length > 0 ? (
                activeBorrows.slice(0, 3).map(borrow => (
                  <div key={borrow._id} className="bg-zinc-800/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-700/50 overflow-hidden shrink-0">
                      {borrow.item?.imageUrl ? (
                        <img src={borrow.item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">{borrow.item?.name || 'Unknown Item'}</p>
                      <p className="text-xs text-zinc-500 truncate">From {borrow.owner?.name?.split(' ')[0]}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm bg-zinc-800/30 rounded-xl border border-white/5 border-dashed">
                  No active borrows
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
