import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Header, Card, EmptyState, theme } from "../components/ui";
import { buscaVendasDoMes } from "../services/VendaService";

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FORMAS_LABEL = {
    dinheiro: "Dinheiro",
    pix:      "PIX",
    debito:   "Débito",
    credito:  "Crédito",
    boleto:   "Boleto",
};

export default function VendasMesScreen({ navigation }) {
    const hoje    = new Date();
    const [mes, setMes]       = useState(hoje.getMonth() + 1);  // 1–12
    const [ano, setAno]       = useState(hoje.getFullYear());
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState(null); // documentoId da venda expandida

    const carregar = useCallback(async () => {
        setLoading(true);
        setExpandido(null);
        const res = await buscaVendasDoMes(mes, ano);
        if (res.success) {
            setVendas(res.vendas);
        }
        setLoading(false);
    }, [mes, ano]);

    useEffect(() => { carregar(); }, [carregar]);

    // ── Navegar mês anterior / próximo ─────────────────────────────────────────
    function mesAnterior() {
        if (mes === 1) { setMes(12); setAno((a) => a - 1); }
        else           { setMes((m) => m - 1); }
    }
    function mesProximo() {
        if (mes === 12) { setMes(1); setAno((a) => a + 1); }
        else            { setMes((m) => m + 1); }
    }

    // ── Totais do mês ──────────────────────────────────────────────────────────
    const totalMes    = vendas.reduce((acc, v) => acc + (v.total ?? 0), 0);
    const qtdVendas   = vendas.length;
    const qtdItens    = vendas.reduce(
        (acc, v) => acc + (v.itens?.reduce((a, i) => a + i.quantidade, 0) ?? 0),
        0
    );

    // ── Resumo por forma de pagamento ──────────────────────────────────────────
    const porForma = vendas.reduce((acc, v) => {
        const fp = v.forma_pagamento || "outros";
        acc[fp] = (acc[fp] ?? 0) + (v.total ?? 0);
        return acc;
    }, {});

    // ── Card de cada venda ─────────────────────────────────────────────────────
    function renderVenda({ item }) {
        const data      = item.criado_em?.toDate?.();
        const aberto    = expandido === item.documentoId;
        const fpLabel   = FORMAS_LABEL[item.forma_pagamento] || item.forma_pagamento;
        const parcelado = item.forma_pagamento === "credito" && item.parcelas > 1;

        return (
            <Card>
                <Pressable onPress={() => setExpandido(aberto ? null : item.documentoId)}>
                    <View style={s.vendaHeader}>
                        <View style={s.vendaHeaderLeft}>
                            <Text style={s.vendaId}>#{String(item.id).padStart(4, "0")}</Text>
                            <Text style={s.vendaData}>
                                {data
                                    ? `${data.toLocaleDateString("pt-BR")}  ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                                    : "—"}
                            </Text>
                        </View>
                        <View style={s.vendaHeaderRight}>
                            <Text style={s.vendaTotal}>R$ {(item.total ?? 0).toFixed(2)}</Text>
                            <Ionicons
                                name={aberto ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={theme.colors.muted}
                            />
                        </View>
                    </View>

                    <View style={s.vendaTags}>
                        <View style={s.tag}>
                            <Text style={s.tagTexto}>{fpLabel}</Text>
                        </View>
                        {parcelado && (
                            <View style={[s.tag, { backgroundColor: "#EDE7FF" }]}>
                                <Text style={[s.tagTexto, { color: "#6C3FC5" }]}>
                                    {item.parcelas}x R$ {(item.total / item.parcelas).toFixed(2)}
                                </Text>
                            </View>
                        )}
                        {item.desconto > 0 && (
                            <View style={[s.tag, { backgroundColor: "#E8F5E9" }]}>
                                <Text style={[s.tagTexto, { color: "#27AE60" }]}>
                                    Desc. R$ {item.desconto.toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>

                {/* Itens expandidos */}
                {aberto && (
                    <View style={s.itensContainer}>
                        <View style={s.itensDivisor} />
                        {(item.itens ?? []).map((it, idx) => (
                            <View key={idx} style={s.itemLinha}>
                                <View style={s.itemLinhaLeft}>
                                    <Text style={s.itemNome}>{it.produto_nome}</Text>
                                    {it.codigo ? (
                                        <Text style={s.itemCodigo}>Cód: {it.codigo}</Text>
                                    ) : null}
                                </View>
                                <View style={s.itemLinhaRight}>
                                    <Text style={s.itemQtd}>{it.quantidade}x</Text>
                                    <Text style={s.itemSubtotal}>
                                        R$ {(it.subtotal ?? 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <View style={s.itensDivisor} />
                        <View style={s.resumoLinha}>
                            <Text style={s.resumoLabel}>Subtotal</Text>
                            <Text style={s.resumoValor}>R$ {(item.subtotal ?? 0).toFixed(2)}</Text>
                        </View>
                        {item.desconto > 0 && (
                            <View style={s.resumoLinha}>
                                <Text style={[s.resumoLabel, { color: "#27AE60" }]}>Desconto</Text>
                                <Text style={[s.resumoValor, { color: "#27AE60" }]}>
                                    − R$ {item.desconto.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        <View style={s.resumoLinha}>
                            <Text style={s.resumoTotalLabel}>Total</Text>
                            <Text style={s.resumoTotalValor}>R$ {(item.total ?? 0).toFixed(2)}</Text>
                        </View>
                    </View>
                )}
            </Card>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header
                    title="Vendas do Mês"
                    onBack={() => navigation.goBack()}
                />

                {/* ── Seletor de mês ── */}
                <View style={s.mesSelector}>
                    <Pressable style={s.mesBotao} onPress={mesAnterior}>
                        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
                    </Pressable>
                    <Text style={s.mesTitulo}>
                        {MESES[mes - 1]} {ano}
                    </Text>
                    <Pressable style={s.mesBotao} onPress={mesProximo}>
                        <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                        style={{ marginTop: 40 }}
                    />
                ) : (
                    <FlatList
                        data={vendas}
                        keyExtractor={(item) => item.documentoId}
                        renderItem={renderVenda}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={carregar}
                                colors={[theme.colors.primary]}
                            />
                        }
                        contentContainerStyle={s.lista}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            vendas.length > 0 ? (
                                <View>
                                    {/* ── Cards de resumo ── */}
                                    <View style={s.resumoGrid}>
                                        <View style={[s.resumoCard, { backgroundColor: "#EAFAF3" }]}>
                                            <Text style={[s.resumoCardValor, { color: "#27AE60" }]}>
                                                R$ {totalMes.toFixed(2)}
                                            </Text>
                                            <Text style={s.resumoCardLabel}>Total faturado</Text>
                                        </View>
                                        <View style={[s.resumoCard, { backgroundColor: theme.colors.primaryLight }]}>
                                            <Text style={[s.resumoCardValor, { color: theme.colors.primary }]}>
                                                {qtdVendas}
                                            </Text>
                                            <Text style={s.resumoCardLabel}>Vendas realizadas</Text>
                                        </View>
                                        <View style={[s.resumoCard, { backgroundColor: "#EDE7FF" }]}>
                                            <Text style={[s.resumoCardValor, { color: "#6C3FC5" }]}>
                                                {qtdItens}
                                            </Text>
                                            <Text style={s.resumoCardLabel}>Peças vendidas</Text>
                                        </View>
                                    </View>

                                    {/* ── Resumo por forma de pagamento ── */}
                                    <View style={s.formaResumo}>
                                        <Text style={s.formaResumoTitulo}>Por forma de pagamento</Text>
                                        {Object.entries(porForma).map(([fp, valor]) => (
                                            <View key={fp} style={s.formaLinha}>
                                                <Text style={s.formaLabel}>
                                                    {FORMAS_LABEL[fp] || fp}
                                                </Text>
                                                <Text style={s.formaValor}>
                                                    R$ {valor.toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <Text style={s.listaLabel}>Detalhamento das vendas</Text>
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <EmptyState
                                icone="bag-outline"
                                mensagem={`Nenhuma venda em ${MESES[mes - 1]} de ${ano}`}
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const s = StyleSheet.create({
    lista: { padding: 16, paddingBottom: 40 },

    // Seletor de mês
    mesSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        paddingVertical: 10,
        paddingHorizontal: 8,
        ...theme.shadow,
    },
    mesBotao: {
        padding: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primaryLight,
    },
    mesTitulo: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 17,
        color: theme.colors.primaryDark,
    },

    // Resumo cards
    resumoGrid: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    resumoCard: {
        flex: 1,
        borderRadius: theme.radius.md,
        padding: 12,
        alignItems: "center",
    },
    resumoCardValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 16,
        marginBottom: 2,
    },
    resumoCardLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 10,
        color: theme.colors.secondary,
        textAlign: "center",
    },

    // Formas de pagamento
    formaResumo: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 14,
        marginBottom: 16,
        ...theme.shadow,
    },
    formaResumoTitulo: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.primary,
        marginBottom: 10,
    },
    formaLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    formaLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 14,
        color: theme.colors.text,
    },
    formaValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 14,
        color: theme.colors.text,
    },

    listaLabel: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.primary,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },

    // Card da venda
    vendaHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    vendaHeaderLeft: { flex: 1 },
    vendaId: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.text,
    },
    vendaData: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 2,
    },
    vendaHeaderRight: {
        alignItems: "flex-end",
        gap: 4,
    },
    vendaTotal: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 17,
        color: theme.colors.primary,
    },

    // Tags
    vendaTags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
    },
    tag: {
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    tagTexto: {
        fontFamily: theme.fonts.regular,
        fontSize: 11,
        color: theme.colors.primary,
    },

    // Itens expandidos
    itensContainer: { marginTop: 10 },
    itensDivisor: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 8,
    },
    itemLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    itemLinhaLeft: { flex: 1, marginRight: 12 },
    itemNome: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: theme.colors.text,
    },
    itemCodigo: {
        fontFamily: theme.fonts.regular,
        fontSize: 11,
        color: theme.colors.muted,
    },
    itemLinhaRight: { alignItems: "flex-end" },
    itemQtd: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 12,
        color: theme.colors.muted,
    },
    itemSubtotal: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.text,
    },

    // Resumo dentro da venda expandida
    resumoLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    resumoLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: theme.colors.muted,
    },
    resumoValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 13,
        color: theme.colors.text,
    },
    resumoTotalLabel: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.text,
    },
    resumoTotalValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 16,
        color: theme.colors.primary,
    },
});