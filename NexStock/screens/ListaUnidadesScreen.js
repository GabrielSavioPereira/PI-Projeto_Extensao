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
import { buscaUmeds, deletaUmeds } from "../services/UnmedidaService";

export default function ListaUnidadesScreen({ navigation }) {
    const [unidades, setUnidades] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);

    const carregar = async () => {
        const res = await buscaUmeds();
        if (res.success) setUnidades(res.umeds);
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
                    const res = await deletaUmeds(item.documentoId);
                    if (res.success) carregar();
                    else Alert.alert("Erro", res.message);
                }
            }
        ]);
    };

    const filtrados = unidades.filter(u => u.nome?.toLowerCase().includes(busca.toLowerCase()));

    const renderItem = ({ item }) => (
        <Card>
            <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => navigation.navigate("UnidadeForm", { unidade: item })}
            >
                <View>
                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.nome}</Text>
                    <Text style={{ fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.muted }}>
                        Sigla: {item.sigla || "-"}
                    </Text>
                </View>
                <DeleteButton onPress={() => handleDelete(item)} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Unidades de Medida" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por nome..." />
            <FlatList
                data={filtrados}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhuma unidade cadastrada" />}
            />
            <FAB onPress={() => navigation.navigate("UnidadeForm")} />
        </ScreenContainer>
    );
}