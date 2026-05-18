import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarcaScreenDetalhe from '../screens/MarcaScreenDetalhe';
import MarcaScreenTest from '../screens/MarcaScreenTest';

const Stack = createNativeStackNavigator();

export default function StackMarca() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MarcaList" component={MarcaScreenTest} />
      <Stack.Screen name="MarcaDetalhe" component={MarcaScreenDetalhe} />
    </Stack.Navigator>
  );
}