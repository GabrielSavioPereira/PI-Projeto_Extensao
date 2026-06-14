import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaComprasScreen from '../screens/ListaComprasScreen';
import NovaCompraScreen from '../screens/NovaCompraScreen';
import DetalheCompraScreen from '../screens/DetalheCompraScreen';

const Stack = createNativeStackNavigator();

export default function StackCompra() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ListaCompras"
        component={ListaComprasScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NovaCompra"
        component={NovaCompraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetalheCompra"
        component={DetalheCompraScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}