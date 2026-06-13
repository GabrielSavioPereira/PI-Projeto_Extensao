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
import { buscaCategs, deletaCateg } from "../services/CategoriaService";

export default function ListaCategoriasScreen({ navigation }) {
    const [categorias, setCategorias] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);

    const carregar = async () => {
        const res = await buscaCategs();
        if (res.success) setCategorias(res.categs);
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
                    const res = await deletaCateg(item.documentoId);
                    if (res.success) carregar();
                    else Alert.alert("Erro", res.message);
                }
            }
        ]);
    };

    const filtrados = categorias.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()));

    const renderItem = ({ item }) => (
        <Card>
            <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => navigation.navigate("CategoriaForm", { categoria: item })}
            >
                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.nome}</Text>
                <DeleteButton onPress={() => handleDelete(item)} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Categorias" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por categoria..." />
            <FlatList
                data={filtrados}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhuma categoria cadastrada" />}
            />
            <FAB onPress={() => navigation.navigate("CategoriaForm")} />
        </ScreenContainer>
    );
}