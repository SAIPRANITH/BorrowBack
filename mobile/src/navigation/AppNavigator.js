import React from 'react';
import { StyleSheet } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
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
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.primary,
    background: 'transparent',
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.secondary,
  },
};
const stackScreenOptions = {
  contentStyle: { backgroundColor: 'transparent' },
  headerStyle: { backgroundColor: 'rgba(8,8,8,0.78)' },
  headerTintColor: theme.colors.text,
  headerTitleStyle: {
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold,
  },
  headerShadowVisible: false,
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
    <Stack.Screen name="AdminDashboard" component={AdminScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Fines" component={FinesScreen} options={{ title: 'Financials' }} />
  </Stack.Navigator>
);

const BrowseStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="BrowseItems" component={BrowseScreen} options={{ title: 'Browse' }} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
  </Stack.Navigator>
);

const BorrowsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="Borrows"
      component={BorrowsScreen}
      initialParams={{ initialTab: 'REQUESTS' }}
      options={{ title: 'Borrows' }}
    />
  </Stack.Navigator>
);

const LoansStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="MoneyLoans" component={MoneyLoansScreen} options={{ title: 'Loans' }} />
    <Stack.Screen name="MoneyLoanRequest" component={MoneyLoanRequestScreen} options={{ title: 'Request a Loan' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Account' }} />
    <Stack.Screen name="MyItemsList" component={MyItemsScreen} options={{ title: 'My Items' }} />
    <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      sceneStyle: { backgroundColor: 'transparent' },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Browse') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === 'Borrows') iconName = focused ? 'hand-left' : 'hand-left-outline';
        else if (route.name === 'Loans') iconName = focused ? 'cash' : 'cash-outline';
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
    <Tab.Screen name="Borrows" component={BorrowsStack} />
    <Tab.Screen name="Loans" component={LoansStack} />
    <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Account' }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
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
    backgroundColor: 'rgba(8,8,8,0.78)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    elevation: 0,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0,
    shadowRadius: 0,
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
