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
import { buscaMarcas, deletaMarca } from "../services/MarcaService";

export default function ListaMarcasScreen({ navigation }) {
    const [marcas, setMarcas] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);

    const carregar = async () => {
        const res = await buscaMarcas();
        if (res.success) setMarcas(res.marcas);
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
                    const res = await deletaMarca(item.documentoId);
                    if (res.success) carregar();
                    else Alert.alert("Erro", res.message);
                }
            }
        ]);
    };

    const filtrados = marcas.filter(m => m.nome?.toLowerCase().includes(busca.toLowerCase()));

    const renderItem = ({ item }) => (
        <Card>
            <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => navigation.navigate("MarcaForm", { marca: item })}
            >
                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.nome}</Text>
                <DeleteButton onPress={() => handleDelete(item)} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Marcas" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por marca..." />
            <FlatList
                data={filtrados}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhuma marca cadastrada" />}
            />
            <FAB onPress={() => navigation.navigate("MarcaForm")} />
        </ScreenContainer>
    );
}