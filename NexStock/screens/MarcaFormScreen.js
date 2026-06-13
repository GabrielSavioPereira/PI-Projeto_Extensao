import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Header, FormField, PrimaryButton, SectionLabel, theme } from "../components/ui";
import { addMarca, alteraMarca } from "../services/MarcaService";

export default function MarcaFormScreen({ route, navigation }) {
    const marca = route.params?.marca;
    const editando = !!marca;

    const [nome, setNome] = useState(marca?.nome || "");
    const [loading, setLoading] = useState(false);

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome da marca");
            return;
        }

        const obj = { nome: nome.trim() };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraMarca(marca.documentoId, obj);
        } else {
            response = await addMarca(obj);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert("Sucesso", editando ? "Marca alterada!" : "Marca cadastrada!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title={editando ? "Editar Marca" : "Nova Marca"} onBack={() => navigation.goBack()} />
                <ScrollView style={{ padding: 16 }}>
                    <SectionLabel titulo="Dados da Marca" icone="business-outline" />
                    <FormField label="Nome" value={nome} onChangeText={setNome} />
                    <PrimaryButton title="Salvar" onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}