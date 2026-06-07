import React, { useEffect, useState } from "react";
import { ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { addFornecedor, alteraFornecedor } from "../services/fornecedorService";
import {
    Header,
    Avatar,
    SectionLabel,
    FormField,
    PrimaryButton,
    theme,
} from "../components/ui";

function formatarCpf(t) {
    return t.replace(/\D/g, "").slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarCnpj(t) {
    return t.replace(/\D/g, "").slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatarData(t) {
    return t.replace(/\D/g, "").slice(0, 8)
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d)/, "$1/$2");
}

function formatarTelefone(t) {
    const n = t.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 10)
        return n.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
    return n.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export default function FornecedorScreenDetalhe({ route, navigation }) {
    const fornecedor = route.params?.fornecedor;
    const editando = !!fornecedor;

    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");
    const [endereco, setEndereco] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [observacao, setObservacao] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (fornecedor) {
            setNome(fornecedor.nome || "");
            setCpf(fornecedor.cpf || "");
            setCnpj(fornecedor.cnpj || "");
            setTelefone(fornecedor.telefone || "");
            setEmail(fornecedor.email || "");
            setEndereco(fornecedor.endereco || "");
            setDataInicio(fornecedor.dataInicio || "");
            setObservacao(fornecedor.observacao || "");
        }
    }, []);

    function validar() {
        if (!nome.trim()) {
            Alert.alert("Atenção", "O nome do fornecedor é obrigatório.");
            return false;
        }
        if (!cpf && !cnpj) {
            Alert.alert("Atenção", "Informe ao menos CPF ou CNPJ.");
            return false;
        }
        return true;
    }

    async function salvar() {
        if (!validar()) return;
        setSalvando(true);

        const obj = { nome, cpf, cnpj, telefone, email, endereco, dataInicio, observacao };

        const response = editando
            ? await alteraFornecedor(fornecedor.documentoId, obj)
            : await addFornecedor(obj);

        setSalvando(false);

        if (response.success) {
            Alert.alert(
                "Sucesso",
                editando ? "Fornecedor atualizado!" : "Fornecedor cadastrado!",
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
                    title={editando ? "Editar Fornecedor" : "Novo Fornecedor"}
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Avatar preview */}
                    <Avatar nome={nome} size={72} style={styles.avatar} />

                    {/* Identificação */}
                    <SectionLabel titulo="Identificação" icone="person-outline" />
                    <FormField
                        label="Nome completo / Razão social *"
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Ex: João Silva"
                        autoCapitalize="words"
                    />
                    <FormField
                        label="CPF"
                        value={cpf}
                        onChangeText={(t) => setCpf(formatarCpf(t))}
                        placeholder="000.000.000-00"
                        keyboardType="numeric"
                    />
                    <FormField
                        label="CNPJ"
                        value={cnpj}
                        onChangeText={(t) => setCnpj(formatarCnpj(t))}
                        placeholder="00.000.000/0000-00"
                        keyboardType="numeric"
                    />
                    <FormField
                        label="Data de início do fornecimento"
                        value={dataInicio}
                        onChangeText={(t) => setDataInicio(formatarData(t))}
                        placeholder="DD/MM/AAAA"
                        keyboardType="numeric"
                    />

                    {/* Contato */}
                    <SectionLabel titulo="Contato" icone="call-outline" />
                    <FormField
                        label="Telefone / WhatsApp"
                        value={telefone}
                        onChangeText={(t) => setTelefone(formatarTelefone(t))}
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                    />
                    <FormField
                        label="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Endereço */}
                    <SectionLabel titulo="Endereço" icone="location-outline" />
                    <FormField
                        label="Endereço"
                        value={endereco}
                        onChangeText={setEndereco}
                        placeholder="Rua, número, bairro, cidade"
                    />

                    {/* Observações */}
                    <SectionLabel titulo="Observações" icone="document-text-outline" />
                    <FormField
                        label="Observações"
                        value={observacao}
                        onChangeText={setObservacao}
                        placeholder="Informações adicionais..."
                        multiline
                    />

                    <PrimaryButton
                        title={editando ? "Salvar alterações" : "Cadastrar fornecedor"}
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
    avatar: { alignSelf: "center", marginVertical: 24 },
});