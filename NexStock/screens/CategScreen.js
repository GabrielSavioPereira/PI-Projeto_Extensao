import React, { useEffect, useState } from "react";
import {
    buscaCateg,
    deletaCateg,
    escutaCategs
} from "../services/CategoriaService";
import { ScrollView, View, StyleSheet, Text, Pressable, Button, Alert } from "react-native";

export default function CategScreen({
    navigation
}) {
    const [nome, setNome] = useState("");

    const [categs, setCategs] = useState([]);

    async function  fbuscaCategs() {
        const response = await buscaCateg();

        if(response.success){
            setMarcas(
                response.categs
            )
        }
        console.log("oiii")
        console.log(response.categs)
        console.log("opa")
    }

    function deletar(docId) {

        Alert.alert(
            "Deletar Catogoria",
            `Tem certeza que deseja excluir a categoria?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaCateg(docId);

                        if (response.success){
                            alert("Categoria Deletada com sucesso")
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
        const unsubscribe = escutaCategs((dados) => {
            setCategs(dados);
        });

        return () => unsubscribe();
    },[])

    return (
        <ScrollView
            style={styles.container}
        >   

            <Text style={styles.title}>
                Cadastro de categorias
            </Text>

            <Pressable
                onPress={() => navigation.navigate("CategDetalhe")}
            >
                <Text>
                    + NOVA CATEGORIA
                </Text>
            </Pressable>

            <View style={{marginTop: 20}}>
                {
                    categs.map(categ => (
                        <Pressable
                            key={categ.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(
                                "CategDetalhe",
                                {
                                    categ
                                }
                            )}
                        >
                            <View>

                            <Text style={styles.cardText}>
                                ID: {categ.id}
                            </Text>

                            <Text style={styles.cardTitle}>
                                {categ.nome}
                            </Text>

                            </View>

                            <Button
                                title="Deletar"
                                onPress={() => deletar(categ.documentoId)}
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