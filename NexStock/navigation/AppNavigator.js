import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BarraMenu from "../components/BarraMenu";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Inicio" component={BarraMenu} />
        </Stack.Navigator>
    );
}