import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";

import { deletaFornecedor, escutaFornecedores } from "../services/FornecedorService";
import {
    ScreenContainer,
    Header,
    SearchBar,
    Card,
    Avatar,
    FAB,
    EmptyState,
    Loading,
    DeleteButton,
    theme,
} from "../components/ui";

export default function FornecedorScreen({ navigation }) {
    const [fornecedores, setFornecedores] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const unsubscribe = escutaFornecedores((dados) => {
            setFornecedores(dados);
            setCarregando(false);
        });
        return () => unsubscribe();
    }, []);


    function deletar(docId, nome) {
        Alert.alert(
            "Excluir Fornecedor",
            `Deseja realmente excluir "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaFornecedor(docId);
                        if (response.success) {
                            Alert.alert("Sucesso", "Fornecedor exclu�do com sucesso!");
                        } else {
                            Alert.alert("Erro", response.message);
                        }
                    },
                },
            ]
        );
    }

    const filtrados = fornecedores.filter(
        (f) =>
            f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            f.cnpj?.includes(busca) ||
            f.cpf?.includes(busca)
    );

    return (
        <ScreenContainer>
            <Header
                title="Fornecedores"
                subtitle={`${fornecedores.length} cadastrado${fornecedores.length !== 1 ? "s" : ""}`}
            />

            <SearchBar
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar por nome, CPF ou CNPJ..."
            />

            {carregando ? (
                <Loading />
            ) : (
                <ScrollView
                    style={{ marginTop: 16, paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {filtrados.length === 0 ? (
                        <EmptyState
                            icone="business-outline"
                            mensagem="Nenhum fornecedor encontrado"
                        />
                    ) : (
                        filtrados.map((fornecedor) => (
                            <Card
                                key={fornecedor.documentoId}
                                onPress={() =>
                                    navigation.navigate("FornecedorDetalhe", { fornecedor })
                                }
                                style={styles.cardRow}
                            >
                                <Avatar nome={fornecedor.nome} size={48} />

                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardNome} numberOfLines={1}>
                                        {fornecedor.nome}
                                    </Text>
                                    <Text style={styles.cardDetalhe}>
                                        {fornecedor.cnpj
                                            ? `CNPJ: ${fornecedor.cnpj}`
                                            : fornecedor.cpf
                                            ? `CPF: ${fornecedor.cpf}`
                                            : "Sem documento"}
                                    </Text>
                                    {fornecedor.telefone ? (
                                        <Text style={styles.cardDetalhe}>
                                            ?? {fornecedor.telefone}
                                        </Text>
                                    ) : null}
                                </View>

                                <DeleteButton
                                    onPress={() =>
                                        deletar(fornecedor.documentoId, fornecedor.nome)
                                    }
                                />
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}

            <FAB onPress={() => navigation.navigate("FornecedorDetalhe")} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
    },
});