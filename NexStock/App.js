import 'react-native-gesture-handler';
import { NavigationContainer } from "@react-navigation/native";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import RootNavigator from './navigation/RootNavigator';

ErrorUtils.setGlobalHandler((error, isFatal) => {
console.log("🔥 ERRO GLOBAL:", error);
});

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

    if (!fontsLoaded) { 
        return null;
    }


    return (
        
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
    );
};