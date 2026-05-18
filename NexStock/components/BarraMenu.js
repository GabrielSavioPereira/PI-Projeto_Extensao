import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import StackProdutos from "../navigation/StackProdutos";
import ProdutoScreenDetalhe from "../screens/ProdutoScreenDetalhe";
import StackMarca from "../navigation/StackMarca";
import StackCateg from "../navigation/StackCateg";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: "home-outline",
    Produtos: "shirt-outline",
    Marca: "search-outline",
    Categoria: "search-outline",
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
            <Tab.Screen name="Produtos" component={StackProdutos} />
            <Tab.Screen name="Marca" component={StackMarca} />
            <Tab.Screen name="Categoria" component={StackCateg} />
        </Tab.Navigator>
    );
}