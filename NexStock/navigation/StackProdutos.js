import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProdutoScreenTest from "../screens/ProdutoScreenTest";
import ProdutoScreenDetalhe from "../screens/ProdutoScreenDetalhe";

const Stack = createNativeStackNavigator();

export default function ProdutosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProdutosList" 
        component={ProdutoScreenTest}
        options={{
          headerShown: false
        }} />
      <Stack.Screen name="ProdutoDetalhe" component={ProdutoScreenDetalhe}
      options={{
        title: "Editar Produto",
        headerBackTitleVisible: false
      }} />
    </Stack.Navigator>
  );
}