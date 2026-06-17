import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    StyleSheet
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import { Header, Card, theme, PrimaryButton, FormField, SectionLabel, EmptyState } from "../components/ui";
import { buscaTodasMovimentacoes, entradaEstoque, saidaEstoque, ajusteEstoque } from "../services/MovEstoqueService";
import { buscaVariacaoPorTexto, buscaVariacoes } from "../services/ProdutoVariacaoService";
import { buscaProdutoId, buscaProdutos } from "../services/ProdutoService";
import { buscaTodosSaldos } from "../services/SaldoVariacaoService";
import { buscaCores } from "../services/CorService";
import { buscaTams } from "../services/TamanhoService";

export default function MovimentacoesScreen({ navigation, route }) {
    const params = route?.params || {};
    const variacaoIdFiltroInicial = params.variacaoId || null;
    const produtoNomeFiltroInicial = params.produtoNome || null;
    const filtroVariacaoAtivoInicial = params.filtroVariacao || false;

    const [movimentacoes, setMovimentacoes] = useState([]);
    const [movimentacoesFiltradas, setMovimentacoesFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerType, setDatePickerType] = useState("inicio");

    // Filtro de variação
    const [filtroVariacaoTexto, setFiltroVariacaoTexto] = useState("");
    const [filtroVariacaoSelecionada, setFiltroVariacaoSelecionada] = useState(null);
    const [buscandoVariacaoFiltro, setBuscandoVariacaoFiltro] = useState(false);

    // Modal de seleção de variação (compartilhado)
    const [selecaoModalVisible, setSelecaoModalVisible] = useState(false);
    const [modoSelecao, setModoSelecao] = useState("filtro"); // "filtro" ou "movimentacao"
    const [todasVariacoes, setTodasVariacoes] = useState([]);
    const [saldosMap, setSaldosMap] = useState({});
    const [produtosMap, setProdutosMap] = useState({});
    const [buscaSelecao, setBuscaSelecao] = useState("");
    const [carregandoVariacoes, setCarregandoVariacoes] = useState(false);

    // Cores e tamanhos
    const [coresMap, setCoresMap] = useState({});
    const [tamanhosMap, setTamanhosMap] = useState({});

    // Modal de nova movimentação
    const [modalVisible, setModalVisible] = useState(false);
    const [novaMovVariacao, setNovaMovVariacao] = useState(null);
    const [buscaVariacaoTexto, setBuscaVariacaoTexto] = useState("");
    const [buscandoVariacao, setBuscandoVariacao] = useState(false);
    const [novaMovTipo, setNovaMovTipo] = useState("ENTRADA");
    const [novaMovQuantidade, setNovaMovQuantidade] = useState("");
    const [novaMovMotivo, setNovaMovMotivo] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Carrega cores e tamanhos
    useEffect(() => {
        const carregarCoresTamanhos = async () => {
            const [coresRes, tamsRes] = await Promise.all([
                buscaCores(),
                buscaTams()
            ]);
            if (coresRes.success) {
                const map = {};
                coresRes.cores.forEach(c => { map[c.id] = c.nome; });
                setCoresMap(map);
            }
            if (tamsRes.success) {
                const map = {};
                tamsRes.tams.forEach(t => { map[t.id] = t.nome; });
                setTamanhosMap(map);
            }
        };
        carregarCoresTamanhos();
    }, []);

    // Carrega movimentações
    const carregarMovimentacoes = async () => {
        setLoading(true);
        const res = await buscaTodasMovimentacoes(200);
        if (res.success) {
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
                        variacaoSku: variacao?.sku || "",
                        produtoId: variacao?.produto_id || null,
                        corNome: variacao?.cor_id ? coresMap[variacao.cor_id] || "" : "",
                        tamanhoNome: variacao?.tamanho_id ? tamanhosMap[variacao.tamanho_id] || "" : "",
                    };
                })
            );
            setMovimentacoes(movCompletas);
            aplicarFiltros(movCompletas);
        } else {
            Alert.alert("Erro", res.message);
        }
        setLoading(false);
    };

    // Aplica todos os filtros
    const aplicarFiltros = (lista) => {
        let filtradas = [...lista];

        if (filtroTipo !== "TODOS") {
            filtradas = filtradas.filter(m => m.tipo === filtroTipo);
        }

        if (filtroDataInicio) {
            filtradas = filtradas.filter(m => {
                const dataMov = m.data?.toDate();
                return dataMov && dataMov >= filtroDataInicio;
            });
        }
        if (filtroDataFim) {
            filtradas = filtradas.filter(m => {
                const dataMov = m.data?.toDate();
                return dataMov && dataMov <= filtroDataFim;
            });
        }

        if (filtroVariacaoSelecionada) {
            filtradas = filtradas.filter(m => m.variacao?.id === filtroVariacaoSelecionada.id);
        }

        setMovimentacoesFiltradas(filtradas);
    };

    useEffect(() => {
        aplicarFiltros(movimentacoes);
    }, [filtroTipo, filtroDataInicio, filtroDataFim, filtroVariacaoSelecionada, movimentacoes]);

    useEffect(() => {
        if (variacaoIdFiltroInicial && produtoNomeFiltroInicial) {
            (async () => {
                const vari = await buscaVariacaoPorTexto(String(variacaoIdFiltroInicial));
                if (vari) {
                    setFiltroVariacaoSelecionada({
                        ...vari,
                        produtoNome: produtoNomeFiltroInicial
                    });
                    setFiltroVariacaoTexto(vari.codigo || vari.sku || String(vari.id));
                }
            })();
        }
        carregarMovimentacoes();
    }, []);

    // Carrega dados para o modal de seleção
    const carregarDadosSelecao = async () => {
        setCarregandoVariacoes(true);
        try {
            const [varRes, saldoRes, prodRes] = await Promise.all([
                buscaVariacoes(),
                buscaTodosSaldos(),
                buscaProdutos()
            ]);

            if (varRes.success) setTodasVariacoes(varRes.variacoes || []);
            if (saldoRes.success) {
                const map = {};
                (saldoRes.saldos || []).forEach(s => { map[s.variacao_id] = s.quantidade; });
                setSaldosMap(map);
            }
            if (prodRes.success) {
                const map = {};
                (prodRes.produtos || []).forEach(p => { map[p.id] = p.nome; });
                setProdutosMap(map);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCarregandoVariacoes(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        carregarMovimentacoes().finally(() => setRefreshing(false));
    }, []);

    // Busca variação para o filtro
    const buscarVariacaoFiltro = async () => {
        if (!filtroVariacaoTexto.trim()) {
            Alert.alert("Atenção", "Digite o código, SKU ou ID da variação");
            return;
        }
        setBuscandoVariacaoFiltro(true);
        const vari = await buscaVariacaoPorTexto(filtroVariacaoTexto.trim());
        if (vari) {
            const prod = await buscaProdutoId(vari.produto_id);
            setFiltroVariacaoSelecionada({
                ...vari,
                produtoNome: prod?.nome || "Produto"
            });
        } else {
            Alert.alert("Não encontrado", "Nenhuma variação com esse código, SKU ou ID");
            setFiltroVariacaoSelecionada(null);
        }
        setBuscandoVariacaoFiltro(false);
    };

    // Abre modal de seleção para o filtro
    const abrirSelecaoFiltro = () => {
        setModoSelecao("filtro");
        setSelecaoModalVisible(true);
        if (todasVariacoes.length === 0) carregarDadosSelecao();
    };

    // Abre modal de seleção para nova movimentação
    const abrirSelecaoMovimentacao = () => {
        setModoSelecao("movimentacao");
        setSelecaoModalVisible(true);
        if (todasVariacoes.length === 0) carregarDadosSelecao();
    };

    // Seleciona variação do modal (comportamento depende do modo)
    const selecionarVariacaoModal = (variacao) => {
        const produtoNome = produtosMap[variacao.produto_id] || "Produto";
        if (modoSelecao === "filtro") {
            setFiltroVariacaoSelecionada({
                ...variacao,
                produtoNome
            });
            setFiltroVariacaoTexto(variacao.codigo || variacao.sku || String(variacao.id));
        } else {
            // modo movimentacao
            setNovaMovVariacao({ ...variacao, produtoNome });
            setBuscaVariacaoTexto("");
        }
        setSelecaoModalVisible(false);
        setBuscaSelecao("");
    };

    // Limpa o filtro de variação
    const limparFiltroVariacao = () => {
        setFiltroVariacaoSelecionada(null);
        setFiltroVariacaoTexto("");
        navigation.setParams({
            variacaoId: null,
            produtoNome: null,
            filtroVariacao: false
        });
    };

    // Busca variação para nova movimentação
    const buscarVariacao = async () => {
        if (!buscaVariacaoTexto.trim()) {
            Alert.alert("Atenção", "Digite o código, SKU ou ID da variação");
            return;
        }
        setBuscandoVariacao(true);
        const vari = await buscaVariacaoPorTexto(buscaVariacaoTexto.trim());
        if (vari) {
            const prod = await buscaProdutoId(vari.produto_id);
            setNovaMovVariacao({ ...vari, produtoNome: prod?.nome || "Produto" });
        } else {
            Alert.alert("Não encontrado", "Nenhuma variação com esse código, SKU ou ID");
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
        const idNumerico = novaMovVariacao.id;
        if (novaMovTipo === "ENTRADA") {
            result = await entradaEstoque(idNumerico, qtd, novaMovMotivo || "Entrada manual");
        } else if (novaMovTipo === "SAIDA") {
            result = await saidaEstoque(idNumerico, qtd, novaMovMotivo || "Saída manual");
        } else {
            result = await ajusteEstoque(idNumerico, qtd, novaMovMotivo || "Ajuste manual");
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

    // Filtros rápidos de data
    const aplicarFiltroData = (tipo) => {
        const hoje = new Date();
        let inicio = null, fim = null;
        if (tipo === "hoje") {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            inicio.setHours(0, 0, 0, 0);
            fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
        } else if (tipo === "semana") {
            const dia = hoje.getDay();
            const diff = hoje.getDate() - dia + (dia === 0 ? -6 : 1);
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), diff);
            inicio.setHours(0, 0, 0, 0);
            fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
        } else if (tipo === "mes") {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            inicio.setHours(0, 0, 0, 0);
            fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
        }
        setFiltroDataInicio(inicio);
        setFiltroDataFim(fim);
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
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, flexWrap: "wrap" }}>
                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.produtoNome}</Text>
                            {item.tamanhoNome && (
                                <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: 12, color: theme.colors.primary }}>{item.tamanhoNome}</Text>
                                </View>
                            )}
                            {item.corNome && (
                                <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: 12, color: theme.colors.primary }}>{item.corNome}</Text>
                                </View>
                            )}
                        </View>
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
                    {item.motivo && <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>Motivo: {item.motivo}</Text>}
                    <Text style={{ fontSize: 11, color: theme.colors.muted, marginTop: 4 }}>{data?.toLocaleString()}</Text>
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
                <Header
                    title={filtroVariacaoSelecionada ? `Mov. de ${filtroVariacaoSelecionada.produtoNome || filtroVariacaoSelecionada.codigo}` : "Movimentações de Estoque"}
                    onBack={() => navigation.goBack()}
                    rightComponent={
                        filtroVariacaoSelecionada ? (
                            <TouchableOpacity onPress={limparFiltroVariacao} style={{ marginRight: 16 }}>
                                <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semiBold }}>Limpar</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />

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
                        zIndex: 10,
                    }}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={{ color: "#fff", fontSize: 24 }}>+</Text>
                </TouchableOpacity>

                <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, marginBottom: 8 }}>Filtros</Text>

                        {/* Filtro por variação */}
                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    borderRadius: theme.radius.md,
                                    padding: 10,
                                    backgroundColor: theme.colors.surface,
                                }}
                                placeholder="Código, SKU ou ID da variação"
                                value={filtroVariacaoTexto}
                                onChangeText={setFiltroVariacaoTexto}
                            />
                            <TouchableOpacity
                                style={{ padding: 10, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }}
                                onPress={buscarVariacaoFiltro}
                                disabled={buscandoVariacaoFiltro}
                            >
                                <Text>{buscandoVariacaoFiltro ? "..." : "Buscar"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ padding: 10, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }}
                                onPress={abrirSelecaoFiltro}
                            >
                                <Ionicons name="list" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {filtroVariacaoSelecionada && (
                            <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, padding: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                                    <Text style={{ fontFamily: theme.fonts.semiBold, color: theme.colors.primaryDark }}>
                                        {filtroVariacaoSelecionada.produtoNome || "Produto"}
                                    </Text>
                                    {filtroVariacaoSelecionada.tamanho_id && (
                                        <Text style={{ fontFamily: theme.fonts.bold, fontSize: 14, color: theme.colors.primary, marginLeft: 8 }}>
                                            {tamanhosMap[filtroVariacaoSelecionada.tamanho_id] || ""}
                                        </Text>
                                    )}
                                    {filtroVariacaoSelecionada.cor_id && (
                                        <Text style={{ fontFamily: theme.fonts.bold, fontSize: 12, color: theme.colors.primary, marginLeft: 4 }}>
                                            {coresMap[filtroVariacaoSelecionada.cor_id] || ""}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity onPress={limparFiltroVariacao}>
                                    <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginRight: 8 }} onPress={() => aplicarFiltroData("hoje")}>
                                <Text>Hoje</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginRight: 8 }} onPress={() => aplicarFiltroData("semana")}>
                                <Text>Esta semana</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginRight: 8 }} onPress={() => aplicarFiltroData("mes")}>
                                <Text>Este mês</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }} onPress={() => setShowDatePicker(true)}>
                                <Text>📅 Período</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Picker
                                    selectedValue={filtroTipo}
                                    onValueChange={setFiltroTipo}
                                    style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }}
                                >
                                    <Picker.Item label="Todos" value="TODOS" />
                                    <Picker.Item label="Entradas" value="ENTRADA" />
                                    <Picker.Item label="Saídas" value="SAIDA" />
                                    <Picker.Item label="Ajustes +" value="AJUSTE_ENTRADA" />
                                    <Picker.Item label="Ajustes -" value="AJUSTE_SAIDA" />
                                </Picker>
                            </View>
                            {(filtroDataInicio || filtroDataFim) && (
                                <TouchableOpacity
                                    style={{ padding: 8, backgroundColor: theme.colors.danger + "20", borderRadius: theme.radius.md, justifyContent: "center" }}
                                    onPress={() => { setFiltroDataInicio(null); setFiltroDataFim(null); }}
                                >
                                    <Text style={{ color: theme.colors.danger }}>Limpar datas</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {(filtroDataInicio || filtroDataFim) && (
                            <Text style={{ fontSize: 12, marginTop: 4 }}>
                                {filtroDataInicio?.toLocaleDateString()} → {filtroDataFim?.toLocaleDateString()}
                            </Text>
                        )}
                    </View>

                    <FlatList
                        data={movimentacoesFiltradas}
                        keyExtractor={item => item.documentoId}
                        renderItem={renderMovimentacao}
                        ListEmptyComponent={<EmptyState mensagem="Nenhuma movimentação encontrada" />}
                        scrollEnabled={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    />
                </ScrollView>

                {/* Modal de seleção de variação (usado tanto para filtro quanto para nova movimentação) */}
                <Modal visible={selecaoModalVisible} animationType="slide" transparent={false}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        <Header title="Selecionar Variação" onBack={() => setSelecaoModalVisible(false)} />
                        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                            <TextInput
                                style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 10, fontFamily: theme.fonts.regular, fontSize: 14 }}
                                placeholder="Buscar por produto, código ou SKU"
                                value={buscaSelecao}
                                onChangeText={setBuscaSelecao}
                            />
                        </View>
                        {carregandoVariacoes ? (
                            <ActivityIndicator style={{ marginTop: 20 }} size="large" color={theme.colors.primary} />
                        ) : (
                            <FlatList
                                data={todasVariacoes.filter(v => {
                                    const nomeProd = produtosMap[v.produto_id] || "";
                                    const termo = buscaSelecao.toLowerCase();
                                    return nomeProd.toLowerCase().includes(termo) ||
                                        (v.codigo || "").toLowerCase().includes(termo) ||
                                        (v.sku || "").toLowerCase().includes(termo);
                                })}
                                keyExtractor={item => item.documentoId}
                                renderItem={({ item }) => {
                                    const saldo = saldosMap[item.id] || 0;
                                    const nomeProd = produtosMap[item.produto_id] || "Produto";
                                    const tamanhoNome = item.tamanho_id ? tamanhosMap[item.tamanho_id] || "" : "";
                                    const corNome = item.cor_id ? coresMap[item.cor_id] || "" : "";
                                    return (
                                        <TouchableOpacity
                                            style={{
                                                padding: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: theme.colors.border,
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                            onPress={() => selecionarVariacaoModal(item)}
                                        >
                                            <View>
                                                <Text style={{ fontWeight: "bold" }}>
                                                    {nomeProd}
                                                    {tamanhoNome ? <Text style={{ color: theme.colors.primary, marginLeft: 6 }}> | {tamanhoNome}</Text> : null}
                                                    {corNome ? <Text style={{ color: theme.colors.primary, marginLeft: 4 }}> | {corNome}</Text> : null}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                                    Código: {item.codigo} | SKU: {item.sku}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>Saldo: {saldo}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={<EmptyState mensagem="Nenhuma variação encontrada" />}
                            />
                        )}
                    </SafeAreaView>
                </Modal>

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
                                        backgroundColor: theme.colors.surface,
                                    }}
                                    placeholder="Código, SKU ou ID"
                                    value={buscaVariacaoTexto}
                                    onChangeText={setBuscaVariacaoTexto}
                                />
                                <TouchableOpacity style={{ padding: 10, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }} onPress={buscarVariacao}>
                                    <Text>Buscar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 10, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }} onPress={abrirSelecaoMovimentacao}>
                                    <Ionicons name="list" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                            {buscandoVariacao && <ActivityIndicator />}
                            {novaMovVariacao && (
                                <Card style={{ marginBottom: 12 }}>
                                    <Text style={{ fontWeight: "bold" }}>{novaMovVariacao.produtoNome}</Text>
                                    <Text>Código: {novaMovVariacao.codigo}</Text>
                                    <Text>SKU: {novaMovVariacao.sku}</Text>
                                    <Text>ID: {novaMovVariacao.id}</Text>
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

                            <FormField label={novaMovTipo === "AJUSTE" ? "Nova quantidade" : "Quantidade"} value={novaMovQuantidade} onChangeText={setNovaMovQuantidade} keyboardType="numeric" />
                            <FormField label="Motivo (opcional)" value={novaMovMotivo} onChangeText={setNovaMovMotivo} placeholder="Ex: Compra NF 123, Venda balcão" />
                            <PrimaryButton title="Registrar" onPress={registrarMovimentacao} loading={salvando} style={{ marginTop: 20 }} />
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