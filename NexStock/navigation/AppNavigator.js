import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProdutoScreenTest from "../screens/ProdutoScreenTest";

import ProdutoScreenDetalhe from "../screens/ProdutoScreenDetalhe";

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
        </Stack.Navigator>
    );
}