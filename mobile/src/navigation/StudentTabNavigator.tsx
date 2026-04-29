import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentTestsStackNavigator from './StudentTestsStackNavigator';
import StudentPracticeStackNavigator from './StudentPracticeStackNavigator';
import StudentClassroomsStackNavigator from './StudentClassroomsStackNavigator';
import StudentHomeworkScreen from '../screens/student/StudentHomeworkScreen';
import MyLearnMateScreen from '../screens/student/MyLearnMateScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

export type StudentTabParamList = {
  Home: undefined;
  Tests: undefined;
  Practice: undefined;
  Classrooms: undefined;
  Homework: undefined;
  MyLearnMate: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.5 }}>
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
          paddingBottom: 4,
          paddingTop: 4,
          height: 58,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tests"
        component={StudentTestsStackNavigator}
        options={{
          tabBarLabel: 'Testler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Practice"
        component={StudentPracticeStackNavigator}
        options={{
          tabBarLabel: 'Pratik',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✏️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Classrooms"
        component={StudentClassroomsStackNavigator}
        options={{
          tabBarLabel: 'Sınıflar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Homework"
        component={StudentHomeworkScreen}
        options={{
          tabBarLabel: 'Ödevler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyLearnMate"
        component={MyLearnMateScreen}
        options={{
          tabBarLabel: 'LearnMate',
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
