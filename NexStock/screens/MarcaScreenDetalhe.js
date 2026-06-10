import {
    StyleSheet,
    TextInput,
    Button

} from "react-native";

import {use, useEffect, useState} from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { addMarca, alteraMarca } from "../services/MarcaService";

export default function MarcaScreenDetalhe({
    route
}) {

    const marca = route.params?.marca;

    const [nome, setNome] = useState();
        
    async function  salvar() {
        const objMarca = {
            "nome": nome,
        }

        if (marca) {
            const response = await alteraMarca(marca.documentoId, objMarca);
            
            if (response.success) {
                alert("Marca Alterada com sucesso")
            } else {
                alert(response.message)
            }
        } else {
            const response = await addMarca(objMarca);

            if (response.success) {
                alert("Marca adicionado com sucesso!")
            } else {
                alert(response.message)
            }
        }

    }

    useEffect(() => {
        
        if (marca){
            setNome(marca.nome)
        }

    }, [])

    return (

        <SafeAreaProvider>
         <SafeAreaView style={styles.container}>
            <TextInput
                style={styles.input}
                onChangeText={setNome}
                value={nome}
                placeholder="nome"
                />

            <Button
                title="salvar"
                onPress={salvar}
            />
         </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20
    },

    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 5
    }
});