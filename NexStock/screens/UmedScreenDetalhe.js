import {
    StyleSheet,
    TextInput,
    Button

} from "react-native";

import {use, useEffect, useState} from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { addUmeds, alteraUmed } from "../services/UnmedidaService";

export default function UmedScreenDetalhe({
    route
}) {

    const umed = route.params?.umed;

    const [nome, setNome] = useState();
        
    async function  salvar() {
        console.log("Opaa")

        const objUmed = {
            "nome": nome,
        }

        if (umed) {
            const response = await alteraUmed(umed.documentoId, objUmed);
            
            if (response.success) {
                alert("Unidade de medida Alterada com sucesso")
            } else {
                alert(response.message)
            }
        } else {
            const response = await addUmeds(objUmed);

            if (response.success) {
                alert("Unidade de medida adicionado com sucesso!")
            } else {
                alert(response.message)
            }
        }

    }

    useEffect(() => {
        
        if (umed){
            setNome(umed.nome)
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