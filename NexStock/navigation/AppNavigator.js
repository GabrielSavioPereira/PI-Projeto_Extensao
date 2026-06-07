import { View, Text, StyleSheet } from "react-native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

import Header from "../components/Header";
import BarraMenu from "../components/BarraMenu";
import StackMarca from "./StackMarca";
import StackFornecedor from "./StackFornecedor.js";
import StackCliente from "./StackCliente";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Andreia Modas</Text>
                <View style={styles.drawerDivider} />
            </View>
            <View style={styles.drawerItems}>
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>
    );
}

export default function AppNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={({ navigation }) => ({
                header: () => <Header navigation={navigation} />,
                drawerActiveTintColor: "#C97B84",
                drawerInactiveTintColor: "#7a5c60",
                drawerActiveBackgroundColor: "#FDECEA",
                drawerLabelStyle: {
                    fontFamily: "Poppins_500Medium",
                    fontSize: 15,
                    marginLeft: -8,
                },
                drawerItemStyle: {
                    borderRadius: 12,
                    marginHorizontal: 8,
                    marginVertical: 2,
                },
                drawerStyle: {
                    backgroundColor: "#FFF8F7",
                    width: 260,
                },
            })}
        >
            <Drawer.Screen
                name="Início"
                component={BarraMenu}
                options={{
                    drawerIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={20} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="Marcas"
                component={StackMarca}
                options={{
                    drawerIcon: ({ color }) => (
                        <Ionicons name="pricetag-outline" size={20} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="Fornecedores"
                component={StackFornecedor}
                options={{
                    drawerIcon: ({ color }) => (
                        <Ionicons name="business-outline" size={20} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="Clientes"
                component={StackCliente}
                options={{
                    drawerIcon: ({ color }) => (
                        <Ionicons name="people-outline" size={20} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    drawerContainer: { flex: 1 },
    drawerHeader: {
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
    },
    drawerTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 18,
        color: "#7a3c48",
        marginBottom: 12,
    },
    drawerDivider: {
        height: 1,
        backgroundColor: "#F0C4C4",
    },
    drawerItems: { flex: 1, paddingTop: 8 },
});