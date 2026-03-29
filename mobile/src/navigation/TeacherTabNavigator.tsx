import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

import ClassroomsStackNavigator from './ClassroomsStackNavigator';
import QuestionsStackNavigator from './QuestionsStackNavigator';
import TestsStackNavigator from './TestsStackNavigator';
import HomeworkStack from '../screens/teacher/HomeworkScreen';
import StatisticsScreen from '../screens/teacher/StatisticsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

export type TeacherTabParamList = {
  Classrooms: undefined;
  Questions: undefined;
  Tests: undefined;
  Homework: undefined;
  Statistics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TeacherTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function TeacherTabNavigator() {
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
        name="Classrooms"
        component={ClassroomsStackNavigator}
        options={{
          tabBarLabel: 'Sınıflar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Questions"
        component={QuestionsStackNavigator}
        options={{
          tabBarLabel: 'Sorular',
          tabBarIcon: ({ focused }) => <TabIcon emoji="❓" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tests"
        component={TestsStackNavigator}
        options={{
          tabBarLabel: 'Testler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Homework"
        component={HomeworkStack}
        options={{
          tabBarLabel: 'Ödevler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: 'İstatistik',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={TeacherProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
