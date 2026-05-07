import { View, Button } from "react-native";

import { criarCliente } from "./src/services/clienteService";


export default function App() {
  return (
    <View >
      <Button onPress={criarCliente} title="Cria Cliente">
      </Button>
    </View>
  );
}

