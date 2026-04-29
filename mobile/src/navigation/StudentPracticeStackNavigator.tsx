import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PracticeHomeScreen from '../screens/student/PracticeHomeScreen';
import PracticeSolveScreen from '../screens/student/PracticeSolveScreen';
import PracticeResultsScreen from '../screens/student/PracticeResultsScreen';

export type StudentPracticeStackParamList = {
  PracticeHome: undefined;
  PracticeSolve: { sessionId: string; questions: any[] };
  PracticeResults: { sessionId: string };
};

const Stack = createNativeStackNavigator<StudentPracticeStackParamList>();

export default function StudentPracticeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PracticeHome" component={PracticeHomeScreen} />
      <Stack.Screen name="PracticeSolve" component={PracticeSolveScreen} />
      <Stack.Screen name="PracticeResults" component={PracticeResultsScreen} />
    </Stack.Navigator>
  );
}
