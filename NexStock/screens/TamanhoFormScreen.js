import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Header, FormField, PrimaryButton, SectionLabel, theme } from "../components/ui";
import { addTams, alteraTam } from "../services/TamanhoService";

export default function TamanhoFormScreen({ route, navigation }) {
    const tamanho = route.params?.tamanho;
    const editando = !!tamanho;

    const [nome, setNome] = useState(tamanho?.nome || "");
    const [ordem, setOrdem] = useState(tamanho?.ordem?.toString() || "");
    const [loading, setLoading] = useState(false);

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome do tamanho");
            return;
        }

        const obj = {
            nome: nome.trim(),
            ordem: parseInt(ordem) || 0
        };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraTam(tamanho.documentoId, obj);
        } else {
            response = await addTams(obj);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert("Sucesso", editando ? "Tamanho alterado!" : "Tamanho cadastrado!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title={editando ? "Editar Tamanho" : "Novo Tamanho"} onBack={() => navigation.goBack()} />
                <ScrollView style={{ padding: 16 }}>
                    <SectionLabel titulo="Dados do Tamanho" icone="resize-outline" />
                    <FormField label="Nome (ex: P, M, G, 38, 40)" value={nome} onChangeText={setNome} />
                    <FormField label="Ordem (exibição)" value={ordem} onChangeText={setOrdem} keyboardType="numeric" />
                    <PrimaryButton title="Salvar" onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}