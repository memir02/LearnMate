import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentTestsScreen from '../screens/student/StudentTestsScreen';
import TakeTestScreen from '../screens/student/TakeTestScreen';
import TestResultsScreen from '../screens/student/TestResultsScreen';

export type StudentTestsStackParamList = {
  TestsList: undefined;
  TakeTest: { testId: string; studentTestId: string; title: string };
  TestResults: { studentTestId: string; title: string };
};

const Stack = createNativeStackNavigator<StudentTestsStackParamList>();

export default function StudentTestsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestsList" component={StudentTestsScreen} />
      <Stack.Screen name="TakeTest" component={TakeTestScreen} />
      <Stack.Screen name="TestResults" component={TestResultsScreen} />
    </Stack.Navigator>
  );
}
