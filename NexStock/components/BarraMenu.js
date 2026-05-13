import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ProdutoScreenTest from "../screens/ProdutoScreenTest";
import ProdutoScreenDetalhe from "../screens/ProdutoScreenDetalhe";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: "home-outline",
    Produtos: "shirt-outline",
    Detalhes: "search-outline",
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
            <Tab.Screen name="Produtos" component={ProdutoScreenTest} />
            <Tab.Screen name="Detalhes" component={ProdutoScreenDetalhe} />
        </Tab.Navigator>
    );
}