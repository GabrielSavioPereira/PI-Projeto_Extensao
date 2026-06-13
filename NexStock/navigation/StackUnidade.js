import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaUnidadesScreen from '../screens/ListaUnidadesScreen';
import UnidadeFormScreen from '../screens/UnidadeFormScreen';

const Stack = createNativeStackNavigator();

export default function StackUmed() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaUnidades" component={ListaUnidadesScreen} options={{ headerShown: false}} />
      <Stack.Screen name="UnidadeForm" component={UnidadeFormScreen} options={{ headerShown: false}} />
    </Stack.Navigator>
  );
}