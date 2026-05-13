import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './screens/loginProject.js';
import Home from './screens/HomeScreen.js'; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login"> 
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }}
        />
        
  
        <Stack.Screen 
          name="HomeScreen" 
          component={Home}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}