import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'borrowback:lastActivityAt';

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [token, setToken] = useState(localStorage.getItem('token') || null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 const handleLogout = useCallback(() => {
 localStorage.removeItem('token');
 localStorage.removeItem(LAST_ACTIVITY_KEY);
 setToken(null);
 setUser(null);
 }, []);

 // Helper to extract clean user object from flat API response
 const extractUser = (data) => {
 const { success, token: _t, ...userData } = data;
 return userData;
 };

 useEffect(() => {
 const fetchUser = async () => {
 if (token) {
 try {
 const res = await api.get('/auth/me');
 if (res.data.success) setUser(extractUser(res.data));
 else handleLogout();
 } catch { handleLogout(); }
 }
 setLoading(false);
 };
 fetchUser();
 }, [token]);

 const login = async (email, password) => {
 try {
 const res = await api.post('/auth/login', { email, password });
 if (res.data.success) {
 localStorage.setItem('token', res.data.token);
 localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
 setToken(res.data.token);
 setUser(extractUser(res.data));
 navigate('/');
 return { success: true };
 }
 return { success: false, message: 'Login failed' };
 } catch (err) {
 return { success: false, message: err.response?.data?.message || 'Login failed' };
 }
 };

 const register = async (data) => {
 try {
 const res = await api.post('/auth/register', data);
 if (res.data.success) return login(data.email, data.password);
 return { success: false, message: 'Registration failed' };
 } catch (err) {
 return { success: false, message: err.response?.data?.message || 'Registration failed' };
 }
 };

 const logout = useCallback(() => {
 handleLogout();
 navigate('/login');
 }, [handleLogout, navigate]);

 useEffect(() => {
 if (!token) return undefined;

 let lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
 if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
 lastActivityAt = Date.now();
 localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivityAt));
 }
 let lastPersistedActivityAt = lastActivityAt;
 let inactivityTimer;

 const logoutForInactivity = () => {
 handleLogout();
 navigate('/login', { replace: true, state: { reason: 'inactivity' } });
 };

 const scheduleInactivityCheck = () => {
 clearTimeout(inactivityTimer);
 const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt);
 if (remaining <= 0) {
 logoutForInactivity();
 } else {
 inactivityTimer = setTimeout(scheduleInactivityCheck, remaining);
 }
 };

 const recordActivity = () => {
 const now = Date.now();
 if (now - lastActivityAt >= INACTIVITY_TIMEOUT_MS) {
 logoutForInactivity();
 return;
 }

 lastActivityAt = now;
 if (now - lastPersistedActivityAt >= 15000) {
 lastPersistedActivityAt = now;
 localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
 }
 };

 const handleStorageChange = (event) => {
 if (event.key === 'token' && !event.newValue) {
 handleLogout();
 navigate('/login', { replace: true });
 } else if (event.key === LAST_ACTIVITY_KEY) {
 const activityAt = Number(event.newValue);
 if (Number.isFinite(activityAt) && activityAt > lastActivityAt) {
 lastActivityAt = activityAt;
 lastPersistedActivityAt = activityAt;
 scheduleInactivityCheck();
 }
 }
 };

 const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
 activityEvents.forEach((eventName) => {
 window.addEventListener(eventName, recordActivity, { passive: true });
 });
 window.addEventListener('storage', handleStorageChange);
 scheduleInactivityCheck();

 return () => {
 clearTimeout(inactivityTimer);
 activityEvents.forEach((eventName) => {
 window.removeEventListener(eventName, recordActivity);
 });
 window.removeEventListener('storage', handleStorageChange);
 };
 }, [token, handleLogout, navigate]);

 const updateUser = async (data) => {
 try {
 const res = await api.put('/auth/profile', data);
 if (res.data.success) {
 // Update token if a new one was returned
 if (res.data.token) {
 localStorage.setItem('token', res.data.token);
 setToken(res.data.token);
 }
 setUser(extractUser(res.data));
 return { success: true };
 }
 return { success: false, message: 'Update failed' };
 } catch (err) {
 return { success: false, message: err.response?.data?.message || 'Update failed' };
 }
 };

 return (
 <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
 {children}
 </AuthContext.Provider>
 );
};
