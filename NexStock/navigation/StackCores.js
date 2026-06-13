import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaCoresScreen from '../screens/ListaCoresScreen';
import CorFormScreen from '../screens/CorFormScreen';

const Stack = createNativeStackNavigator();

export default function StackUmed() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaCores" component={ListaCoresScreen} options={{ headerShown: false}} />
      <Stack.Screen name="CorForm" component={CorFormScreen} options={{ headerShown: false}} />
    </Stack.Navigator>
  );
}