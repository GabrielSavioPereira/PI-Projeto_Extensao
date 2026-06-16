import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VendaScreen from "../screens/VendaScreen";

const Stack = createNativeStackNavigator();

export default function StackVenda() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="VendaList" component={VendaScreen} />
        </Stack.Navigator>
    );
}