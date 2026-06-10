import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UmedScreenDetalhe from '../screens/UmedScreenDetalhe';
import UmedScreen from '../screens/UmedScreen';

const Stack = createNativeStackNavigator();

export default function StackUmed() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UmedList" component={UmedScreen} />
      <Stack.Screen name="UmedDetalhe" component={UmedScreenDetalhe} />
    </Stack.Navigator>
  );
}