import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import { Header, Card, theme, PrimaryButton, FormField, SectionLabel, EmptyState } from "../components/ui";
import { buscaTodasMovimentacoes, entradaEstoque, saidaEstoque, ajusteEstoque } from "../services/MovEstoqueService";
import { buscaVariacaoPorTexto } from "../services/ProdutoVariacaoService";
import { buscaProdutoId } from "../services/ProdutoService";

export default function MovimentacoesScreen({ navigation }) {
    // Estado das movimentações
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [movimentacoesFiltradas, setMovimentacoesFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerType, setDatePickerType] = useState("inicio");

    // Modal de nova movimentação
    const [modalVisible, setModalVisible] = useState(false);
    const [novaMovVariacao, setNovaMovVariacao] = useState(null);
    const [buscaVariacaoTexto, setBuscaVariacaoTexto] = useState("");
    const [buscandoVariacao, setBuscandoVariacao] = useState(false);
    const [novaMovTipo, setNovaMovTipo] = useState("ENTRADA");
    const [novaMovQuantidade, setNovaMovQuantidade] = useState("");
    const [novaMovMotivo, setNovaMovMotivo] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Carrega todas as movimentações
    const carregarMovimentacoes = async () => {
        setLoading(true);
        const res = await buscaTodasMovimentacoes(100); // pega últimas 100
        if (res.success) {
            // Enriquece com dados de produto/variação
            const movCompletas = await Promise.all(
                res.movimentacoes.map(async (mov) => {
                    const variacao = await buscaVariacaoPorTexto(mov.variacao_id.toString());
                    let produto = null;
                    if (variacao?.produto_id) {
                        produto = await buscaProdutoId(variacao.produto_id); 
                    }

                    return {
                        ...mov,
                        variacao,
                        produtoNome: produto?.nome || "Produto não encontrado",
                        variacaoCodigo: variacao?.codigo || "",
                        variacaoSku: variacao?.sku || ""
                    };
                })
            );
            setMovimentacoes(movCompletas);
            setMovimentacoesFiltradas(movCompletas);
        } else {
            Alert.alert("Erro", res.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        carregarMovimentacoes();
    }, []);

    // Aplica filtros
    useEffect(() => {
        let filtradas = [...movimentacoes];

        // Filtro por tipo
        if (filtroTipo !== "TODOS") {
            filtradas = filtradas.filter(m => m.tipo === filtroTipo);
        }

        // Filtro por data
        if (filtroDataInicio) {
            filtradas = filtradas.filter(m => {
                const dataMov = m.data?.toDate();
                return dataMov >= filtroDataInicio;
            });
        }
        if (filtroDataFim) {
            filtradas = filtradas.filter(m => {
                const dataMov = m.data?.toDate();
                return dataMov <= filtroDataFim;
            });
        }

        setMovimentacoesFiltradas(filtradas);
    }, [filtroTipo, filtroDataInicio, filtroDataFim, movimentacoes]);

    // Busca variação para nova movimentação
    const buscarVariacao = async () => {
        if (!buscaVariacaoTexto.trim()) {
            Alert.alert("Atenção", "Digite o código ou SKU da variação");
            return;
        }
        setBuscandoVariacao(true);
        const vari = await buscaVariacaoPorTexto(buscaVariacaoTexto);
        if (vari) {
            setNovaMovVariacao(vari);
        } else {
            Alert.alert("Não encontrado", "Nenhuma variação com esse código ou SKU");
            setNovaMovVariacao(null);
        }
        setBuscandoVariacao(false);
    };

    const registrarMovimentacao = async () => {
        if (!novaMovVariacao) {
            Alert.alert("Erro", "Selecione uma variação");
            return;
        }
        const qtd = parseInt(novaMovQuantidade);
        if (isNaN(qtd) || qtd <= 0) {
            Alert.alert("Erro", "Quantidade inválida");
            return;
        }
        setSalvando(true);
        let result;
        if (novaMovTipo === "ENTRADA") {
            result = await entradaEstoque(novaMovVariacao.id, qtd, novaMovMotivo || "Entrada manual");
        } else if (novaMovTipo === "SAIDA") {
            result = await saidaEstoque(novaMovVariacao.id, qtd, novaMovMotivo || "Saída manual");
        } else {
            result = await ajusteEstoque(novaMovVariacao.id, qtd, novaMovMotivo || "Ajuste manual");
        }
        setSalvando(false);
        if (result.success) {
            Alert.alert("Sucesso", result.message);
            setModalVisible(false);
            resetForm();
            carregarMovimentacoes();
        } else {
            Alert.alert("Erro", result.message);
        }
    };

    const resetForm = () => {
        setNovaMovVariacao(null);
        setBuscaVariacaoTexto("");
        setNovaMovTipo("ENTRADA");
        setNovaMovQuantidade("");
        setNovaMovMotivo("");
    };

    const renderMovimentacao = ({ item }) => {
        const data = item.data?.toDate();
        const tipoLabel = {
            ENTRADA: "Entrada",
            SAIDA: "Saída",
            AJUSTE_ENTRADA: "Ajuste +",
            AJUSTE_SAIDA: "Ajuste -"
        }[item.tipo] || item.tipo;
        const corTipo = {
            ENTRADA: "#4CAF50",
            SAIDA: "#F44336",
            AJUSTE_ENTRADA: "#FF9800",
            AJUSTE_SAIDA: "#FF9800"
        }[item.tipo] || theme.colors.muted;

        return (
            <Card style={{ marginBottom: 12 }}>
                <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>
                            {item.produtoNome}
                        </Text>
                        <View style={{ backgroundColor: corTipo + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ color: corTipo, fontFamily: theme.fonts.semiBold, fontSize: 12 }}>{tipoLabel}</Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 13, color: theme.colors.muted, marginTop: 4 }}>
                        Código: {item.variacaoCodigo} | SKU: {item.variacaoSku}
                    </Text>
                    <Text style={{ fontSize: 14, marginTop: 6 }}>
                        Quantidade: <Text style={{ fontWeight: "bold" }}>{item.quantidade}</Text>
                    </Text>
                    {item.motivo && (
                        <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                            Motivo: {item.motivo}
                        </Text>
                    )}
                    <Text style={{ fontSize: 11, color: theme.colors.muted, marginTop: 4 }}>
                        {data?.toLocaleString()}
                    </Text>
                </View>
            </Card>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title="Movimentações de Estoque" onBack={() => navigation.goBack()} />

                {/* Botão flutuante para nova movimentação */}
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        bottom: 20,
                        right: 20,
                        backgroundColor: theme.colors.primary,
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        elevation: 5,
                        zIndex: 10
                    }}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={{ color: "#fff", fontSize: 24 }}>+</Text>
                </TouchableOpacity>

                <ScrollView style={{ padding: 16 }}>
                    {/* Filtros */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, marginBottom: 8 }}>Filtros</Text>
                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    padding: 10,
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.radius.md,
                                    alignItems: "center"
                                }}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text>📅 Período</Text>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Picker
                                    selectedValue={filtroTipo}
                                    onValueChange={setFiltroTipo}
                                    style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }}
                                >
                                    <Picker.Item label="Todos" value="TODOS" />
                                    <Picker.Item label="Entradas" value="ENTRADA" />
                                    <Picker.Item label="Saídas" value="SAIDA" />
                                    <Picker.Item label="Ajustes" value="AJUSTE_ENTRADA" />
                                </Picker>
                            </View>
                        </View>
                        {(filtroDataInicio || filtroDataFim) && (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text style={{ fontSize: 12 }}>
                                    {filtroDataInicio?.toLocaleDateString()} → {filtroDataFim?.toLocaleDateString()}
                                </Text>
                                <TouchableOpacity onPress={() => { setFiltroDataInicio(null); setFiltroDataFim(null); }}>
                                    <Text style={{ color: theme.colors.danger }}>Limpar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Lista de movimentações */}
                    <FlatList
                        data={movimentacoesFiltradas}
                        keyExtractor={item => item.documentoId}
                        renderItem={renderMovimentacao}
                        ListEmptyComponent={<EmptyState mensagem="Nenhuma movimentação encontrada" />}
                        scrollEnabled={false}
                    />
                </ScrollView>

                {/* Modal de nova movimentação */}
                <Modal visible={modalVisible} animationType="slide" transparent={false}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        <Header title="Nova Movimentação" onBack={() => setModalVisible(false)} />
                        <ScrollView style={{ padding: 16 }}>
                            <SectionLabel titulo="Variação" icone="pricetag" />
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                        borderRadius: theme.radius.md,
                                        padding: 10,
                                        backgroundColor: theme.colors.surface
                                    }}
                                    placeholder="Digite código ou SKU"
                                    value={buscaVariacaoTexto}
                                    onChangeText={setBuscaVariacaoTexto}
                                />
                                <TouchableOpacity
                                    style={{ padding: 10, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }}
                                    onPress={buscarVariacao}
                                >
                                    <Text>Buscar</Text>
                                </TouchableOpacity>
                            </View>
                            {buscandoVariacao && <ActivityIndicator />}
                            {novaMovVariacao && (
                                <Card style={{ marginBottom: 12 }}>
                                    <Text>Código: {novaMovVariacao.codigo}</Text>
                                    <Text>SKU: {novaMovVariacao.sku}</Text>
                                </Card>
                            )}

                            <SectionLabel titulo="Tipo" icone="swap" />
                            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, marginBottom: 12 }}>
                                <Picker selectedValue={novaMovTipo} onValueChange={setNovaMovTipo}>
                                    <Picker.Item label="Entrada (compra, devolução)" value="ENTRADA" />
                                    <Picker.Item label="Saída (venda, perda)" value="SAIDA" />
                                    <Picker.Item label="Ajuste (definir quantidade exata)" value="AJUSTE" />
                                </Picker>
                            </View>

                            <FormField
                                label={novaMovTipo === "AJUSTE" ? "Nova quantidade" : "Quantidade"}
                                value={novaMovQuantidade}
                                onChangeText={setNovaMovQuantidade}
                                keyboardType="numeric"
                            />
                            <FormField
                                label="Motivo (opcional)"
                                value={novaMovMotivo}
                                onChangeText={setNovaMovMotivo}
                                placeholder="Ex: Compra NF 123, Venda balcão"
                            />
                            <PrimaryButton
                                title="Registrar"
                                onPress={registrarMovimentacao}
                                loading={salvando}
                                style={{ marginTop: 20 }}
                            />
                        </ScrollView>
                    </SafeAreaView>
                </Modal>

                {showDatePicker && (
                    <DateTimePicker
                        value={filtroDataInicio || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (datePickerType === "inicio") {
                                setFiltroDataInicio(selectedDate);
                                setDatePickerType("fim");
                                setShowDatePicker(true);
                            } else {
                                setFiltroDataFim(selectedDate);
                                setDatePickerType("inicio");
                            }
                        }}
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}