import {
    StyleSheet,
    TextInput,
    Button

} from "react-native";

import {use, useEffect, useState} from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { addCateg, alteraCateg } from "../services/CategoriaService";

export default function CategScreenDetalhe({
    route
}) {

    const categ = route.params?.categ;

    const [nome, setNome] = useState();
        
    async function  salvar() {
        console.log("Opaa")

        const objCateg = {
            "nome": nome,
        }

        if (categ) {
            const response = await alteraCateg(categ.documentoId, objCateg);
            
            if (response.success) {
                alert("Categoria Alterada com sucesso")
            } else {
                alert(response.message)
            }
        } else {
            const response = await addCateg(objCateg);

            if (response.success) {
                alert("Categoria adicionado com sucesso!")
            } else {
                alert(response.message)
            }
        }

    }

    useEffect(() => {
        
        if (categ){
            setNome(categ.nome)
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