import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { deletaCondPag, escutaCondPag } from "../services/CondPagService";
import {
    ScreenContainer,
    Header,
    SearchBar,
    Card,
    FAB,
    EmptyState,
    Loading,
    DeleteButton,
    theme,
} from "../components/ui";

export default function CondPagScreen({ navigation }) {
    const [condPags, setCondPags] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const unsubscribe = escutaCondPag((dados) => {
            setCondPags(dados);
            setCarregando(false);
        });
        return () => unsubscribe();
    }, []);

    function deletar(docId, nome) {
        Alert.alert(
            "Excluir Condição de Pagamento",
            `Deseja realmente excluir "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaCondPag(docId);
                        if (response.success) {
                            Alert.alert("Sucesso", "Condição de pagamento excluída com sucesso!");
                        } else {
                            Alert.alert("Erro", response.message);
                        }
                    },
                },
            ]
        );
    }

    const filtrados = condPags.filter(
        (c) =>
            c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            c.descricao?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <ScreenContainer>
            <Header
                title="Condições de Pagamento"
                subtitle={`${condPags.length} cadastrada${condPags.length !== 1 ? "s" : ""}`}
            />

            <SearchBar
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar por nome ou descrição..."
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
                            icone="card-outline"
                            mensagem="Nenhuma condição de pagamento encontrada"
                        />
                    ) : (
                        filtrados.map((condPag) => (
                            <Card
                                key={condPag.documentoId}
                                onPress={() =>
                                    navigation.navigate("CondPagDetalhe", { condPag })
                                }
                                style={styles.cardRow}
                            >
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardNome} numberOfLines={1}>
                                        {condPag.nome}
                                    </Text>
    
                                    {condPag.descricao ? (
                                        <Text style={styles.cardDetalhe}>
                                            {condPag.descricao}
                                        </Text>
                                    ) : null}
                                </View>

                                <DeleteButton
                                    onPress={() => deletar(condPag.documentoId, condPag.nome)}
                                />
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}

            <FAB onPress={() => navigation.navigate("CondPagDetalhe")} />
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