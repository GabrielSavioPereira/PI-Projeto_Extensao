import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaTamanhosScreen from '../screens/ListaTamanhosScreen';
import TamanhoFormScreen from '../screens/TamanhoFormScreen';

const Stack = createNativeStackNavigator();

export default function StackUmed() {
  return (
    <Stack.Navigator>
        <Stack.Screen name="ListaTamanhos" component={ListaTamanhosScreen} options={{ headerShown: false}} />
        <Stack.Screen name="TamanhoForm" component={TamanhoFormScreen} options={{ headerShown: false}} />
    </Stack.Navigator>
  );
}