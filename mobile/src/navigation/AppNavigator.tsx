import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

// Auth ekranları
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Dashboard ekranları
import StudentDashboard from '../screens/StudentDashboard';
import TeacherDashboard from '../screens/TeacherDashboard';
import AdminDashboard from '../screens/AdminDashboard';

// ── Tip tanımları ──────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  StudentDashboard: undefined;
  TeacherDashboard: undefined;
  AdminDashboard: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

// ── Auth ekranları ─────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ── Dashboard ekranları (rol bazlı) ───────────────────
function AppNavigatorInner() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gradientStart }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Giriş yapılmamış → Auth ekranları
  if (!user) {
    return <AuthNavigator />;
  }

  // Giriş yapılmış → Role göre dashboard
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'STUDENT' && (
        <AppStack.Screen name="StudentDashboard" component={StudentDashboard} />
      )}
      {user.role === 'TEACHER' && (
        <AppStack.Screen name="TeacherDashboard" component={TeacherDashboard} />
      )}
      {user.role === 'ADMIN' && (
        <AppStack.Screen name="AdminDashboard" component={AdminDashboard} />
      )}
    </AppStack.Navigator>
  );
}

// ── Root Navigator ─────────────────────────────────────
export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigatorInner />
      </NavigationContainer>
    </AuthProvider>
  );
}
