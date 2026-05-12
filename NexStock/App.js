import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
};