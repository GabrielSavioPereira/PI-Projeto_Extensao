import React, { useState, useEffect } from "react";
import { View, FlatList, Alert, Text, TouchableOpacity } from "react-native";
import {
    ScreenContainer,
    Header,
    SearchBar,
    EmptyState,
    FAB,
    DeleteButton,
    Card,
    theme
} from "../components/ui";
import { buscaTams, deletaTams } from "../services/TamanhoService";

export default function ListaTamanhosScreen({ navigation }) {
    const [tamanhos, setTamanhos] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);

    const carregar = async () => {
        const res = await buscaTams();
        if (res.success) setTamanhos(res.tams);
        else Alert.alert("Erro", res.message);
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", carregar);
        return unsubscribe;
    }, [navigation]);

    const handleDelete = (item) => {
        Alert.alert("Excluir", `Remover ${item.nome}?`, [
            { text: "Cancelar" },
            {
                text: "Excluir",
                onPress: async () => {
                    const res = await deletaTams(item.documentoId);
                    if (res.success) carregar();
                    else Alert.alert("Erro", res.message);
                }
            }
        ]);
    };

    const filtrados = tamanhos.filter(t => t.nome?.toLowerCase().includes(busca.toLowerCase()));

    const renderItem = ({ item }) => (
        <Card>
            <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => navigation.navigate("TamanhoForm", { tamanho: item })}
            >
                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.nome}</Text>
                <DeleteButton onPress={() => handleDelete(item)} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Tamanhos" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por tamanho..." />
            <FlatList
                data={filtrados}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhum tamanho cadastrado" />}
            />
            <FAB onPress={() => navigation.navigate("TamanhoForm")} />
        </ScreenContainer>
    );
}