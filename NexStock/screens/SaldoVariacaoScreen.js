import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Header, SearchBar, Card, theme, EmptyState } from "../components/ui";
import { buscaTodosSaldos } from "../services/SaldoVariacaoService";
import { buscaVariacaoPorTexto } from "../services/ProdutoVariacaoService";
import { buscaProdutoId } from "../services/ProdutoService";

export default function SaldoEstoqueScreen({ navigation }) {
    const [lista, setLista] = useState([]);
    const [listaFiltrada, setListaFiltrada] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busca, setBusca] = useState("");

    const carregarDados = async () => {
        try {
            // 1. Busca todos os saldos
            const saldosRes = await buscaTodosSaldos();
            if (!saldosRes.success) throw new Error(saldosRes.message);
            const saldos = saldosRes.saldos || [];

            // 2. Para cada saldo, busca variação e produto
            const items = [];
            for (const saldo of saldos) {
                let item = {
                    id: saldo.documentoId,
                    variacaoId: saldo.variacao_id,
                    quantidade: saldo.quantidade,
                    codigo: "---",
                    sku: "---",
                    corId: "?",
                    tamId: "?",
                    produtoId: null,
                    produtoNome: "Carregando..."
                };

                // Busca a variação usando o variacao_id (que é numérico)
                const variacao = await buscaVariacaoPorTexto(String(saldo.variacao_id));
                if (variacao) {
                    item.codigo = variacao.codigo || "---";
                    item.sku = variacao.sku || "---";
                    item.corId = variacao.cor_id ?? "?";
                    item.tamId = variacao.tamanho_id ?? "?";
                    item.produtoId = variacao.produto_id;

                    // Busca o produto
                    if (item.produtoId) {
                        const produtoRes = await buscaProdutoId(item.produtoId);
                        if (produtoRes) {
                            item.produtoNome = produtoRes.nome;
                        } else {
                            item.produtoNome = "Produto não encontrado";
                        }
                    } else {
                        item.produtoNome = "Sem produto associado";
                    }
                } else {
                    item.produtoNome = `Variação não encontrada (ID: ${saldo.variacao_id})`;
                }

                items.push(item);
            }

            setLista(items);
            setListaFiltrada(items);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível carregar os saldos");
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
            setListaFiltrada(lista);
        } else {
            const termo = busca.toLowerCase();
            const filtrados = lista.filter(item =>
                item.produtoNome.toLowerCase().includes(termo) ||
                item.codigo.toLowerCase().includes(termo) ||
                item.sku.toLowerCase().includes(termo)
            );
            setListaFiltrada(filtrados);
        }
    }, [busca, lista]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        carregarDados();
    }, []);

    const verMovimentacoes = (item) => {
        navigation.navigate("MovimentacaoEstoque", {
            variacaoId: item.variacaoId,
            variacaoCodigo: item.codigo,
            variacaoSku: item.sku,
            produtoNome: item.produtoNome,
            saldoAtual: item.quantidade
        });
    };

    const renderItem = ({ item }) => (
        <Card style={{ marginBottom: 12 }}>
            <TouchableOpacity onPress={() => verMovimentacoes(item)} activeOpacity={0.7}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16 }}>{item.produtoNome}</Text>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.primary }}>
                            Código: {item.codigo} | SKU: {item.sku}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.muted }}>
                            Cor: {item.corId} | Tam: {item.tamId}
                        </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 22, color: theme.colors.primary }}>
                            {item.quantidade}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.colors.muted }}>unidades</Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary }}>Ver movimentações →</Text>
                </View>
            </TouchableOpacity>
        </Card>
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
                <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por produto, código ou SKU" />
                <FlatList
                    data={listaFiltrada}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<EmptyState mensagem="Nenhum saldo encontrado" />}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}