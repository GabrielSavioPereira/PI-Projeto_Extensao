import React, { useEffect, useState } from "react";
import {
    addProduto,
    buscaProdutoId,
    buscaProdutos,
    alteraProduto,
    deletaProduto,
    escutaProdutos
} from "../services/produtoService";
import { ScrollView, View, StyleSheet, Text, Pressable, Button, Alert } from "react-native";

export default function ProdutoScreenTest({
    navigation
}) {
    const [nome, setNome] = useState("");
    const [codigo, setCodigo] = useState("");
    const [preco_custo, setPrecoCusto] = useState(0.0);
    const [preco_venda, setPrecoVenda] = useState(0.0);
    const [categoria_id, setCategoriaId] = useState();
    const [marca_id, setMarcaId] = useState();
    const [unidade_id, setUnidadeId] = useState();

    const [produtos, setProdutos] = useState([]);

    async function  fbuscaProdutos() {
        const response = await buscaProdutos();

        if(response.success){
            setProdutos(
                response.produtos
            )
        }

        console.log(response)
        console.log("opa")
    }

    function deletar(docId) {

        Alert.alert(
            "Deletar produto",
            `Tem certeza que deseja excluir o produto?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaProduto(docId);

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
        const unsubscribe = escutaProdutos((dados) => {
            setProdutos(dados);
        });

        return () => unsubscribe();
    },[])

    return (
        <ScrollView
            style={styles.container}
        >   

            <Text style={styles.title}>
                Teste Produtos
            </Text>

            <Pressable
                onPress={() => navigation.navigate("ProdutoDetalhe")}
            >
                <Text>
                    + NOVO PRODUTO
                </Text>
            </Pressable>

            <View style={{marginTop: 20}}>
                {
                    produtos.map(produto => (
                        <Pressable
                            key={produto.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(
                                "ProdutoDetalhe",
                                {
                                    produto
                                }
                            )}
                        >
                            <View>

                            <Text style={styles.cardTitle}>
                                {produto.nome}
                            </Text>

                            <Text style={styles.cardText}>
                                Código: {produto.codigo}
                            </Text>

                            <Text style={styles.cardText}>
                                Preço de Custo: R$ {produto.preco_custo}
                            </Text>

                            <Text style={styles.cardText}>
                                Preço de Venda: R$ {produto.preco_venda}
                            </Text>
                            </View>

                            <Button
                                title="Deletar"
                                onPress={() => deletar(produto.documentoId)}
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