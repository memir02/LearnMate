import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TestsScreen from '../screens/teacher/TestsScreen';
import CreateTestScreen from '../screens/teacher/CreateTestScreen';
import TestDetailScreen from '../screens/teacher/TestDetailScreen';

export type TestsStackParamList = {
  TestsList: undefined;
  CreateTest: undefined;
  TestDetail: { testId: string; testTitle: string };
};

const Stack = createNativeStackNavigator<TestsStackParamList>();

export default function TestsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestsList" component={TestsScreen} />
      <Stack.Screen name="CreateTest" component={CreateTestScreen} />
      <Stack.Screen name="TestDetail" component={TestDetailScreen} />
    </Stack.Navigator>
  );
}
