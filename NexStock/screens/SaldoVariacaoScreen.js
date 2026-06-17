import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StyleSheet
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Header, SearchBar, Card, theme, EmptyState } from "../components/ui";
import { buscaTodosSaldos } from "../services/SaldoVariacaoService";
import { buscaVariacoes } from "../services/ProdutoVariacaoService";
import { buscaProdutos } from "../services/ProdutoService";
import { buscaCores } from "../services/CorService";
import { buscaTams } from "../services/TamanhoService";

export default function SaldoEstoqueScreen({ navigation }) {
    const [itens, setItens] = useState([]);
    const [itensFiltrados, setItensFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busca, setBusca] = useState("");

    const carregarDados = async () => {
        try {
            const [saldosRes, variacoesRes, produtosRes] = await Promise.all([
                buscaTodosSaldos(),
                buscaVariacoes(),
                buscaProdutos()
            ]);

            const saldosList = (saldosRes?.success && Array.isArray(saldosRes.saldos)) ? saldosRes.saldos : [];
            const variacoesList = (variacoesRes?.success && Array.isArray(variacoesRes.variacoes)) ? variacoesRes.variacoes : [];
            const produtosList = (produtosRes?.success && Array.isArray(produtosRes.produtos)) ? produtosRes.produtos : [];

            const variacoesMap = {};
            variacoesList.forEach(v => { variacoesMap[v.id] = v; });

            const produtosMap = {};
            produtosList.forEach(p => { produtosMap[p.id] = p; });

            const items = saldosList.map(saldo => {
                const variacao = variacoesMap[saldo.variacao_id];
                const produto = variacao ? produtosMap[variacao.produto_id] : null;
                return {
                    variacaoId: saldo.variacao_id,
                    quantidade: saldo.quantidade || 0,
                    codigo: variacao?.codigo || "---",
                    sku: variacao?.sku || "---",
                    corId: variacao?.cor_id ?? "?",
                    tamId: variacao?.tamanho_id ?? "?",
                    produtoId: variacao?.produto_id,
                    produtoNome: produto?.nome || "Produto não encontrado",
                    documentoId: saldo.documentoId,
                };
            });

            // Ordena por nome do produto
            items.sort((a, b) => a.produtoNome.localeCompare(b.produtoNome));
            setItens(items);
            setItensFiltrados(items);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível carregar os saldos");
            setItens([]);
            setItensFiltrados([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        if (!busca.trim()) {
            setItensFiltrados(itens);
            return;
        }
        const termo = busca.toLowerCase();
        const filtrados = itens.filter(item =>
            item.produtoNome.toLowerCase().includes(termo) ||
            item.codigo.toLowerCase().includes(termo) ||
            item.sku.toLowerCase().includes(termo)
        );
        setItensFiltrados(filtrados);
    }, [busca, itens]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        carregarDados();
    }, []);

    const verMovimentacoes = (variacaoId, produtoNome, codigo, sku) => {
        navigation.navigate("MovimentacaoEstoque", {
            variacaoId: variacaoId,
            produtoNome: produtoNome,
            codigo: codigo,
            sku: sku,
            filtroVariacao: true,
        });
    };

    const [cores, setCores] = useState([]);
    
    const buscaCor = (id) => {
        const cor = cores.find(c => c.id === id);

        return cor.nome
    }

    const [tams, setTams] = useState([]);

    const buscaTamanho = (id) => {
        const tam = tams.find(t => t.id === id);

        return tam.nome
    }

    useEffect(() => {
        const carregarCores = async () => {
            
            const res = await buscaCores();

            if (!res.success) {
                setCores(null)
            }

            setCores(res.cores);
        };

        const carregarTamanhos = async () => {
            const res = await buscaTams();

            setTams(res.tams)
        }

        carregarTamanhos();
        carregarCores();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => verMovimentacoes(item.variacaoId, item.produtoNome, item.codigo, item.sku)}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.produtoNome}>{item.produtoNome}</Text>
                <Text style={styles.quantidade}>{item.quantidade}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.detalhe}>
                    <Ionicons name="pricetag-outline" size={14} color={theme.colors.muted} /> Cód: {item.codigo}
                </Text>
                <Text style={styles.detalhe}>
                    <Ionicons name="barcode-outline" size={14} color={theme.colors.muted} /> SKU: {item.sku}
                </Text>
                <Text style={styles.detalhe}>
                    <Ionicons name="color-palette-outline" size={14} color={theme.colors.muted} /> Cor: {buscaCor(item.corId)} | Tam: {buscaTamanho(item.tamId)}
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.verMovimentacoes}>Ver movimentações →</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12 }}>Carregando saldos...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title="Saldo em Estoque" />
                <SearchBar
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="Buscar por produto, código ou SKU"
                />
                <FlatList
                    data={itensFiltrados}
                    keyExtractor={item => String(item.variacaoId)}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<EmptyState mensagem="Nenhum saldo encontrado" />}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        ...theme.shadow,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    produtoNome: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 16,
        color: theme.colors.text,
        flex: 1,
    },
    quantidade: {
        fontFamily: theme.fonts.bold,
        fontSize: 22,
        color: theme.colors.primary,
        marginLeft: 8,
    },
    cardBody: {
        marginTop: 4,
    },
    detalhe: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: theme.colors.secondary,
        marginVertical: 2,
    },
    cardFooter: {
        marginTop: 8,
        alignItems: "flex-end",
    },
    verMovimentacoes: {
        fontFamily: theme.fonts.medium,
        fontSize: 13,
        color: theme.colors.primary,
    },
});