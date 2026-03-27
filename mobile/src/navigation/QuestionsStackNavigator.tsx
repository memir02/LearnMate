import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuestionsScreen from '../screens/teacher/QuestionsScreen';
import CreateQuestionScreen from '../screens/teacher/CreateQuestionScreen';
import EditQuestionScreen from '../screens/teacher/EditQuestionScreen';

export type QuestionsStackParamList = {
  QuestionsList: undefined;
  CreateQuestion: undefined;
  EditQuestion: { questionId: string };
};

const Stack = createNativeStackNavigator<QuestionsStackParamList>();

export default function QuestionsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuestionsList" component={QuestionsScreen} />
      <Stack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
      <Stack.Screen name="EditQuestion" component={EditQuestionScreen} />
    </Stack.Navigator>
  );
}
