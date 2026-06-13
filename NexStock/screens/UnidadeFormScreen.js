import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Header, FormField, PrimaryButton, SectionLabel, theme } from "../components/ui";
import { addUmeds, alteraUmed } from "../services/UnmedidaService";

export default function UnidadeFormScreen({ route, navigation }) {
    const unidade = route.params?.unidade;
    const editando = !!unidade;

    const [nome, setNome] = useState(unidade?.nome || "");
    const [sigla, setSigla] = useState(unidade?.sigla || "");
    const [loading, setLoading] = useState(false);

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome da unidade");
            return;
        }

        const obj = { nome: nome.trim(), sigla: sigla.trim() || null };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraUmed(unidade.documentoId, obj);
        } else {
            response = await addUmeds(obj);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert("Sucesso", editando ? "Unidade alterada!" : "Unidade cadastrada!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title={editando ? "Editar Unidade" : "Nova Unidade"} onBack={() => navigation.goBack()} />
                <ScrollView style={{ padding: 16 }}>
                    <SectionLabel titulo="Dados da Unidade" icone="cube-outline" />
                    <FormField label="Nome (ex: Unidade, Peça, Metro)" value={nome} onChangeText={setNome} />
                    <FormField label="Sigla (ex: UN, PC, M)" value={sigla} onChangeText={setSigla} />
                    <PrimaryButton title="Salvar" onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}