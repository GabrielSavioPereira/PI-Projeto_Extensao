import { View, Text, StyleSheet } from "react-native";
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItem
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import Login from "../screens/LoginScreen.js"
import Header from "../components/Header";
import BarraMenu from "../components/BarraMenu";
import StackMarca from "./StackMarca";
import StackFornecedor from "./StackFornecedor.js";
import StackCliente from "./StackCliente";
import StackProdutos from "./StackProdutos.js";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
    const [openProdutos, setOpenProdutos] = useState(false);

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
            
            <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Andreia Modas</Text>
                <View style={styles.drawerDivider} />
            </View>

            {/* INÍCIO */}
            <DrawerItem
                label="Início"
                onPress={() => {
                    props.navigation.navigate("Início");
                    props.navigation.closeDrawer();
                }}
                icon={({ color }) => (
                    <Ionicons name="home-outline" size={20} color={color} />
                )}
            />

            {/* PRODUTOS (submenu) */}
            <DrawerItem
                label={() => (
    <View style={{ 
      flexDirection: "row", 
      justifyContent: "space-between", 
      alignItems: "center",
      width: "100%"
    }}>
      
      <Text style={{ fontSize: 15 }}>
        Produtos
      </Text>

      <Ionicons
        name={openProdutos ? "chevron-down" : "chevron-forward"}
        size={18}
      />

    </View>
  )}
                onPress={() => setOpenProdutos(!openProdutos)}
                icon={({ color }) => (
                    <Ionicons name="cube-outline" size={20} color={color} />
                )}
            />

            {/* SUBMENU */}
            {openProdutos && (
                <View style={{ paddingLeft: 20 }}>

                    <DrawerItem
                        label="Cadastrar Produto"
                        onPress={() => {
                            props.navigation.navigate("Produtos", {
                                screen: "CadastrarProduto"
                            });
                            setOpenProdutos(false); // 🔥 fecha submenu
                            props.navigation.closeDrawer(); // 🔥 fecha drawer
                        }}
                    />

                    <DrawerItem
                        label="Variações"
                        onPress={() => {
                            props.navigation.navigate("Produtos", {
                                screen: "Variacoes"
                            });
                            setOpenProdutos(false);
                            props.navigation.closeDrawer();
                        }}
                    />

                </View>
            )}

            {/* OUTROS */}
            <DrawerItem
                label="Marcas"
                onPress={() => {
                    props.navigation.navigate("Marcas");
                    props.navigation.closeDrawer();
                }}
                icon={({ color }) => (
                    <Ionicons name="pricetag-outline" size={20} color={color} />
                )}
            />

            <DrawerItem
                label="Fornecedores"
                onPress={() => {
                    props.navigation.navigate("Fornecedores");
                    props.navigation.closeDrawer();
                }}
                icon={({ color }) => (
                    <Ionicons name="business-outline" size={20} color={color} />
                )}
            />

            <DrawerItem
                label="Clientes"
                onPress={() => {
                    props.navigation.navigate("Clientes");
                    props.navigation.closeDrawer();
                }}
                icon={({ color }) => (
                    <Ionicons name="people-outline" size={20} color={color} />
                )}
            />

        </DrawerContentScrollView>
    );
}

export default function AppNavigator() {
    return (
        <SafeAreaView style={{flex:1}}>

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
            />

            <Drawer.Screen
                name="Marcas"
                component={StackMarca}
            />

            <Drawer.Screen
                name="Fornecedores"
                component={StackFornecedor}
            />

            <Drawer.Screen
                name="Clientes"
                component={StackCliente}
            />

            <Drawer.Screen
                name="Produtos"
                component={StackProdutos}
                options={{
                    drawerItemStyle: { display: "none" } // esconde do menu automático
                }}
            />
        </Drawer.Navigator>
        </SafeAreaView>
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