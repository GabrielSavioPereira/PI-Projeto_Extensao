import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FornecedorScreen from "../screens/FornecedorScreen";
import FornecedorScreenDetalhe from "../screens/FornecedorScreenDetalhe";

const Stack = createNativeStackNavigator();

export default function StackFornecedor() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FornecedorList" component={FornecedorScreen} />
            <Stack.Screen name="FornecedorDetalhe" component={FornecedorScreenDetalhe} />
        </Stack.Navigator>
    );
}