import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategScreenDetalhe from '../screens/CategScreenDetalhe';
import CategScreen from '../screens/CategScreen';

const Stack = createNativeStackNavigator();

export default function StackCateg() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CategList" component={CategScreen} />
      <Stack.Screen name="CategDetalhe" component={CategScreenDetalhe} />
    </Stack.Navigator>
  );
}