import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClienteScreen from "../screens/ClienteScreen";
import ClienteScreenDetalhe from "../screens/ClienteScreenDetalhe";

const Stack = createNativeStackNavigator();

export default function StackCliente() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ClienteList" component={ClienteScreen} />
            <Stack.Screen name="ClienteDetalhe" component={ClienteScreenDetalhe} />
        </Stack.Navigator>
    );
}