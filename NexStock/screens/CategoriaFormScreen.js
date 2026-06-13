import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Header, FormField, PrimaryButton, SectionLabel, theme } from "../components/ui";
import { addCateg, alteraCateg } from "../services/CategoriaService";

export default function CategoriaFormScreen({ route, navigation }) {
    const categoria = route.params?.categoria;
    const editando = !!categoria;

    const [nome, setNome] = useState(categoria?.nome || "");
    const [loading, setLoading] = useState(false);

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome da categoria");
            return;
        }

        const obj = { nome: nome.trim() };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraCateg(categoria.documentoId, obj);
        } else {
            response = await addCateg(obj);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert("Sucesso", editando ? "Categoria alterada!" : "Categoria cadastrada!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title={editando ? "Editar Categoria" : "Nova Categoria"} onBack={() => navigation.goBack()} />
                <ScrollView style={{ padding: 16 }}>
                    <SectionLabel titulo="Dados da Categoria" icone="grid-outline" />
                    <FormField label="Nome" value={nome} onChangeText={setNome} />
                    <PrimaryButton title="Salvar" onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}