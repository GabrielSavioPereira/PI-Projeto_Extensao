import React, { useEffect, useState } from "react";
import {
    buscaUmeds,
    deletaUmeds,
    escutaUmeds
} from "../services/UnmedidaService";
import { ScrollView, View, StyleSheet, Text, Pressable, Button, Alert } from "react-native";

export default function UmedScreen({
    navigation
}) {
    const [nome, setNome] = useState("");

    const [umeds, setUmeds] = useState([]);

    async function  fbuscaUmeds() {
        const response = await busUmed();

        if(response.success){
            setUmeds(
                response.umeds
            )
        }
        console.log("oiii")
        console.log(response.umeds)
        console.log("opa")
    }

    function deletar(docId) {

        Alert.alert(
            "Deletar Unidade de medida",
            `Tem certeza que deseja excluir a unidade de medida?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaUmeds(docId);

                        if (response.success){
                            alert("Unidade de medida Deletada com sucesso")
                        } else {
                            alert(response.message)
                            console.log(response.error)
                        }
                    }

                }
            ]
        )
    }

    useEffect(() => {
        const unsubscribe = escutaUmeds((dados) => {
            setUmeds(dados);
        });

        return () => unsubscribe();
    },[])

    return (
        <ScrollView
            style={styles.container}
        >   

            <Text style={styles.title}>
                Cadastro de Unidade de Medida
            </Text>

            <Pressable
                onPress={() => navigation.navigate("UmedDetalhe")}
            >
                <Text>
                    + NOVA UNIDADE
                </Text>
            </Pressable>

            <View style={{marginTop: 20}}>
                {
                    umeds.map(umed => (
                        <Pressable
                            key={umed.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(
                                "UmedDetalhe",
                                {
                                    umed
                                }
                            )}
                        >
                            <View>

                            <Text style={styles.cardText}>
                                ID: {umed.id}
                            </Text>

                            <Text style={styles.cardTitle}>
                                {umed.nome}
                            </Text>

                            </View>

                            <Button
                                title="Deletar"
                                onPress={() => deletar(umed.documentoId)}
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