import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';
import { Users, Package, ArrowRightLeft, Clock, AlertTriangle, Banknote, IndianRupee, Receipt, TrendingUp, TrendingDown, RefreshCw, Shield, Wifi, WifiOff, Database, Cloud, HardDrive, Mail, BarChart3, Bell as BellIcon, Server, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function MiniBarChart({ data, width = 340, height = 130 }) {
  if (!data || data.length === 0) return <p className="text-zinc-500 text-sm">No data available</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const gap = 6;
  const barW = Math.max(24, (width - (data.length - 1) * gap) / data.length);
  return (
    <svg width={width} height={height + 36} className="overflow-visible">
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * height);
        const color = COLORS[i % COLORS.length];
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`bar-g-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <rect x={i * (barW + gap)} y={height - barH} width={barW} height={barH} rx={6} fill={`url(#bar-g-${i})`} />
            <text x={i * (barW + gap) + barW / 2} y={height + 18} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={500}>{d.label}</text>
            <text x={i * (barW + gap) + barW / 2} y={height - barH - 6} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontWeight={700}>{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MiniPieChart({ data, size = 150 }) {
  if (!data || data.length === 0) return <p className="text-zinc-500 text-sm">No data available</p>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 12;
  let startAngle = -90;
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const angle = (d.value / total) * 360;
          const endAngle = startAngle + angle;
          const largeArc = angle > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos((Math.PI * startAngle) / 180);
          const y1 = cy + r * Math.sin((Math.PI * startAngle) / 180);
          const x2 = cx + r * Math.cos((Math.PI * endAngle) / 180);
          const y2 = cy + r * Math.sin((Math.PI * endAngle) / 180);
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          startAngle = endAngle;
          return <path key={i} d={path} fill={COLORS[i % COLORS.length]} stroke="#0f172a" strokeWidth={2} />;
        })}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="#0f172a" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#e2e8f0" fontSize={18} fontWeight={700}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={10}>total</text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="capitalize">{d.label}</span>
            <span className="text-zinc-500 font-semibold">({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-blue-400" />
      </div>
      <h3 className="text-[15px] font-bold text-zinc-100">{title}</h3>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const location = useLocation();
  const path = location.pathname;
  let activeTab = 'overview';
  if (path === '/admin/analytics') activeTab = 'analytics';
  else if (path === '/admin/alerts') activeTab = 'alerts';
  else if (path === '/admin/system') activeTab = 'system';
  else if (path === '/admin/accounts') activeTab = 'accounts';

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, alertRes, healthRes, accRes] = await Promise.all([
        api.get('/admin'),
        api.get('/admin/alerts'),
        api.get('/admin/health'),
        api.get('/admin/accounts'),
      ]);
      if (dashRes.data.success) setDashboard(dashRes.data.dashboard);
      if (alertRes.data.success) setAlerts(alertRes.data.alerts);
      if (healthRes.data.success) setHealth(healthRes.data.health);
      if (accRes.data.success) setAccounts(accRes.data.accounts);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm font-medium">Loading admin dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <Card className="max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 text-lg font-semibold mb-2">Something went wrong</p>
        <p className="text-zinc-400 text-sm mb-4">{error}</p>
        <button onClick={fetchAll} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
          Retry
        </button>
      </Card>
    </div>
  );

  const d = dashboard || {};
  const healthStatus = health?.status === 'healthy' ? { label: 'Healthy', color: '#10B981' } : { label: 'Unhealthy', color: '#EF4444' };
  const uptimeMin = health ? Math.floor(health.uptime / 60) : 0;
  const uptimeHr = Math.floor(uptimeMin / 60);

  const kpis = [
    { label: 'Total Users', value: d.totalUsers || 0, icon: Users, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
    { label: 'Total Items', value: d.totalItems || 0, icon: Package, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Active Borrows', value: d.activeBorrows || 0, icon: ArrowRightLeft, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { label: 'Pending Requests', value: d.pendingRequests || 0, icon: Clock, gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
    { label: 'Overdue Items', value: d.overdueItems || 0, icon: AlertTriangle, gradient: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20' },
    { label: 'Active Loans', value: d.activeLoans || 0, icon: Banknote, gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/20' },
    { label: 'Deposits', value: `₹${d.revenue?.totalDepositsPaid || d.totalDepositsPaid || 0}`, icon: TrendingUp, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20' },
    { label: 'Fines', value: `₹${d.revenue?.totalFinesPaid || d.totalFinesPaid || 0}`, icon: Receipt, gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
  ];

  const titles = {
    overview: { title: 'Dashboard Overview', sub: 'Real-time platform metrics & activity' },
    analytics: { title: 'Platform Analytics', sub: 'Charts, trends & category breakdown' },
    alerts: { title: 'Active Alerts', sub: 'Overdue items, unpaid fines & warnings' },
    system: { title: 'System Health', sub: 'Server uptime, memory & AWS services' },
    accounts: { title: 'User Accounts', sub: 'All registered accounts & activity history' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{titles[activeTab]?.title}</h1>
          </div>
          <p className="text-zinc-500 text-sm pl-[52px]">{titles[activeTab]?.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border" style={{ background: `${healthStatus.color}11`, borderColor: `${healthStatus.color}33` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: healthStatus.color, boxShadow: `0 0 8px ${healthStatus.color}` }} />
            <span className="text-xs font-bold" style={{ color: healthStatus.color }}>{healthStatus.label}</span>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 overflow-hidden hover:border-white/[0.12] transition-all duration-300">
                <div className={`absolute -top-3 -right-3 w-16 h-16 rounded-2xl bg-gradient-to-br ${kpi.gradient} opacity-[0.08] blur-md group-hover:opacity-[0.15] transition-opacity`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg ${kpi.shadow} mb-3`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className="text-white text-2xl font-extrabold">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <SectionTitle icon={ArrowRightLeft} title="Recent Borrows" />
              {(d.recentBorrows || []).length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-6">No recent borrows</p>
              ) : (
                <div className="space-y-2">
                  {(d.recentBorrows || []).slice(0, 8).map((b, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={b.item?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.item?.name || 'Item')}&background=1e293b&color=94a3b8&size=80`} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-zinc-200 text-sm font-semibold truncate">{b.item?.name || 'Unknown Item'}</p>
                          <p className="text-zinc-500 text-xs">by {b.borrower?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 ml-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        b.status === 'returned' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        b.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <SectionTitle icon={Banknote} title="Recent Money Loans" />
              {(d.recentLoans || []).length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-6">No recent loans</p>
              ) : (
                <div className="space-y-2">
                  {(d.recentLoans || []).map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                          <IndianRupee className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-zinc-200 text-sm font-semibold">₹{l.amount}</p>
                          <p className="text-zinc-500 text-xs">{l.borrower?.name || '?'} ← {l.lender?.name || '?'}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        l.status === 'repaid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle icon={BarChart3} title="Borrows by Month" />
            <MiniBarChart data={(d.borrowsByMonth || []).map(m => ({ label: m._id?.slice(5) || m.month?.slice(5) || '?', value: m.count }))} width={380} />
          </Card>
          <Card>
            <SectionTitle icon={Package} title="Items by Category" />
            <MiniPieChart data={(d.itemsByCategory || []).map(c => ({ label: c._id || c.category || '?', value: c.count }))} />
          </Card>
          <Card>
            <SectionTitle icon={TrendingUp} title="Platform Summary" />
            <MiniBarChart data={[
              { label: 'Users', value: d.totalUsers || 0 },
              { label: 'Items', value: d.totalItems || 0 },
              { label: 'Borrows', value: d.activeBorrows || 0 },
              { label: 'Loans', value: d.activeLoans || 0 },
            ]} width={380} />
          </Card>
          <Card>
            <SectionTitle icon={IndianRupee} title="Revenue Overview" />
            <MiniBarChart data={[
              { label: 'Deposits', value: d.revenue?.totalDepositsPaid || d.totalDepositsPaid || 0 },
              { label: 'Fines', value: d.revenue?.totalFinesPaid || d.totalFinesPaid || 0 },
            ]} width={380} />
          </Card>
        </div>
      )}

      {/* Alerts */}
      {activeTab === 'alerts' && (
        <Card>
          <SectionTitle icon={BellIcon} title="System Alerts" />
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-emerald-400 text-lg font-bold">All Clear</p>
              <p className="text-zinc-500 text-sm mt-1">No active alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${
                  a.severity === 'critical' || a.count > 0 ? 'bg-red-500/[0.04] border-red-500/10' : 'bg-amber-500/[0.04] border-amber-500/10'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    a.severity === 'critical' || a.count > 0 ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${a.severity === 'critical' || a.count > 0 ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-semibold">{a.title || a.type}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{a.message}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[10px] font-bold uppercase">
                      Count: {a.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Accounts */}
      {activeTab === 'accounts' && (
        <Card className="overflow-hidden !p-0">
          <div className="p-6 pb-4">
            <SectionTitle icon={Users} title={`All Accounts (${accounts.length})`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {['User', 'Contact', 'Role', 'Trust Score', 'Items', 'Borrows', 'Loans', 'Joined'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-zinc-500 text-xs font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, idx) => (
                  <tr key={acc._id} className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={acc.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=1e293b&color=94a3b8&size=80`} alt={acc.name} className="w-9 h-9 rounded-full ring-2 ring-white/10 object-cover" />
                        <span className="text-zinc-100 font-semibold text-sm">{acc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-zinc-300 text-sm">{acc.email}</p>
                      <p className="text-zinc-600 text-xs">{acc.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        acc.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {acc.role === 'admin' && <Shield className="w-3 h-3" />}
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400">⭐</span>
                        <span className="text-zinc-200 text-sm font-bold">{acc.averageRating > 0 ? acc.averageRating.toFixed(1) : 'New'}</span>
                        <span className="text-zinc-600 text-xs">({acc.totalRatings})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-bold text-sm">{acc.stats?.items || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sky-400 font-bold text-sm">{acc.stats?.borrows || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-violet-400 font-bold text-sm">{acc.stats?.loansLent || 0}</span>
                      <span className="text-zinc-600 mx-1">/</span>
                      <span className="text-pink-400 font-bold text-sm">{acc.stats?.loansBorrowed || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-500 text-sm">{new Date(acc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* System Health */}
      {activeTab === 'system' && health && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle icon={Activity} title="Server Status" />
            <div className="space-y-3">
              {[
                { label: 'Status', value: health.status, icon: Wifi, color: healthStatus.color },
                { label: 'Uptime', value: `${uptimeHr}h ${uptimeMin % 60}m`, icon: Clock, color: '#60a5fa' },
                { label: 'MongoDB', value: health.mongoStatus === 1 ? 'Connected' : 'Disconnected', icon: Database, color: health.mongoStatus === 1 ? '#10B981' : '#EF4444' },
                { label: 'AWS', value: health.awsConfigured ? 'Configured' : 'Not Configured', icon: Cloud, color: health.awsConfigured ? '#10B981' : '#F59E0B' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={HardDrive} title="Memory Usage" />
            <div className="space-y-3">
              {health.memoryUsage && [
                { label: 'Heap Used', value: `${(health.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`, pct: Math.round((health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100) },
                { label: 'Heap Total', value: `${(health.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`, pct: 100 },
                { label: 'RSS', value: `${(health.memoryUsage.rss / 1024 / 1024).toFixed(1)} MB`, pct: Math.min(100, Math.round((health.memoryUsage.rss / 512 / 1024 / 1024) * 100)) },
                { label: 'External', value: `${(health.memoryUsage.external / 1024 / 1024).toFixed(1)} MB`, pct: 20 },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400 text-sm font-medium">{item.label}</span>
                    <span className="text-blue-400 text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <SectionTitle icon={Cloud} title="AWS Services" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'S3 Storage', icon: HardDrive, active: health.awsConfigured },
                { name: 'SES Email', icon: Mail, active: health.awsConfigured },
                { name: 'CloudWatch', icon: BarChart3, active: health.awsConfigured },
                { name: 'SNS Push', icon: BellIcon, active: health.awsConfigured },
              ].map((svc, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  svc.active ? 'bg-emerald-500/[0.04] border-emerald-500/10 hover:bg-emerald-500/[0.06]' : 'bg-amber-500/[0.04] border-amber-500/10'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    svc.active ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    <svc.icon className={`w-5 h-5 ${svc.active ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-semibold">{svc.name}</p>
                    <p className={`text-xs font-bold mt-0.5 ${svc.active ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {svc.active ? '● Active' : '○ Not Configured'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
