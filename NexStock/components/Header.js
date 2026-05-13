import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({ navigation }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={styles.menuButton}
                activeOpacity={0.7}
            >
                <Ionicons name="menu" size={26} color="#C97B84" />
            </TouchableOpacity>

            <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* View vazia para centralizar o logo com flexbox */}
            <View style={styles.menuButton} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 64,
        backgroundColor: "#F6D3D0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        // Sombra suave
        shadowColor: "#C97B84",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    menuButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 130,
        height: 44,
    },
});