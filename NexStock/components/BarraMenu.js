import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import StackProdutos from "../navigation/StackProdutos";
import StackMarca from "../navigation/StackMarca";
import StackCateg from "../navigation/StackCateg";
import StackCompra from "../navigation/StackCompra";
import StackVenda from "../navigation/StackVenda";
import SaldoEstoque from "../screens/SaldoVariacaoScreen"

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: "home-outline",
    Estoque: "shirt-outline",
    Compras: "cart-outline",
    Vendas:   "bag-handle-outline",
};

export default function BarraMenu() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
                ),
                tabBarActiveTintColor: "#C97B84",
                tabBarInactiveTintColor: "#b0a0a2",
                tabBarLabelStyle: {
                    fontFamily: "Poppins_500Medium",
                    fontSize: 11,
                },
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 0.5,
                    borderTopColor: "#F0C4C4",
                    height: 44,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Compras" component={StackCompra} />
            <Tab.Screen name="Vendas" component={StackVenda} />
            <Tab.Screen name="Estoque" component={SaldoEstoque} />
        </Tab.Navigator>
    );
}