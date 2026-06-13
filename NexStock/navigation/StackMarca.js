import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaMarcasScreen from '../screens/ListaMarcasScreen';
import MarcaFormScreen from '../screens/MarcaFormScreen';

const Stack = createNativeStackNavigator();

export default function StackMarca() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaMarcas" component={ListaMarcasScreen} options={{headerShown: false}} />
      <Stack.Screen name="MarcaForm" component={MarcaFormScreen} options={{headerShown: false}}  />
    </Stack.Navigator>
  );
}