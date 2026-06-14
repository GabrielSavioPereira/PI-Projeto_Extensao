import React, { useEffect, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Switch } from "react-native";
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
    const [permiteParcelar, setPermiteParcelar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (condPag) {
            setNome(condPag.nome || "");
            setDescricao(condPag.descricao || "");
            setPermiteParcelar(condPag.permite_parcelar || false);
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

        const obj = { nome, descricao, permite_parcelar: permiteParcelar };

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
                        placeholder="Ex: À vista, Crédito, Débito..."
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

                    <SectionLabel titulo="Parcelamento" icone="layers-outline" />
                    <View style={styles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Permite parcelar</Text>
                            <Text style={styles.toggleSub}>
                                {permiteParcelar
                                    ? "O usuário poderá definir o número de parcelas"
                                    : "Pagamento será registrado como parcela única"}
                            </Text>
                        </View>
                        <Switch
                            value={permiteParcelar}
                            onValueChange={setPermiteParcelar}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

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
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        padding: 14,
        marginBottom: 12,
    },
    toggleLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 2,
    },
    toggleSub: {
        fontSize: 12,
        color: theme.colors.muted,
        fontFamily: "Poppins_400Regular",
        flexWrap: "wrap",
    },
});