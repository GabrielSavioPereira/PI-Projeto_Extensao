import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer, Header, SearchBar, EmptyState, FAB, theme } from "../components/ui";
import { buscaProdutos, deletaProduto } from "../services/ProdutoService";
import { buscaVariacoesPorProduto, deletaVariacao } from "../services/ProdutoVariacaoService";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProdutoListScreen({ navigation }) {
    const [produtos, setProdutos] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [variacoesCache, setVariacoesCache] = useState({});
    const [loadingVariacoes, setLoadingVariacoes] = useState({});

    const carregarProdutos = async () => {
        setLoading(true);
        const res = await buscaProdutos();
        if (res.success) setProdutos(res.produtos);
        else Alert.alert("Erro", res.message);
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", carregarProdutos);
        return unsubscribe;
    }, [navigation]);

    const toggleExpand = async (produtoId) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedId === produtoId) {
            setExpandedId(null);
        } else {
                setLoadingVariacoes(prev => ({ ...prev, [produtoId]: true }));
                const res = await buscaVariacoesPorProduto(produtoId);
                if (res.success) {
                    setVariacoesCache(prev => ({ ...prev, [produtoId]: res.variacoes }));
                } else {
                    setVariacoesCache(prev => ({ ...prev, [produtoId]: [] }));
                    Alert.alert("Erro", res.message);
                }  
                setLoadingVariacoes(prev => ({ ...prev, [produtoId]: false }));
            setExpandedId(produtoId);
        }
    };

    const handleDelete = (produto) => {
        Alert.alert("Excluir", `Remover ${produto.nome}?`, [
            { text: "Cancelar" },
            {
                text: "Excluir",
                onPress: async () => {
                    const res = await deletaProduto(produto.documentoId);
                    if (res.success) {
                        carregarProdutos();
                        setVariacoesCache(prev => {
                            const newCache = { ...prev };
                            delete newCache[produto.id];
                            return newCache;
                        });
                        if (expandedId === produto.id) setExpandedId(null);
                    } else {
                        Alert.alert("Erro", res.message);
                    }
                }
            }
        ]);
    };

    const excluirVariacao = (variacao, produtoId) => {
        Alert.alert("Excluir", `Remover ${variacao.sku}?`, [
            { text: "Cancelar" },
            {
                text: "Excluir",
                onPress: async () => {
                    const res = await deletaVariacao(variacao.documentoId);
                    if (res.success) {
                        const novasVariacoes = await buscaVariacoesPorProduto(produtoId);
                        if (novasVariacoes.success) {
                            setVariacoesCache(prev => ({ ...prev, [produtoId]: novasVariacoes.variacoes }));
                        } else {
                            setVariacoesCache(prev => ({ ...prev, [produtoId]: [] }));
                        }
                    } else {
                        Alert.alert("Erro", res.message);
                    }
                }
            }
        ]);
    };

    const produtosFiltrados = produtos.filter(p =>
        p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo?.includes(busca)
    );

    const renderVariacao = (variacao, produtoId) => (
        <TouchableOpacity
            key={variacao.documentoId}
            style={styles.variacaoItem}
            onPress={() => navigation.navigate("ProdutoVariacao", { variacao, produtoFixo: { id: produtoId } })}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Ionicons name="color-palette-outline" size={14} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.variacaoText}>
                        Cor: {variacao.cor_id} | Tam: {variacao.tamanho_id}
                    </Text>
                    <Text style={styles.variacaoSku}>SKU: {variacao.sku}</Text>
                </View>
            </View>

            <View style={{
                display: "flex",
                justifyContent: "center",
                gap: "10"

            }}>
                <TouchableOpacity onPress={() => excluirVariacao(variacao, produtoId)} style={styles.excVariacao}>
                    <Ionicons name="trash-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.variacaoPreco}>
                    R$ {variacao.preco_venda?.toFixed(2) ?? "0,00"}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderItem = ({ item: produto }) => {
        const isExpanded = expandedId === produto.id;
        const variacoes = variacoesCache[produto.id] || [];
        const isLoading = loadingVariacoes[produto.id];

        return (
            <View style={styles.produtoCard}>
                <TouchableOpacity
                    style={styles.produtoHeader}
                    onPress={() => toggleExpand(produto.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.produtoInfo}>
                        <Text style={styles.produtoNome}>{produto.nome}</Text>
                        <Text style={styles.produtoCodigo}>Código: {produto.codigo}</Text>
                        <Text style={styles.produtoPreco}>R$ {produto.preco_venda?.toFixed(2)}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate("ProdutoForm", { produto })} style={styles.iconButton}>
                            <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(produto)} style={styles.iconButton}>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                        </TouchableOpacity>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.muted} />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.variacoesContainer}>
                        <View style={styles.variacoesHeader}>
                            <Text style={styles.variacoesTitulo}>Variações</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("ProdutoVariacao", { produtoFixo: produto })} style={styles.addVariacaoBtn}>
                                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.addVariacaoText}>Nova</Text>
                            </TouchableOpacity>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : variacoes.length === 0 ? (
                            <Text style={styles.semVariacoes}>Nenhuma variação cadastrada</Text>
                        ) : (
                            variacoes.map(v => renderVariacao(v, produto.id))
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <ScreenContainer>
                <Header title="Produtos" />
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <Header title="Produtos" />
            <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar por nome ou código" />
            <FlatList
                data={produtosFiltrados}
                keyExtractor={item => item.documentoId}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                ListEmptyComponent={<EmptyState mensagem="Nenhum produto encontrado" />}
            />
            <FAB onPress={() => navigation.navigate("ProdutoForm")} />
        </ScreenContainer>
    );
}

const styles = {
    produtoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        overflow: "hidden",
        ...theme.shadow,
    },
    produtoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    produtoInfo: { flex: 1 },
    produtoNome: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 16,
        color: theme.colors.text,
    },
    produtoCodigo: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 2,
    },
    produtoPreco: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 14,
        color: theme.colors.primary,
        marginTop: 4,
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconButton: { padding: 4 },
    variacoesContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: 12,
        backgroundColor: theme.colors.background,
    },
    variacoesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    variacoesTitulo: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.secondary,
    },
    addVariacaoBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addVariacaoText: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.primary,
    },
    variacaoItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
    },
    variacaoText: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: theme.colors.text,
    },
    variacaoSku: {
        fontFamily: theme.fonts.regular,
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 2,
    },
    variacaoPreco: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.primary,
    },
    semVariacoes: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
        textAlign: "center",
        paddingVertical: 10,
    },
    excVariacao: {
        alignItems: "flex-end"
    }
};