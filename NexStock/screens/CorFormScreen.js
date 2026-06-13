import React, { useState, useEffect } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Header, FormField, PrimaryButton, SectionLabel, theme } from "../components/ui";
import { addCor, alteraVariacao } from "../services/CorService";


export default function CorFormScreen({ route, navigation }) {
    const cor = route.params?.cor;
    const editando = !!cor;

    const [nome, setNome] = useState(cor?.nome || "");
    const [hex, setHex] = useState(cor?.hex || "");
    const [loading, setLoading] = useState(false);

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome da cor");
            return;
        }

        const obj = { nome: nome.trim(), hex: hex.trim() || null };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraVariacao(cor.documentoId, obj);
        } else {
            response = await addCor(obj);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert("Sucesso", editando ? "Cor alterada!" : "Cor cadastrada!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title={editando ? "Editar Cor" : "Nova Cor"} onBack={() => navigation.goBack()} />
                <ScrollView style={{ padding: 16 }}>
                    <SectionLabel titulo="Dados da Cor" icone="color-palette-outline" />
                    <FormField label="Nome" value={nome} onChangeText={setNome} />
                    <FormField label="Código HEX (ex: #FF0000)" value={hex} onChangeText={setHex} />
                    <PrimaryButton title="Salvar" onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}