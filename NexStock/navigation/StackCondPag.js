import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CondPagScreen from "../screens/CondPagScreen";
import CondPagScreenDetalhe from "../screens/CondPagScreenDetalhe";

const Stack = createNativeStackNavigator();

export default function StackCondPag() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CondPagList" component={CondPagScreen} />
            <Stack.Screen name="CondPagDetalhe" component={CondPagScreenDetalhe} />
        </Stack.Navigator>
    );
}