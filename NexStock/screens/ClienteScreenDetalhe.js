import React, { useEffect, useState } from "react";
import { ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { addCliente, alteraCliente } from "../services/ClienteService";
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

export default function ClienteScreenDetalhe({ route, navigation }) {
    const cliente = route.params?.cliente;
    const editando = !!cliente;

    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");
    const [endereco, setEndereco] = useState("");
    const [observacao, setObservacao] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (cliente) {
            setNome(cliente.nome || "");
            setCpf(cliente.cpf || "");
            setDataNascimento(cliente.dataNascimento || "");
            setTelefone(cliente.telefone || "");
            setEmail(cliente.email || "");
            setEndereco(cliente.endereco || "");
            setObservacao(cliente.observacao || "");
        }
    }, []);

    function validar() {
        if (!nome.trim()) {
            Alert.alert("Aten��o", "O nome do cliente � obrigat�rio.");
            return false;
        }
        return true;
    }

    async function salvar() {
        if (!validar()) return;
        setSalvando(true);

        const obj = {
            nome: nome.trim(),
            cpf: cpf.trim(),
            dataNascimento: dataNascimento.trim(),
            telefone: telefone.trim(),
            email: email.trim(),
            endereco: endereco.trim(),
            observacao: observacao.trim(),
        };

        const response = editando
            ? await alteraCliente(cliente.documentoId, obj)
            : await addCliente(obj);

        setSalvando(false);

        if (response.success) {
            Alert.alert(
                "Sucesso",
                editando ? "Cliente atualizado!" : "Cliente cadastrado!",
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
                    title={editando ? "Editar Cliente" : "Novo Cliente"}
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Avatar preview */}
                    <Avatar nome={nome} size={72} style={styles.avatar} />

                    {/* Identifica��o */}
                    <SectionLabel titulo="Identifica��o" icone="person-outline" />
                    <FormField
                        label="Nome completo *"
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Ex: Maria Silva"
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
                        label="Data de nascimento"
                        value={dataNascimento}
                        onChangeText={(t) => setDataNascimento(formatarData(t))}
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

                    {/* Endere�o */}
                    <SectionLabel titulo="Endere�o" icone="location-outline" />
                    <FormField
                        label="Endere�o"
                        value={endereco}
                        onChangeText={setEndereco}
                        placeholder="Rua, n�mero, bairro, cidade"
                    />

                    {/* Observa��es */}
                    <SectionLabel titulo="Observa��es" icone="document-text-outline" />
                    <FormField
                        label="Observa��es"
                        value={observacao}
                        onChangeText={setObservacao}
                        placeholder="Informa��es adicionais sobre o cliente..."
                        multiline
                    />

                    <PrimaryButton
                        title={editando ? "Salvar altera��es" : "Cadastrar cliente"}
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