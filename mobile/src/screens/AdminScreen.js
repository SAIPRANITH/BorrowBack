import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import api from '../api/api';

const formatMoney = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}16` }]}>
      <Ionicons name={icon} size={19} color={color} />
    </View>
    <Text style={styles.statValue}>{value ?? 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionHeading = ({ title, detail }) => (
  <View style={styles.sectionHeading}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
  </View>
);

const MetricBars = ({ title, rows, color }) => {
  const maxValue = Math.max(...rows.map((row) => Number(row.value) || 0), 1);
  return (
    <View style={styles.card}>
      <SectionHeading title={title} />
      {rows.length ? rows.map((row) => {
        const value = Number(row.value) || 0;
        return (
          <View key={row.label} style={styles.metricRow}>
            <View style={styles.metricLabels}>
              <Text style={styles.metricLabel}>{row.label}</Text>
              <Text style={styles.metricValue}>{value.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${Math.max(value > 0 ? 4 : 0, (value / maxValue) * 100)}%`, backgroundColor: row.color || color }]} />
            </View>
          </View>
        );
      }) : <Text style={styles.emptyText}>No data available.</Text>}
    </View>
  );
};

const AdminScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [section, setSection] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountsError, setAccountsError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setError('');
    try {
      const [dashboardResponse, alertsResponse, healthResponse] = await Promise.all([
        api.get('/admin'),
        api.get('/admin/alerts'),
        api.get('/admin/health'),
      ]);
      if (!dashboardResponse.data.success || !alertsResponse.data.success || !healthResponse.data.success) {
        throw new Error('The server did not return complete admin data.');
      }
      setDashboard(dashboardResponse.data.dashboard);
      setAlerts(alertsResponse.data.alerts || []);
      setHealth(healthResponse.data.health);
    } catch (requestError) {
      console.error('Admin dashboard request failed:', requestError);
      setError(requestError.response?.data?.message || requestError.message || 'Could not load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchAccounts = useCallback(async () => {
    setAccountsError('');
    setAccountsLoading(true);
    try {
      const response = await api.get('/admin/accounts', { timeout: 30000 });
      if (!response.data.success || !Array.isArray(response.data.accounts)) {
        throw new Error('The server returned an invalid account list.');
      }
      setAccounts(response.data.accounts);
    } catch (requestError) {
      console.error('Admin account request failed:', requestError);
      setAccountsError(requestError.response?.data?.message || requestError.message || 'Could not load accounts.');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const selectSection = (nextSection) => {
    setSection(nextSection);
    if (nextSection === 'accounts' && accounts.length === 0 && !accountsLoading) {
      fetchAccounts();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (section === 'accounts') {
      fetchAccounts().finally(() => setRefreshing(false));
    } else {
      fetchDashboard();
    }
  }, [fetchAccounts, fetchDashboard, section]);

  const filteredAccounts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) =>
      `${account.name || ''} ${account.email || ''} ${account.role || ''}`.toLowerCase().includes(query)
    );
  }, [accounts, searchText]);

  const confirmLogout = () => {
    Alert.alert('Sign out of admin?', 'You will need to sign in again to return to the admin panel.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const renderAccount = ({ item }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountAvatar}>
        <Text style={styles.accountInitial}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.accountMain}>
        <View style={styles.accountNameRow}>
          <Text style={styles.accountName} numberOfLines={1}>{item.name || 'Unnamed user'}</Text>
          <Text style={[styles.roleBadge, item.role === 'admin' && styles.adminRole]}>
            {item.role || 'user'}
          </Text>
        </View>
        <Text style={styles.accountEmail} numberOfLines={1}>{item.email || 'No email address'}</Text>
        <Text style={styles.accountStats}>
          {item.stats?.items || 0} items  ·  {item.stats?.borrows || 0} borrows  ·  {(item.stats?.loansLent || 0) + (item.stats?.loansBorrowed || 0)} loans
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Loading admin workspace...</Text>
      </View>
    );
  }

  const data = dashboard || {};
  const mongoReady = health?.mongoStatus === 1;
  const sectionTitles = {
    overview: 'Admin Panel',
    analytics: 'Platform Analytics',
    alerts: 'System Alerts',
    system: 'System Health',
    accounts: 'User Accounts',
  };
  const recentMonths = (data.borrowsByMonth || []).map((month) => ({
    label: month._id?.slice(5) || month.month?.slice(5) || 'Unknown',
    value: month.count || 0,
  }));
  const categoryStats = (data.itemsByCategory || []).map((category) => ({
    label: category._id || category.category || 'Other',
    value: category.count || 0,
  }));
  const memory = health?.memoryUsage || {};
  const formatMb = (bytes) => `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <View style={styles.adminPill}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.secondary} />
            <Text style={styles.adminPillText}>ADMIN WORKSPACE</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh admin data"
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{sectionTitles[section]}</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.name || 'Administrator'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
          {[
            ['overview', 'grid-outline', 'Overview'],
            ['analytics', 'bar-chart-outline', 'Analytics'],
            ['alerts', 'notifications-outline', 'Alerts'],
            ['system', 'pulse-outline', 'System'],
            ['accounts', 'people-outline', 'Accounts'],
          ].map(([key, icon, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.sectionTab, section === key && styles.sectionTabActive]}
              onPress={() => selectSection(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: section === key }}
            >
              <Ionicons name={icon} size={16} color={section === key ? theme.colors.surface : theme.colors.textSecondary} />
              <Text style={[styles.sectionTabText, section === key && styles.sectionTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {section === 'accounts' ? (
        <FlatList
          data={filteredAccounts}
          keyExtractor={(item) => item._id}
          renderItem={renderAccount}
          contentContainerStyle={styles.accountList}
          refreshControl={<RefreshControl refreshing={refreshing || accountsLoading} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
          ListHeaderComponent={
            <View>
              <SectionHeading title="User Accounts" detail={`${accounts.length} registered account${accounts.length === 1 ? '' : 's'}`} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search name, email, or role"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                style={styles.searchInput}
                accessibilityLabel="Search user accounts"
              />
              {accountsError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{accountsError}</Text>
                  <TouchableOpacity onPress={fetchAccounts} style={styles.retryButton}>
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            accountsLoading
              ? <ActivityIndicator style={styles.listLoader} color={theme.colors.secondary} />
              : !accountsError
                ? <Text style={styles.emptyText}>{searchText ? 'No accounts match that search.' : 'No accounts found.'}</Text>
                : null
          }
          ListFooterComponent={<TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}><Text style={styles.logoutButtonText}>Sign out</Text></TouchableOpacity>}
        />
      ) : error ? (
        <ScrollView
          contentContainerStyle={styles.errorContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
        >
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Admin data unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashboard} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : section === 'analytics' ? (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}>
          <SectionHeading title="Platform activity" detail="A snapshot of BorrowBack usage" />
          <View style={styles.statGrid}>
            <StatCard label="Total users" value={data.totalUsers} icon="people-outline" color="#557c91" />
            <StatCard label="Listed items" value={data.totalItems} icon="cube-outline" color={theme.colors.secondary} />
            <StatCard label="Active borrows" value={data.activeBorrows} icon="repeat-outline" color={theme.colors.accent} />
            <StatCard label="Active loans" value={data.activeLoans} icon="cash-outline" color={theme.colors.secondary} />
          </View>
          <MetricBars title="Borrows by month" rows={recentMonths} color="#557c91" />
          <MetricBars title="Items by category" rows={categoryStats} color={theme.colors.secondary} />
          <MetricBars
            title="Recorded payments"
            rows={[
              { label: 'Deposits', value: data.revenue?.totalDepositsPaid || data.totalDepositsPaid || 0, color: theme.colors.success },
              { label: 'Fines', value: data.revenue?.totalFinesPaid || data.totalFinesPaid || 0, color: theme.colors.error },
            ]}
            color={theme.colors.primary}
          />
        </ScrollView>
      ) : section === 'alerts' ? (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}>
          <View style={styles.card}>
            <SectionHeading title="Active alerts" detail="Operational signals that may need attention" />
            {alerts.length ? alerts.map((alert) => {
              const warning = alert.severity === 'warning' || alert.severity === 'critical' || alert.count > 0;
              return (
                <View key={alert.type} style={[styles.alertCard, warning && styles.alertCardWarning]}>
                  <View style={[styles.alertIcon, warning && styles.alertIconWarning]}>
                    <Ionicons name={warning ? 'warning-outline' : 'checkmark-circle-outline'} size={20} color={warning ? theme.colors.accent : theme.colors.success} />
                  </View>
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>{alert.title || alert.type}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertCount}>Count: {alert.count ?? 0}</Text>
                  </View>
                </View>
              );
            }) : (
              <View style={styles.clearAlerts}>
                <Ionicons name="checkmark-circle" size={34} color={theme.colors.success} />
                <Text style={styles.clearAlertsTitle}>All clear</Text>
                <Text style={styles.alertMessage}>No active alerts at this time.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : section === 'system' ? (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}>
          <View style={styles.card}>
            <SectionHeading title="Server status" />
            {[
              { label: 'API status', value: health?.status === 'healthy' ? 'Healthy' : 'Needs attention', ok: health?.status === 'healthy', icon: 'pulse-outline' },
              { label: 'Database', value: mongoReady ? 'Connected' : 'Unavailable', ok: mongoReady, icon: 'server-outline' },
              { label: 'AWS services', value: health?.awsConfigured ? 'Configured' : 'Not configured', ok: health?.awsConfigured, icon: 'cloud-outline' },
              { label: 'Uptime', value: `${Math.floor((health?.uptime || 0) / 3600)}h ${Math.floor(((health?.uptime || 0) % 3600) / 60)}m`, ok: true, icon: 'time-outline' },
            ].map((service) => (
              <View key={service.label} style={styles.serviceRow}>
                <View style={styles.serviceIcon}><Ionicons name={service.icon} size={18} color={theme.colors.primary} /></View>
                <Text style={styles.healthLabel}>{service.label}</Text>
                <Text style={[styles.healthValue, { color: service.ok ? theme.colors.success : theme.colors.accent }]}>{service.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <SectionHeading title="Memory usage" detail="Current API process" />
            {[
              { label: 'Heap used', bytes: memory.heapUsed, total: memory.heapTotal },
              { label: 'Heap total', bytes: memory.heapTotal, total: memory.heapTotal },
              { label: 'RSS', bytes: memory.rss, total: 512 * 1024 * 1024 },
              { label: 'External', bytes: memory.external, total: memory.external },
            ].map((metric) => {
              const percent = metric.total > 0 ? Math.min(100, (metric.bytes / metric.total) * 100) : 0;
              return (
                <View key={metric.label} style={styles.memoryMetric}>
                  <View style={styles.metricLabels}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{formatMb(metric.bytes)}</Text>
                  </View>
                  <View style={styles.metricTrack}><View style={[styles.metricFill, { width: `${percent}%`, backgroundColor: theme.colors.secondary }]} /></View>
                </View>
              );
            })}
          </View>
          <View style={styles.card}>
            <SectionHeading title="AWS service readiness" />
            {['S3 Storage', 'SES Email', 'CloudWatch', 'SNS Push'].map((service) => (
              <View key={service} style={styles.serviceRow}>
                <View style={styles.serviceIcon}><Ionicons name="cloud-outline" size={18} color={theme.colors.secondary} /></View>
                <Text style={styles.healthLabel}>{service}</Text>
                <Text style={[styles.healthValue, { color: health?.awsConfigured ? theme.colors.success : theme.colors.accent }]}>
                  {health?.awsConfigured ? 'Configured' : 'Not configured'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
        >
          <SectionHeading title="System overview" detail="Live totals across BorrowBack" />
          <View style={styles.statGrid}>
            <StatCard label="Users" value={data.totalUsers} icon="people-outline" color="#557c91" />
            <StatCard label="Items" value={data.totalItems} icon="cube-outline" color={theme.colors.secondary} />
            <StatCard label="Active borrows" value={data.activeBorrows} icon="repeat-outline" color={theme.colors.accent} />
            <StatCard label="Pending requests" value={data.pendingRequests} icon="time-outline" color={theme.colors.noticeRed} />
            <StatCard label="Overdue items" value={data.overdueItems} icon="alert-circle-outline" color={theme.colors.error} />
            <StatCard label="Active loans" value={data.activeLoans} icon="cash-outline" color={theme.colors.secondary} />
          </View>

          <View style={styles.card}>
            <SectionHeading title="Money overview" detail={`${data.totalLoans || 0} peer-loan records`} />
            <View style={styles.moneyRow}>
              <View style={styles.moneyIcon}><Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} /></View>
              <Text style={styles.moneyLabel}>Deposits recorded</Text>
              <Text style={styles.moneyValue}>{formatMoney(data.revenue?.totalDepositsPaid)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.moneyRow}>
              <View style={[styles.moneyIcon, styles.fineIcon]}><Ionicons name="receipt-outline" size={20} color={theme.colors.error} /></View>
              <Text style={styles.moneyLabel}>Fines recorded</Text>
              <Text style={styles.moneyValue}>{formatMoney(data.revenue?.totalFinesPaid)}</Text>
            </View>
            <Text style={styles.disclaimer}>Totals reflect records in BorrowBack; this app does not process or transfer money.</Text>
          </View>

          <View style={styles.card}>
            <SectionHeading title="Service health" />
            <View style={styles.healthRow}>
              <View style={[styles.healthDot, { backgroundColor: health?.status === 'healthy' ? theme.colors.success : theme.colors.error }]} />
              <Text style={styles.healthLabel}>API</Text>
              <Text style={[styles.healthValue, { color: health?.status === 'healthy' ? theme.colors.success : theme.colors.error }]}>
                {health?.status === 'healthy' ? 'Healthy' : 'Needs attention'}
              </Text>
            </View>
            <View style={styles.healthRow}>
              <View style={[styles.healthDot, { backgroundColor: mongoReady ? theme.colors.success : theme.colors.error }]} />
              <Text style={styles.healthLabel}>Database</Text>
              <Text style={[styles.healthValue, { color: mongoReady ? theme.colors.success : theme.colors.error }]}>
                {mongoReady ? 'Connected' : 'Unavailable'}
              </Text>
            </View>
            <Text style={styles.healthFootnote}>
              Uptime: {Math.floor((health?.uptime || 0) / 3600)}h {Math.floor(((health?.uptime || 0) % 3600) / 60)}m
            </Text>
          </View>

          <View style={styles.card}>
            <SectionHeading title="Alerts" detail="Current operational signals" />
            {alerts.length ? alerts.map((alert) => (
              <View key={alert.type} style={styles.alertRow}>
                <Ionicons
                  name={alert.severity === 'warning' ? 'warning-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={alert.severity === 'warning' ? theme.colors.accent : theme.colors.success}
                />
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>No active alerts.</Text>}
          </View>

          {data.recentLoans?.length ? (
            <View style={styles.card}>
              <SectionHeading title="Recent peer loans" />
              {data.recentLoans.map((loan) => (
                <View key={loan._id} style={styles.activityRow}>
                  <View style={styles.activityIcon}><Ionicons name="cash-outline" size={18} color={theme.colors.secondary} /></View>
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {loan.borrower?.name || 'Borrower'} → {loan.lender?.name || 'Lender'}
                    </Text>
                    <Text style={styles.activitySub}>{loan.status} · {loan.purpose || 'No purpose provided'}</Text>
                  </View>
                  <Text style={styles.activityAmount}>{formatMoney(loan.amount)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.textSecondary, marginTop: 12, fontSize: 14 },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${theme.colors.secondary}12`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  adminPillText: { color: theme.colors.secondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  refreshButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 29, fontWeight: '800', color: theme.colors.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  sectionTabs: { flexDirection: 'row', marginTop: 18, gap: 8, paddingRight: 8 },
  sectionTab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.colors.background },
  sectionTabActive: { backgroundColor: theme.colors.primary },
  sectionTabText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  sectionTabTextActive: { color: theme.colors.surface },
  content: { padding: 16, paddingBottom: 28, flexGrow: 1 },
  sectionHeading: { marginBottom: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  sectionDetail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
  statCard: {
    width: '48.5%',
    minHeight: 116,
    backgroundColor: theme.colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 23, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginTop: 12 },
  moneyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  moneyIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: `${theme.colors.success}15`, alignItems: 'center', justifyContent: 'center' },
  fineIcon: { backgroundColor: `${theme.colors.error}12` },
  moneyLabel: { flex: 1, color: theme.colors.textSecondary, fontSize: 13 },
  moneyValue: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 3 },
  disclaimer: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 9 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLabel: { flex: 1, color: theme.colors.textSecondary, fontSize: 14 },
  healthValue: { fontSize: 13, fontWeight: '700' },
  healthFootnote: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 7 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  alertCopy: { flex: 1 },
  alertTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  alertMessage: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  activityIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: `${theme.colors.secondary}12`, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1 },
  activityTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '700' },
  activitySub: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  activityAmount: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  metricRow: { marginTop: 12 },
  metricLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 12, textTransform: 'capitalize' },
  metricValue: { color: theme.colors.text, fontSize: 12, fontWeight: '700' },
  metricTrack: { height: 8, borderRadius: 99, backgroundColor: theme.colors.background, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: 99 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${theme.colors.success}25`,
    backgroundColor: `${theme.colors.success}08`,
  },
  alertCardWarning: { borderColor: `${theme.colors.accent}35`, backgroundColor: `${theme.colors.accent}08` },
  alertIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.success}15` },
  alertIconWarning: { backgroundColor: `${theme.colors.accent}18` },
  alertCount: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 7 },
  clearAlerts: { alignItems: 'center', paddingVertical: 28 },
  clearAlertsTitle: { color: theme.colors.success, fontSize: 17, fontWeight: '800', marginTop: 8 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.colors.border },
  serviceIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: `${theme.colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  memoryMetric: { marginTop: 14 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 13, paddingVertical: 12, textAlign: 'center' },
  logoutButton: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 18, marginBottom: 12, padding: 15, backgroundColor: `${theme.colors.error}10`, borderRadius: 14, borderWidth: 1, borderColor: `${theme.colors.error}30` },
  logoutButtonText: { color: theme.colors.error, fontSize: 14, fontWeight: '700' },
  accountList: { padding: 16, paddingBottom: 28 },
  searchInput: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.text, fontSize: 14, marginBottom: 12 },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 13, marginBottom: 9 },
  accountAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}12` },
  accountInitial: { color: theme.colors.primary, fontSize: 17, fontWeight: '800' },
  accountMain: { flex: 1, minWidth: 0 },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountName: { flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  roleBadge: { overflow: 'hidden', color: theme.colors.textSecondary, backgroundColor: theme.colors.background, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  adminRole: { color: theme.colors.secondary, backgroundColor: `${theme.colors.secondary}12` },
  accountEmail: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  accountStats: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 6 },
  errorContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  errorCard: { alignItems: 'center', gap: 10, padding: 20, marginBottom: 12, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  errorTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  errorText: { color: theme.colors.error, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: theme.colors.primary },
  retryText: { color: theme.colors.surface, fontSize: 13, fontWeight: '700' },
  listLoader: { marginTop: 28 },
});

export default AdminScreen;
