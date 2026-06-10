import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { deletaCliente, escutaClientes } from "../services/ClienteService";
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

export default function ClienteScreen({ navigation }) {
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const unsubscribe = escutaClientes((dados) => {
            setClientes(dados);
            setCarregando(false);
        });
        return () => unsubscribe();
    }, []);

    function deletar(docId, nome) {
        Alert.alert(
            "Excluir Cliente",
            `Deseja realmente excluir "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const response = await deletaCliente(docId);
                        if (response.success) {
                            Alert.alert("Sucesso", "Cliente exclu�do com sucesso!");
                        } else {
                            Alert.alert("Erro", response.message);
                        }
                    },
                },
            ]
        );
    }

    const filtrados = clientes.filter(
        (c) =>
            c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            c.cpf?.includes(busca) ||
            c.telefone?.includes(busca)
    );

    return (
        <ScreenContainer>
            <Header
                title="Clientes"
                subtitle={`${clientes.length} cadastrado${clientes.length !== 1 ? "s" : ""}`}
            />

            <SearchBar
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar por nome, CPF ou telefone..."
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
                            icone="people-outline"
                            mensagem="Nenhum cliente encontrado"
                        />
                    ) : (
                        filtrados.map((cliente) => (
                            <Card
                                key={cliente.documentoId}
                                onPress={() =>
                                    navigation.navigate("ClienteDetalhe", { cliente })
                                }
                                style={styles.cardRow}
                            >
                                <Avatar nome={cliente.nome} size={48} />

                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardNome} numberOfLines={1}>
                                        {cliente.nome}
                                    </Text>
                                    {cliente.cpf ? (
                                        <Text style={styles.cardDetalhe}>
                                            CPF: {cliente.cpf}
                                        </Text>
                                    ) : null}
                                    {cliente.telefone ? (
                                        <Text style={styles.cardDetalhe}>
                                            ?? {cliente.telefone}
                                        </Text>
                                    ) : null}
                                </View>

                                <DeleteButton
                                    onPress={() => deletar(cliente.documentoId, cliente.nome)}
                                />
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}

            <FAB onPress={() => navigation.navigate("ClienteDetalhe")} />
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