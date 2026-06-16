import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ScrollView,
    Pressable,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
    Header,
    SearchBar,
    Card,
    SectionLabel,
    PrimaryButton,
    EmptyState,
    Loading,
    theme,
} from "../components/ui";

import { escutaProdVariacao } from "../services/ProdutoVariacaoService";
import { buscaTodosSaldos }   from "../services/SaldoVariacaoService";
import { buscaProdutoId }     from "../services/ProdutoService";
import { addVenda }           from "../services/VendaService";

// ─── Formas de pagamento ──────────────────────────────────────────────────────
const FORMAS_PAG = [
    { id: "dinheiro", label: "Dinheiro",  icone: "cash-outline" },
    { id: "pix",      label: "PIX",       icone: "phone-portrait-outline" },
    { id: "debito",   label: "Débito",    icone: "card-outline" },
    { id: "credito",  label: "Crédito",   icone: "card-outline" },
    { id: "boleto",   label: "Boleto",    icone: "document-text-outline" },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function VendaScreen() {
    // ── Estado dos dados ──────────────────────────────────────────────────────
    const [catalogo, setCatalogo]         = useState([]); 
    const [carregando, setCarregando]     = useState(true);

    // ── Estado da busca e carrinho ────────────────────────────────────────────
    const [busca, setBusca]               = useState("");
    const [carrinho, setCarrinho]         = useState([]);

    // ── Estado do modal de pagamento ──────────────────────────────────────────
    const [modalAberto, setModalAberto]   = useState(false);
    const [formaPag, setFormaPag]         = useState(null);
    const [parcelas, setParcelas]         = useState(1);
    const [desconto, setDesconto]         = useState("");
    const [salvando, setSalvando]         = useState(false);

    // ─── Carrega variações + saldos + nomes de produto ────────────────────────
    useEffect(() => {
        let variacoes = [];
        let saldos    = [];
        let resolvido = false;

        // Ouve variações em tempo real
        const unsubscribe = escutaProdVariacao(async (listaVar) => {
            variacoes = listaVar;
            if (saldos.length > 0 && !resolvido) {
                resolvido = true;
                await montar(variacoes, saldos);
            }
        });

        // Busca saldos (one-shot; refresh via pull-to-refresh se necessário)
        buscaTodosSaldos().then(async (res) => {
            if (res.success) {
                saldos = res.saldos;
                if (variacoes.length > 0 && !resolvido) {
                    resolvido = true;
                    await montar(variacoes, saldos);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // ── Enriquece variações com saldo e nome do produto ───────────────────────
    async function montar(variacoes, saldos) {
        setCarregando(true);

        // Mapeia variacao_id → quantidade
        const mapSaldo = {};
        saldos.forEach((s) => {
            mapSaldo[s.variacao_id] = s.quantidade ?? 0;
        });

        // Cache de produtos já buscados (evita chamadas repetidas)
        const cacheProd = {};

        const enriquecidos = await Promise.all(
            variacoes.map(async (v) => {
                const qtd = mapSaldo[v.id] ?? 0;
                if (qtd <= 0) return null; // sem estoque — não exibe

                // Busca nome do produto
                let nomeProduto = "Produto desconhecido";
                if (v.produto_id !== undefined && v.produto_id !== null) {
                    if (!cacheProd[v.produto_id]) {
                        const prod = await buscaProdutoId(v.produto_id);
                        cacheProd[v.produto_id] = prod?.nome ?? "Produto não encontrado";
                    }
                    nomeProduto = cacheProd[v.produto_id];
                }

                return {
                    ...v,
                    produto_nome: nomeProduto,
                    quantidade_estoque: qtd,
                };
            })
        );

        setCatalogo(enriquecidos.filter(Boolean));
        setCarregando(false);
    }

    // ─── Lógica do carrinho ───────────────────────────────────────────────────
    function adicionarItem(item) {
        setCarrinho((prev) => {
            const existe = prev.find((c) => c.documentoId === item.documentoId);
            if (existe) {
                if (existe.quantidade >= item.quantidade_estoque) {
                    Alert.alert(
                        "Estoque insuficiente",
                        `Apenas ${item.quantidade_estoque} unidade(s) disponível(is).`
                    );
                    return prev;
                }
                return prev.map((c) =>
                    c.documentoId === item.documentoId
                        ? { ...c, quantidade: c.quantidade + 1 }
                        : c
                );
            }
            return [...prev, { ...item, quantidade: 1 }];
        });
    }

    function removerItem(documentoId) {
        setCarrinho((prev) => prev.filter((c) => c.documentoId !== documentoId));
    }

    function alterarQtd(documentoId, delta) {
        setCarrinho((prev) =>
            prev
                .map((item) => {
                    if (item.documentoId !== documentoId) return item;
                    const novaQtd = item.quantidade + delta;
                    if (novaQtd <= 0) return null;
                    if (novaQtd > item.quantidade_estoque) {
                        Alert.alert(
                            "Estoque insuficiente",
                            `Apenas ${item.quantidade_estoque} unidade(s) disponível(is).`
                        );
                        return item;
                    }
                    return { ...item, quantidade: novaQtd };
                })
                .filter(Boolean)
        );
    }

    function limparCarrinho() {
        setCarrinho([]);
        setFormaPag(null);
        setParcelas(1);
        setDesconto("");
        setModalAberto(false);
    }

    // ─── Cálculos financeiros ─────────────────────────────────────────────────
    const subtotal = carrinho.reduce(
        (acc, i) => acc + (i.preco_venda ?? 0) * i.quantidade,
        0
    );
    const descontoValor = desconto
        ? Math.min(parseFloat(desconto.replace(",", ".")) || 0, subtotal)
        : 0;
    const total    = subtotal - descontoValor;
    const qtdItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

    // ─── Finalizar venda ──────────────────────────────────────────────────────
    async function finalizarVenda() {
        if (!formaPag) {
            Alert.alert("Atenção", "Selecione a forma de pagamento.");
            return;
        }
        setSalvando(true);
        const res = await addVenda(carrinho, formaPag, parcelas, desconto);
        setSalvando(false);

        if (res.success) {
            limparCarrinho();
            Alert.alert(
                "✅ Venda registrada!",
                `Total: R$ ${res.total.toFixed(2)}\n\n${res.message}`,
                [{ text: "OK" }]
            );
        } else {
            Alert.alert("Erro", res.message);
        }
    }

    // ─── Filtro de busca ──────────────────────────────────────────────────────
    const filtrado = catalogo.filter((v) => {
        const termo = busca.toLowerCase();
        return (
            v.produto_nome?.toLowerCase().includes(termo) ||
            v.codigo?.toLowerCase().includes(termo) ||
            v.sku?.toLowerCase().includes(termo)
        );
    });

    // ─── Card de produto no catálogo ──────────────────────────────────────────
    function renderItem({ item }) {
        const noCarrinho = carrinho.find((c) => c.documentoId === item.documentoId);

        return (
            <Card style={s.cardRow} onPress={() => adicionarItem(item)}>
                <View style={s.cardInfo}>
                    <Text style={s.cardNome} numberOfLines={1}>
                        {item.produto_nome}
                    </Text>
                    <Text style={s.cardCodigo}>
                        {item.codigo ? `Cód: ${item.codigo}` : ""}
                        {item.codigo && item.sku ? "  |  " : ""}
                        {item.sku ? `SKU: ${item.sku}` : ""}
                    </Text>
                    <Text style={s.cardPreco}>
                        R$ {Number(item.preco_venda ?? 0).toFixed(2)}
                    </Text>
                    <Text style={s.cardEstoque}>
                        Estoque: {item.quantidade_estoque} un.
                    </Text>
                </View>

                {noCarrinho ? (
                    <View style={s.badgeQtd}>
                        <Text style={s.badgeQtdTexto}>{noCarrinho.quantidade}x</Text>
                    </View>
                ) : (
                    <Ionicons
                        name="add-circle-outline"
                        size={30}
                        color={theme.colors.primary}
                    />
                )}
            </Card>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>

                {/* Cabeçalho */}
                <Header
                    title="Nova Venda"
                    subtitle={
                        qtdItens > 0
                            ? `${qtdItens} item(s) • R$ ${total.toFixed(2)}`
                            : "Toque no produto para adicionar"
                    }
                    rightContent={
                        qtdItens > 0 ? (
                            <Pressable
                                style={s.btnCarrinhoHeader}
                                onPress={() => setModalAberto(true)}
                            >
                                <Ionicons name="cart" size={22} color="#fff" />
                                <View style={s.badgeHeader}>
                                    <Text style={s.badgeHeaderTexto}>{qtdItens}</Text>
                                </View>
                            </Pressable>
                        ) : null
                    }
                />

                {/* Busca */}
                <SearchBar
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="Buscar por produto, código ou SKU..."
                />

                {/* Lista */}
                {carregando ? (
                    <Loading />
                ) : filtrado.length === 0 ? (
                    <EmptyState
                        icone="shirt-outline"
                        mensagem={
                            busca
                                ? "Nenhum produto encontrado para esta busca"
                                : "Nenhum produto com estoque disponível"
                        }
                    />
                ) : (
                    <FlatList
                        data={filtrado}
                        keyExtractor={(item) => item.documentoId}
                        renderItem={renderItem}
                        contentContainerStyle={s.lista}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Barra inferior flutuante */}
                {carrinho.length > 0 && (
                    <Pressable
                        style={s.barraCarrinho}
                        onPress={() => setModalAberto(true)}
                    >
                        <Ionicons name="cart-outline" size={20} color="#fff" />
                        <Text style={s.barraCarrinhoTexto}>
                            {qtdItens} item(s)  •  R$ {total.toFixed(2)}
                        </Text>
                        <Text style={s.barraCarrinhoAcao}>Ver carrinho →</Text>
                    </Pressable>
                )}

                {/* ════════════════════════════════════════════
                    MODAL — CARRINHO + PAGAMENTO
                ════════════════════════════════════════════ */}
                <Modal
                    visible={modalAberto}
                    animationType="slide"
                    onRequestClose={() => setModalAberto(false)}
                >
                    <SafeAreaProvider>
                        <SafeAreaView
                            style={{ flex: 1, backgroundColor: theme.colors.background }}
                        >
                            {/* Cabeçalho do modal */}
                            <Header
                                title="Carrinho"
                                subtitle={`${qtdItens} item(s)`}
                                onBack={() => setModalAberto(false)}
                                rightContent={
                                    carrinho.length > 0 ? (
                                        <Pressable onPress={limparCarrinho}>
                                            <Text style={s.limparTexto}>Limpar tudo</Text>
                                        </Pressable>
                                    ) : null
                                }
                            />

                            <ScrollView
                                contentContainerStyle={s.modalContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {carrinho.length === 0 ? (
                                    <EmptyState
                                        icone="cart-outline"
                                        mensagem="Nenhum item no carrinho"
                                    />
                                ) : (
                                    <>
                                        {/* ── Itens do carrinho ── */}
                                        <SectionLabel titulo="Itens" icone="list-outline" />

                                        {carrinho.map((item) => (
                                            <Card key={item.documentoId} style={s.itemRow}>
                                                <View style={s.itemInfo}>
                                                    <Text style={s.itemNome} numberOfLines={1}>
                                                        {item.produto_nome}
                                                    </Text>
                                                    {item.codigo ? (
                                                        <Text style={s.itemCodigo}>
                                                            Cód: {item.codigo}
                                                            {item.sku ? `  |  SKU: ${item.sku}` : ""}
                                                        </Text>
                                                    ) : null}
                                                    <Text style={s.itemPrecoTotal}>
                                                        R${" "}
                                                        {(item.preco_venda * item.quantidade).toFixed(2)}
                                                        {"  "}
                                                        <Text style={s.itemPrecoUnit}>
                                                            (R$ {Number(item.preco_venda).toFixed(2)} /un.)
                                                        </Text>
                                                    </Text>
                                                </View>

                                                <View style={s.itemControle}>
                                                    <Pressable
                                                        style={s.btnQtd}
                                                        onPress={() => alterarQtd(item.documentoId, -1)}
                                                    >
                                                        <Ionicons
                                                            name="remove"
                                                            size={18}
                                                            color={theme.colors.primary}
                                                        />
                                                    </Pressable>

                                                    <Text style={s.qtdTexto}>{item.quantidade}</Text>

                                                    <Pressable
                                                        style={s.btnQtd}
                                                        onPress={() => alterarQtd(item.documentoId, 1)}
                                                    >
                                                        <Ionicons
                                                            name="add"
                                                            size={18}
                                                            color={theme.colors.primary}
                                                        />
                                                    </Pressable>

                                                    <Pressable
                                                        style={s.btnRemover}
                                                        onPress={() => removerItem(item.documentoId)}
                                                    >
                                                        <Ionicons
                                                            name="trash-outline"
                                                            size={18}
                                                            color={theme.colors.danger}
                                                        />
                                                    </Pressable>
                                                </View>
                                            </Card>
                                        ))}

                                        {/* ── Desconto ── */}
                                        <SectionLabel
                                            titulo="Desconto (R$)"
                                            icone="pricetag-outline"
                                        />
                                        <TextInput
                                            style={s.inputDesconto}
                                            placeholder="0,00"
                                            placeholderTextColor={theme.colors.muted}
                                            keyboardType="decimal-pad"
                                            value={desconto}
                                            onChangeText={setDesconto}
                                        />

                                        {/* ── Resumo ── */}
                                        <SectionLabel titulo="Resumo" icone="receipt-outline" />
                                        <Card>
                                            <View style={s.resumoLinha}>
                                                <Text style={s.resumoLabel}>Subtotal</Text>
                                                <Text style={s.resumoValor}>
                                                    R$ {subtotal.toFixed(2)}
                                                </Text>
                                            </View>

                                            {descontoValor > 0 && (
                                                <View style={s.resumoLinha}>
                                                    <Text
                                                        style={[s.resumoLabel, { color: "#27AE60" }]}
                                                    >
                                                        Desconto
                                                    </Text>
                                                    <Text
                                                        style={[s.resumoValor, { color: "#27AE60" }]}
                                                    >
                                                        − R$ {descontoValor.toFixed(2)}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={[s.resumoLinha, s.resumoTotalLinha]}>
                                                <Text style={s.resumoTotalLabel}>Total</Text>
                                                <Text style={s.resumoTotalValor}>
                                                    R$ {total.toFixed(2)}
                                                </Text>
                                            </View>
                                        </Card>

                                        {/* ── Forma de pagamento ── */}
                                        <SectionLabel
                                            titulo="Forma de Pagamento"
                                            icone="card-outline"
                                        />
                                        <View style={s.gridPagamento}>
                                            {FORMAS_PAG.map((forma) => (
                                                <Pressable
                                                    key={forma.id}
                                                    style={[
                                                        s.cardPag,
                                                        formaPag === forma.id && s.cardPagSelecionado,
                                                    ]}
                                                    onPress={() => {
                                                        setFormaPag(forma.id);
                                                        if (forma.id !== "credito") setParcelas(1);
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={forma.icone}
                                                        size={22}
                                                        color={
                                                            formaPag === forma.id
                                                                ? theme.colors.primary
                                                                : theme.colors.muted
                                                        }
                                                    />
                                                    <Text
                                                        style={[
                                                            s.labelPag,
                                                            formaPag === forma.id && s.labelPagSelecionado,
                                                        ]}
                                                    >
                                                        {forma.label}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>

                                        {/* ── Parcelas (só crédito) ── */}
                                        {formaPag === "credito" && (
                                            <>
                                                <SectionLabel
                                                    titulo="Parcelamento"
                                                    icone="layers-outline"
                                                />
                                                <ScrollView
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    style={{ marginBottom: 4 }}
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                                                        <Pressable
                                                            key={n}
                                                            style={[
                                                                s.cardParcela,
                                                                parcelas === n && s.cardParcelaSelecionado,
                                                            ]}
                                                            onPress={() => setParcelas(n)}
                                                        >
                                                            <Text
                                                                style={[
                                                                    s.parcelaNum,
                                                                    parcelas === n && s.parcelaNumSelecionado,
                                                                ]}
                                                            >
                                                                {n}x
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    s.parcelaVal,
                                                                    parcelas === n && s.parcelaValSelecionado,
                                                                ]}
                                                            >
                                                                R$ {(total / n).toFixed(2)}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            </>
                                        )}

                                        {/* ── Botão finalizar ── */}
                                        <PrimaryButton
                                            title={
                                                formaPag
                                                    ? `Finalizar  •  R$ ${total.toFixed(2)}`
                                                    : "Selecione a forma de pagamento"
                                            }
                                            onPress={finalizarVenda}
                                            loading={salvando}
                                            icone="checkmark-circle-outline"
                                            style={[
                                                s.btnFinalizar,
                                                !formaPag && s.btnFinalizarDesabilitado,
                                            ]}
                                        />
                                    </>
                                )}
                            </ScrollView>
                        </SafeAreaView>
                    </SafeAreaProvider>
                </Modal>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    lista: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
    },

    // Card catálogo
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardInfo: { flex: 1 },
    cardNome: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.text,
        marginBottom: 2,
    },
    cardCodigo: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
    },
    cardPreco: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.primary,
        marginTop: 4,
    },
    cardEstoque: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
    },

    // Badge quantidade no card
    badgeQtd: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
        minWidth: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    badgeQtdTexto: {
        fontFamily: theme.fonts.semiBold,
        color: "#fff",
        fontSize: 14,
    },

    // Botão carrinho no header
    btnCarrinhoHeader: { padding: 6 },
    badgeHeader: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: theme.colors.danger,
        borderRadius: theme.radius.full,
        minWidth: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeHeaderTexto: { color: "#fff", fontSize: 10, fontWeight: "700" },

    // Barra flutuante inferior
    barraCarrinho: {
        position: "absolute",
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    barraCarrinhoTexto: {
        fontFamily: theme.fonts.semiBold,
        color: "#fff",
        fontSize: 14,
        flex: 1,
    },
    barraCarrinhoAcao: {
        fontFamily: theme.fonts.regular,
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
    },

    // Modal
    modalContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 60,
    },
    limparTexto: {
        fontFamily: theme.fonts.regular,
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
    },

    // Itens do carrinho
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    itemInfo: { flex: 1 },
    itemNome: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.text,
    },
    itemCodigo: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
    },
    itemPrecoTotal: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.primary,
        marginTop: 2,
    },
    itemPrecoUnit: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.muted,
    },
    itemControle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    btnQtd: {
        width: 32,
        height: 32,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    qtdTexto: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.text,
        minWidth: 24,
        textAlign: "center",
    },
    btnRemover: {
        width: 32,
        height: 32,
        backgroundColor: "#FEE2E2",
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 2,
    },

    // Desconto
    inputDesconto: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: theme.fonts.regular,
        fontSize: 15,
        color: theme.colors.text,
        ...theme.shadow,
    },

    // Resumo
    resumoLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    resumoLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 14,
        color: theme.colors.muted,
    },
    resumoValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 14,
        color: theme.colors.text,
    },
    resumoTotalLinha: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 10,
        marginTop: 4,
        marginBottom: 0,
    },
    resumoTotalLabel: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 17,
        color: theme.colors.text,
    },
    resumoTotalValor: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 20,
        color: theme.colors.primary,
    },

    // Pagamento
    gridPagamento: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 4,
    },
    cardPag: {
        width: "29%",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        paddingVertical: 14,
        paddingHorizontal: 6,
        alignItems: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        ...theme.shadow,
    },
    cardPagSelecionado: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    labelPag: {
        fontFamily: theme.fonts.regular,
        fontSize: 11,
        color: theme.colors.muted,
        textAlign: "center",
    },
    labelPagSelecionado: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.primary,
    },

    // Parcelas
    cardParcela: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        minWidth: 72,
    },
    cardParcelaSelecionado: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    parcelaNum: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.muted,
    },
    parcelaNumSelecionado: { color: theme.colors.primary },
    parcelaVal: {
        fontFamily: theme.fonts.regular,
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 2,
    },
    parcelaValSelecionado: { color: theme.colors.primary },

    // Botão finalizar
    btnFinalizar: { marginTop: 24, marginBottom: 16 },
    btnFinalizarDesabilitado: {
        backgroundColor: theme.colors.muted,
        shadowOpacity: 0,
        elevation: 0,
    },
});