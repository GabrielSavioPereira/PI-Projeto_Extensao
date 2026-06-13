// navigation/RootNavigator.js
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import AppNavigator from "./AppNavigator"; // seu Drawer atual

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}