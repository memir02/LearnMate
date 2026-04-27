import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentClassroomsScreen from '../screens/student/StudentClassroomsScreen';
import StudentClassroomDetailScreen from '../screens/student/StudentClassroomDetailScreen';

export type StudentClassroomsStackParamList = {
  ClassroomsList: undefined;
  ClassroomDetail: { classroomId: string; classroomName: string };
};

const Stack = createNativeStackNavigator<StudentClassroomsStackParamList>();

export default function StudentClassroomsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClassroomsList" component={StudentClassroomsScreen} />
      <Stack.Screen name="ClassroomDetail" component={StudentClassroomDetailScreen} />
    </Stack.Navigator>
  );
}
