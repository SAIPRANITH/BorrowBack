import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import LoadingScreen from '../components/LoadingScreen';

// Import real screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MyItemsScreen from '../screens/MyItemsScreen';
import BorrowsScreen from '../screens/BorrowsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FinesScreen from '../screens/FinesScreen';
import AddItemScreen from '../screens/AddItemScreen';
import MoneyLoansScreen from '../screens/MoneyLoansScreen';
import MoneyLoanRequestScreen from '../screens/MoneyLoanRequestScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Fines" component={FinesScreen} options={{ title: 'Financials' }} />
  </Stack.Navigator>
);

const BrowseStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
    <Stack.Screen name="BrowseItems" component={BrowseScreen} options={{ title: 'Browse' }} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
  </Stack.Navigator>
);

const ItemsStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
    <Stack.Screen name="MyItemsList" component={MyItemsScreen} options={{ title: 'My Items' }} />
    <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
  </Stack.Navigator>
);

const ActivityStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
    <Stack.Screen name="Borrows" component={BorrowsScreen} options={{ title: 'Activity' }} />
    <Stack.Screen name="MoneyLoans" component={MoneyLoansScreen} options={{ title: 'Peer Loans' }} />
    <Stack.Screen name="MoneyLoanRequest" component={MoneyLoanRequestScreen} options={{ title: 'Request a Loan' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Browse') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === 'MyItems') iconName = focused ? 'cube' : 'cube-outline';
        else if (route.name === 'Activity') iconName = focused ? 'repeat' : 'repeat-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.secondary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Browse" component={BrowseStack} />
    <Tab.Screen name="MyItems" component={ItemsStack} options={{ title: 'Items' }} />
    <Tab.Screen name="Activity" component={ActivityStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {token ? (
        user?.role === 'admin' ? <AdminStack /> : <MainTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
  }
});

export default AppNavigator;
