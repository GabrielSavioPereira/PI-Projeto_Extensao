import React, { useEffect, useState } from "react";
import {
    buscaMarcas,
    deletaMarca,
    escutaMarcas
} from "../services/marcaService";
import { ScrollView, View, StyleSheet, Text, Pressable, Button, Alert } from "react-native";

export default function MarcaScreenTest({
    navigation
}) {
    const [nome, setNome] = useState("");

    const [marcas, setMarcas] = useState([]);

    async function  fbuscaMarcas() {
        const response = await buscaMarcas();

        if(response.success){
            setMarcas(
                response.marcas
            )
        }

        console.log(response)
        console.log("opa")
    }

    function deletar(docId) {

        Alert.alert(
            "Deletar Marca",
            `Tem certeza que deseja excluir a marca?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaMarca(docId);

                        if (response.success){
                            alert("Produto Deletado com sucesso")
                        } else {
                            alert(response.message)
                        }
                    }

                }
            ]
        )
    }

    useEffect(() => {
        const unsubscribe = escutaMarcas((dados) => {
            setMarcas(dados);
        });

        return () => unsubscribe();
    },[])

    return (
        <ScrollView
            style={styles.container}
        >   

            <Text style={styles.title}>
                Cadastro de marcas
            </Text>

            <Pressable
                onPress={() => navigation.navigate("MarcaDetalhe")}
            >
                <Text>
                    + NOVA MARCA
                </Text>
            </Pressable>

            <View style={{marginTop: 20}}>
                {
                    marcas.map(marca => (
                        <Pressable
                            key={marca.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(
                                "MarcaDetalhe",
                                {
                                    marca
                                }
                            )}
                        >
                            <View>

                            <Text style={styles.cardText}>
                                ID: {produto.codigo}
                            </Text>

                            <Text style={styles.cardTitle}>
                                {marca.nome}
                            </Text>

                            </View>

                            <Button
                                title="Deletar"
                                onPress={() => deletar(marca.documentoId)}
                            />
                        </Pressable>
                    ))
                }
            </View>

        </ScrollView>
    );

}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5"
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center"
    },
    input: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12
    },

    buttonContainer: {
        marginBottom: 10
    },

    card: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.2,
        shadowRadius: 4
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8
    },

    cardText: {
        fontSize: 15,
        marginBottom: 5
    },

    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15
    },

    actionButton: {
        width: "48%"
    }
});