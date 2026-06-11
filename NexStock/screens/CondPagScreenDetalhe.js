import React, { useEffect, useState } from "react";
import { ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { addCondPag, alteraCondPag } from "../services/CondPagService";
import {
    Header,
    SectionLabel,
    FormField,
    PrimaryButton,
    theme,
} from "../components/ui";

export default function CondPagScreenDetalhe({ route, navigation }) {
    const condPag = route.params?.condPag;
    const editando = !!condPag;

    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (condPag) {
            setNome(condPag.nome || "");
            setDescricao(condPag.descricao || "");
        }
    }, []);

    function validar() {
        if (!nome.trim()) {
            Alert.alert("Atenção", "O nome da condição de pagamento é obrigatório.");
            return false;
        }
        return true;
    }

    async function salvar() {
        if (!validar()) return;
        setSalvando(true);

        const obj = { nome, descricao };

        const response = editando
            ? await alteraCondPag(condPag.documentoId, obj)
            : await addCondPag(obj);

        setSalvando(false);

        if (response.success) {
            Alert.alert(
                "Sucesso",
                editando ? "Condição atualizada!" : "Condição cadastrada!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert("Erro", response.message || "Ocorreu um erro.");
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <Header
                    title={editando ? "Editar Condição" : "Nova Condição"}
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <SectionLabel titulo="Identificação" icone="card-outline" />
                    <FormField
                        label="Nome *"
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Ex: À vista, 30 dias, 30/60/90..."
                        autoCapitalize="words"
                    />

                    <SectionLabel titulo="Observações" icone="document-text-outline" />
                    <FormField
                        label="Descrição"
                        value={descricao}
                        onChangeText={setDescricao}
                        placeholder="Informações adicionais..."
                        multiline
                    />

                    <PrimaryButton
                        title={editando ? "Salvar alterações" : "Cadastrar condição"}
                        icone={editando ? "checkmark-circle-outline" : "save-outline"}
                        onPress={salvar}
                        loading={salvando}
                        style={{ marginTop: 28 }}
                    />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1, paddingHorizontal: 16 },
});