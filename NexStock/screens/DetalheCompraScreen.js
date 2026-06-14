import React, { useEffect, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../dbconfig/config";
import { doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "../database/collections";
import { Header, Card, theme } from "../components/ui";
import { buscaItensCompra, buscaContasCompra, cancelaCompra } from "../services/MovCompraService";

const STATUS_COR = {
    FINALIZADA: { bg: "#E8F5E9", text: "#2E7D32" },
    CANCELADA:  { bg: "#FFEBEE", text: "#C62828" },
};

const PARCELA_COR = {
    ABERTO:    { bg: "#E3F2FD", text: "#1565C0", icone: "time-outline" },
    PAGO:      { bg: "#E8F5E9", text: "#2E7D32", icone: "checkmark-circle-outline" },
    CANCELADO: { bg: "#FFEBEE", text: "#C62828", icone: "close-circle-outline" },
    VENCIDO:   { bg: "#FFF3E0", text: "#E65100", icone: "alert-circle-outline" },
};

function formataData(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pt-BR");
}

function formataMoeda(v) {
    return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusParcela(conta) {
    if (conta.status === "CANCELADO") return "CANCELADO";
    if (conta.status === "PAGO") return "PAGO";
    const venc = conta.vencimento?.toDate ? conta.vencimento.toDate() : new Date(conta.vencimento);
    if (venc < new Date()) return "VENCIDO";
    return "ABERTO";
}

function Divider() {
    return <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />;
}

function InfoRow({ label, valor, valorStyle }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
            <Text style={{ fontSize: 13, color: theme.colors.muted }}>{label}</Text>
            <Text style={{ fontSize: 13, color: theme.colors.text, fontFamily: theme.fonts.semiBold, ...valorStyle }}>
                {valor}
            </Text>
        </View>
    );
}

export default function DetalheCompraScreen({ route, navigation }) {
    const { compra } = route.params;
    const [itens, setItens] = useState([]);
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salvandoParcela, setSalvandoParcela] = useState(null); // documentoId da parcela sendo salva

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const [itensRes, contasRes] = await Promise.all([
            buscaItensCompra(compra.documentoId),
            buscaContasCompra(compra.documentoId),
        ]);
        if (itensRes.success) setItens(itensRes.itens);
        if (contasRes.success) {
            const ordenadas = [...contasRes.contas].sort((a, b) => a.parcela - b.parcela);
            setContas(ordenadas);
        }
        setLoading(false);
    }

    async function marcarPago(conta) {
        Alert.alert(
            "Marcar como pago",
            `Confirma pagamento da ${contas.length === 1 ? "conta" : `parcela ${conta.parcela}/${conta.total_parcelas}`} de ${formataMoeda(conta.valor)}?`,
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, pago",
                    onPress: async () => {
                        setSalvandoParcela(conta.documentoId);
                        try {
                            const ref = doc(db, COLLECTIONS.CONTAS_PAGAR, conta.documentoId);
                            await updateDoc(ref, { status: "PAGO" });
                            // Atualiza localmente sem recarregar tudo
                            setContas(prev => prev.map(c =>
                                c.documentoId === conta.documentoId ? { ...c, status: "PAGO" } : c
                            ));
                        } catch (e) {
                            Alert.alert("Erro", "Não foi possível atualizar a parcela.");
                        }
                        setSalvandoParcela(null);
                    },
                },
            ]
        );
    }

    async function marcarAberto(conta) {
        Alert.alert(
            "Desfazer pagamento",
            "Deseja marcar esta parcela como em aberto novamente?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim",
                    onPress: async () => {
                        setSalvandoParcela(conta.documentoId);
                        try {
                            const ref = doc(db, COLLECTIONS.CONTAS_PAGAR, conta.documentoId);
                            await updateDoc(ref, { status: "ABERTO" });
                            setContas(prev => prev.map(c =>
                                c.documentoId === conta.documentoId ? { ...c, status: "ABERTO" } : c
                            ));
                        } catch (e) {
                            Alert.alert("Erro", "Não foi possível atualizar a parcela.");
                        }
                        setSalvandoParcela(null);
                    },
                },
            ]
        );
    }

    const corStatus = STATUS_COR[compra.status] || STATUS_COR.FINALIZADA;

    const handleCancelar = () => {
        Alert.alert(
            "Cancelar compra",
            `Deseja cancelar a compra ${compra.nf ? `NF ${compra.nf}` : compra.documentoId}? As contas a pagar serão canceladas.`,
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        const res = await cancelaCompra(compra.documentoId);
                        if (res.success) {
                            navigation.goBack();
                        } else {
                            Alert.alert("Erro", res.message);
                        }
                    },
                },
            ]
        );
    };

    // Resumo de pagamento das parcelas
    const totalPago = contas.filter(c => c.status === "PAGO").reduce((acc, c) => acc + c.valor, 0);
    const totalAberto = contas.filter(c => c.status !== "PAGO" && c.status !== "CANCELADO").reduce((acc, c) => acc + c.valor, 0);

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
                <Header title="Detalhe da Compra" onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

                    {/* ── CABEÇALHO ── */}
                    <Card style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 17, color: theme.colors.text }}>
                                    {compra.nf ? `NF ${compra.nf}` : compra.documentoId}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                                    {formataData(compra.data)}
                                </Text>
                            </View>
                            <View style={{ backgroundColor: corStatus.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full }}>
                                <Text style={{ fontSize: 11, fontFamily: theme.fonts.semiBold, color: corStatus.text }}>
                                    {compra.status}
                                </Text>
                            </View>
                        </View>

                        <Divider />

                        <InfoRow label="Condição de pagamento" valor={compra.condpag_desc || "—"} />
                        {compra.obs ? <InfoRow label="Observações" valor={compra.obs} /> : null}

                        <Divider />

                        <InfoRow label="Subtotal" valor={formataMoeda(compra.subtotal)} />
                        {compra.desconto > 0 && (
                            <InfoRow
                                label="Desconto"
                                valor={`- ${formataMoeda(compra.desconto)}`}
                                valorStyle={{ color: theme.colors.danger }}
                            />
                        )}
                        <InfoRow
                            label="Total"
                            valor={formataMoeda(compra.total)}
                            valorStyle={{ fontSize: 16, color: theme.colors.primary }}
                        />

                        {compra.status === "FINALIZADA" && (
                            <>
                                <Divider />
                                <Text
                                    onPress={handleCancelar}
                                    style={{ fontSize: 13, color: theme.colors.danger, textAlign: "center", fontFamily: theme.fonts.semiBold }}
                                >
                                    Cancelar compra
                                </Text>
                            </>
                        )}
                    </Card>

                    {/* ── ITENS ── */}
                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text, marginBottom: 8 }}>
                        Produtos ({itens.length})
                    </Text>
                    {itens.map((item, idx) => (
                        <Card key={idx} style={{ marginBottom: 10 }}>
                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text }}>
                                {item.produto_nome || "—"}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                                Cód: {item.variacao_codigo || "—"}
                            </Text>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                                <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                                    {item.quantidade}x {formataMoeda(item.custo_unitario)}
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: theme.fonts.semiBold, color: theme.colors.primary }}>
                                    {formataMoeda(item.total_item)}
                                </Text>
                            </View>
                        </Card>
                    ))}

                    {/* ── PARCELAS ── */}
                    {contas.length > 0 && (
                        <>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 8 }}>
                                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text }}>
                                    {contas.length === 1 ? "Pagamento" : `Parcelas (${contas.length}x)`}
                                </Text>
                            </View>

                            {/* Resumo pago/aberto */}
                            {contas.length > 1 && (
                                <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 12 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <View style={{ alignItems: "center" }}>
                                            <Text style={{ fontSize: 11, color: theme.colors.muted, marginBottom: 4 }}>Pago</Text>
                                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: "#2E7D32" }}>
                                                {formataMoeda(totalPago)}
                                            </Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: theme.colors.border }} />
                                        <View style={{ alignItems: "center" }}>
                                            <Text style={{ fontSize: 11, color: theme.colors.muted, marginBottom: 4 }}>Em aberto</Text>
                                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.danger }}>
                                                {formataMoeda(totalAberto)}
                                            </Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: theme.colors.border }} />
                                        <View style={{ alignItems: "center" }}>
                                            <Text style={{ fontSize: 11, color: theme.colors.muted, marginBottom: 4 }}>Total</Text>
                                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary }}>
                                                {formataMoeda(compra.total)}
                                            </Text>
                                        </View>
                                    </View>
                                </Card>
                            )}

                            {contas.map((conta, idx) => {
                                const st = statusParcela(conta);
                                const cor = PARCELA_COR[st] || PARCELA_COR.ABERTO;
                                const salvando = salvandoParcela === conta.documentoId;
                                const podePagar = (st === "ABERTO" || st === "VENCIDO") && compra.status === "FINALIZADA";
                                const podeDesfazer = st === "PAGO" && compra.status === "FINALIZADA";

                                return (
                                    <Card key={idx} style={{ marginBottom: 10 }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                                                <Ionicons name={cor.icone} size={18} color={cor.text} />
                                                <View>
                                                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 13, color: theme.colors.text }}>
                                                        {contas.length === 1 ? "À vista" : `Parcela ${conta.parcela}/${conta.total_parcelas}`}
                                                    </Text>
                                                    <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                                                        Venc: {formataData(conta.vencimento)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary }}>
                                                    {formataMoeda(conta.valor)}
                                                </Text>
                                                <View style={{ backgroundColor: cor.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.full, marginTop: 4 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: theme.fonts.semiBold, color: cor.text }}>
                                                        {st}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Botão pagar / desfazer */}
                                        {(podePagar || podeDesfazer) && (
                                            <TouchableOpacity
                                                onPress={() => podePagar ? marcarPago(conta) : marcarAberto(conta)}
                                                disabled={salvando}
                                                style={{
                                                    marginTop: 10,
                                                    paddingVertical: 8,
                                                    borderRadius: theme.radius.md,
                                                    backgroundColor: podePagar ? "#E8F5E9" : theme.colors.surface,
                                                    borderWidth: 1,
                                                    borderColor: podePagar ? "#2E7D32" : theme.colors.border,
                                                    alignItems: "center",
                                                    flexDirection: "row",
                                                    justifyContent: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                {salvando ? (
                                                    <ActivityIndicator size="small" color={podePagar ? "#2E7D32" : theme.colors.muted} />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name={podePagar ? "checkmark-circle-outline" : "arrow-undo-outline"}
                                                            size={15}
                                                            color={podePagar ? "#2E7D32" : theme.colors.muted}
                                                        />
                                                        <Text style={{
                                                            fontSize: 13,
                                                            fontFamily: theme.fonts.semiBold,
                                                            color: podePagar ? "#2E7D32" : theme.colors.muted,
                                                        }}>
                                                            {podePagar ? "Marcar como pago" : "Desfazer pagamento"}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </Card>
                                );
                            })}
                        </>
                    )}

                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}