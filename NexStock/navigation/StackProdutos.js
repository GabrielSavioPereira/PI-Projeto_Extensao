import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProdutoListScreen from "../screens/ProdutoListScreen";
import ProdutoFormScreen from "../screens/ProdutoFormScreen";
import ProdutoVariacaoScreen from '../screens/ProdutoVariacaoScreen';

const Stack = createNativeStackNavigator();

export default function ProdutosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProdutosList" 
        component={ProdutoListScreen}
        options={{
          headerShown: false
        }} />
      <Stack.Screen name="ProdutoForm" component={ProdutoFormScreen}
      options={{
        headerShown: false
      }} />

      <Stack.Screen
        name='ProdutoVariacao'
        component={ProdutoVariacaoScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}