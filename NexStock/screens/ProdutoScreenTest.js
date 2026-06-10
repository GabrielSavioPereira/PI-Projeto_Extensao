import React, { useEffect, useState } from "react";
import {
    addProduto,
    buscaProdutoId,
    buscaProdutos,
    alteraProduto,
    deletaProduto,
    escutaProdutos
} from "../services/ProdutoService";
import { ScrollView, View, StyleSheet, Text, Pressable, Button, Alert } from "react-native";
import { doc } from "firebase/firestore/lite";
import { FAB, ScreenContainer, Card, theme, SearchBar, EmptyState } from "../components/ui";

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
    const [busca, setBusca] = useState("");

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
                    onPress: () => confirmaExclusaoProduto(docId)

                }
            ]
        )
    }

    async function confirmaExclusaoProduto(docId) {
        console.log("Confirmou a exclusão")
        const response = await deletaProduto(docId);
        
        if (response.success){
            Alert.alert("Sucesso", "Produto Excluido com sucesso");
        } else {
            Alert.alert("Erro", response.message)
        }
    }
    
    useEffect(() => {
        const unsubscribe = escutaProdutos((dados) => {
            setProdutos(dados);
        });
        
        return () => unsubscribe();
    },[])
    
    console.log(busca)
    const produtos_filtrados = produtos.filter(
        (p) =>
            p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            p.codigo?.includes(busca)  
    )
    console.log(produtos_filtrados)

    return (
        <ScreenContainer>

                <Text style={styles.title}>
                    Teste Produtos
                </Text>

            <SearchBar
                value={busca}
                onChangeText={setBusca}
                placeholder="Informe o nome ou o código do produto"
                />

            <ScrollView
                style={styles.container}
            >   
                <View style={styles.cardInfo}>
                    { produtos_filtrados.length === 0 ? (
                        <EmptyState
                            icone="business-outline"
                            mensagem="Nenhum produto encontrado"
                        />
                    ) : (
                        produtos_filtrados.map(produto => (
                            <Card
                            key={produto.id}
                            style={styles.cardRow}
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
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>
            <FAB onPress={() => navigation.navigate("ProdutoDetalhe")} />
        </ScreenContainer>
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
    cardRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
        },
        cardInfo: { flex: 1 },
        cardNome: {
            fontFamily: theme.fonts.semiBold,
            fontSize: 16,
            color: theme.colors.text,
            marginBottom: 2,
        },
        cardDetalhe: {
            fontFamily: theme.fonts.regular,
            fontSize: 13,
            color: theme.colors.muted,
            marginTop: 1,
        }
});