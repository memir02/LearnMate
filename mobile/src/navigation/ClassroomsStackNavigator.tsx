import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClassroomsScreen from '../screens/teacher/ClassroomsScreen';
import ClassroomDetailScreen from '../screens/teacher/ClassroomDetailScreen';

export type ClassroomsStackParamList = {
  ClassroomsList: undefined;
  ClassroomDetail: { classroomId: string; classroomName: string };
};

const Stack = createNativeStackNavigator<ClassroomsStackParamList>();

export default function ClassroomsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClassroomsList" component={ClassroomsScreen} />
      <Stack.Screen name="ClassroomDetail" component={ClassroomDetailScreen} />
    </Stack.Navigator>
  );
}
