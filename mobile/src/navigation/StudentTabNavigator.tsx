import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentTestsScreen from '../screens/student/StudentTestsScreen';
import StudentClassroomsScreen from '../screens/student/StudentClassroomsScreen';
import MyLearnMateScreen from '../screens/student/MyLearnMateScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

export type StudentTabParamList = {
  Home: undefined;
  Tests: undefined;
  Classrooms: undefined;
  MyLearnMate: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tests"
        component={StudentTestsScreen}
        options={{
          tabBarLabel: 'Testler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Classrooms"
        component={StudentClassroomsScreen}
        options={{
          tabBarLabel: 'Sınıflar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyLearnMate"
        component={MyLearnMateScreen}
        options={{
          tabBarLabel: 'My LearnMate',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
