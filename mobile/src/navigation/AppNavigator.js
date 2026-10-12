import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import ImmersiveBackground, { withImmersiveBackground } from '../components/ImmersiveBackground';
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

const LoginWithBackground = withImmersiveBackground(LoginScreen);
const RegisterWithBackground = withImmersiveBackground(RegisterScreen, { showBackButton: false });
const DashboardWithBackground = withImmersiveBackground(DashboardScreen);
const BrowseWithBackground = withImmersiveBackground(BrowseScreen);
const MyItemsWithBackground = withImmersiveBackground(MyItemsScreen);
const BorrowsWithBackground = withImmersiveBackground(BorrowsScreen);
const ProfileWithBackground = withImmersiveBackground(ProfileScreen);
const ItemDetailWithBackground = withImmersiveBackground(ItemDetailScreen);
const NotificationsWithBackground = withImmersiveBackground(NotificationsScreen);
const FinesWithBackground = withImmersiveBackground(FinesScreen);
const AddItemWithBackground = withImmersiveBackground(AddItemScreen, { showBackButton: false });
const MoneyLoansWithBackground = withImmersiveBackground(MoneyLoansScreen);
const MoneyLoanRequestWithBackground = withImmersiveBackground(MoneyLoanRequestScreen);
const AdminWithBackground = withImmersiveBackground(AdminScreen);

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
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

function AnimatedTabButton({ accessibilityState, children, ...props }) {
  const focused = Boolean(accessibilityState?.selected);
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, progress]);

  const activeScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  return (
    <TouchableOpacity {...props} activeOpacity={0.9} style={[props.style, styles.animatedTabButton]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabActiveIndicator,
          {
            opacity: progress,
            transform: [{ scale: activeScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: activeScale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
    <Stack.Screen name="Login" component={LoginWithBackground} />
    <Stack.Screen name="Register" component={RegisterWithBackground} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
    <Stack.Screen name="AdminDashboard" component={AdminWithBackground} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="Dashboard" component={DashboardWithBackground} />
    <Stack.Screen name="ItemDetail" component={ItemDetailWithBackground} />
    <Stack.Screen name="Notifications" component={NotificationsWithBackground} />
    <Stack.Screen name="Fines" component={FinesWithBackground} options={{ title: 'Financials' }} />
  </Stack.Navigator>
);

const BrowseStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="BrowseItems" component={BrowseWithBackground} options={{ title: 'Browse' }} />
    <Stack.Screen name="ItemDetail" component={ItemDetailWithBackground} />
  </Stack.Navigator>
);

const BorrowsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="Borrows"
      component={BorrowsWithBackground}
      initialParams={{ initialTab: 'REQUESTS' }}
      options={{ title: 'Borrows' }}
    />
  </Stack.Navigator>
);

const LoansStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="MoneyLoans" component={MoneyLoansWithBackground} options={{ title: 'Loans' }} />
    <Stack.Screen name="MoneyLoanRequest" component={MoneyLoanRequestWithBackground} options={{ title: 'Request a Loan' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="ProfileMain" component={ProfileWithBackground} options={{ title: 'Account' }} />
    <Stack.Screen name="MyItemsList" component={MyItemsWithBackground} options={{ title: 'My Items' }} />
    <Stack.Screen name="AddItem" component={AddItemWithBackground} options={{ title: 'Add Item' }} />
    <Stack.Screen name="Notifications" component={NotificationsWithBackground} options={{ title: 'Notifications' }} />
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
      tabBarItemStyle: styles.tabBarItem,
      tabBarButton: (props) => <AnimatedTabButton {...props} />,
      tabBarActiveBackgroundColor: 'transparent',
      tabBarBackground: () => (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(22,17,17,0.98)', 'rgba(8,8,8,0.98)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ),
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
    return (
      <ImmersiveBackground>
        <LoadingScreen />
      </ImmersiveBackground>
    );
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
    backgroundColor: 'transparent',
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 8,
    height: 70,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,112,101,0.24)',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    paddingBottom: 7,
    paddingTop: 7,
  },
  tabBarItem: {
    marginHorizontal: 3,
    marginVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  animatedTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActiveIndicator: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,112,101,0.2)',
    backgroundColor: 'rgba(255,73,62,0.1)',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.15,
  }
});

export default AppNavigator;
