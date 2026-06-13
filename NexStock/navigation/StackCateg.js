import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaCategoriasScreen from '../screens/ListaCategoriasScreen';
import CategoriaFormScreen from '../screens/CategoriaFormScreen';

const Stack = createNativeStackNavigator();

export default function StackCateg() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaCategorias" component={ListaCategoriasScreen} options={{ headerShown: false}} />
      <Stack.Screen name="CategoriaForm" component={CategoriaFormScreen} options={{ headerShown: false}} />
    </Stack.Navigator>
  );
}