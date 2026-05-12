import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProdutoScreenTest from "../screens/ProdutoScreenTest";
import ProdutoScreenDetalhe from "../screens/ProdutoScreenDetalhe";
import MarcaScreenTest from "../screens/MarcaScreenTest";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Produtos"
                component={ProdutoScreenTest}
            />

            <Stack.Screen
                name="ProdutoDetalhe"
                component={ProdutoScreenDetalhe}
            />

            <Stack.Screen
                name="Marcas"
                component={MarcaScreenTest}
            />

            <Stack.Screen
                name="MarcaDetalhe"
                component={MarcaScreenDetalhe}
            />
        </Stack.Navigator>
    );
}