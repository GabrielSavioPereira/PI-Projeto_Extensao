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
import { buscaCores, deletaCor } from "../services/CorService";

export default function ListaCoresScreen({ navigation }) {
    const [cores, setCores] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);

    const carregar = async () => {
        const res = await buscaCores();
        if (res.success) setCores(res.cores);
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
                    const res = await deletaCor(item.documentoId);
                    if (res.success) carregar();
                    else Alert.alert("Erro", res.message);
                }
            }
        ]);
    };

    const coresFiltradas = cores.filter(c =>
        c.nome?.toLowerCase().includes(busca.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <Card>
            <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => navigation.navigate("CorForm", { cor: item })}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: item.hex || "#ffffff", borderWidth: 1}} />
                    <View>
                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.nome}</Text>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.muted }}>
                            {item.hex || "Sem código HEX"}
                        </Text>
                    </View>
                </View>
                <DeleteButton onPress={() => handleDelete(item)} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Cores" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por nome..." />
            <FlatList
                data={coresFiltradas}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhuma cor cadastrada" />}
            />
            <FAB onPress={() => navigation.navigate("CorForm")} />
        </ScreenContainer>
    );
}