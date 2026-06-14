import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Header, Card, FAB, EmptyState, Loading, theme } from "../components/ui";
import { escutaCompras, cancelaCompra } from "../services/MovCompraService";

const STATUS_COR = {
    FINALIZADA: { bg: "#E8F5E9", text: "#2E7D32" },
    CANCELADA:  { bg: "#FFEBEE", text: "#C62828" },
};

const FILTROS_RAPIDOS = [
    { label: "Hoje",        valor: "hoje" },
    { label: "7 dias",      valor: "7dias" },
    { label: "Este mês",    valor: "mes" },
    { label: "Personalizado", valor: "custom" },
];

function formataData(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pt-BR");
}

function formataMoeda(v) {
    return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function inicioDoDia(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function fimDoDia(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export default function ListaComprasScreen({ navigation }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filtroRapido, setFiltroRapido] = useState("mes");
    const [filtroStatus, setFiltroStatus] = useState("TODOS");
    const [dataInicio, setDataInicio] = useState(null);
    const [dataFim, setDataFim] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerAlvo, setPickerAlvo] = useState("inicio"); // "inicio" | "fim"

    useEffect(() => {
        const unsub = escutaCompras((lista) => {
            setCompras(lista);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Calcula intervalo conforme filtro rápido
    const { inicio, fim } = useMemo(() => {
        const hoje = new Date();
        if (filtroRapido === "hoje") {
            return { inicio: inicioDoDia(hoje), fim: fimDoDia(hoje) };
        }
        if (filtroRapido === "7dias") {
            const d = new Date(hoje);
            d.setDate(d.getDate() - 6);
            return { inicio: inicioDoDia(d), fim: fimDoDia(hoje) };
        }
        if (filtroRapido === "mes") {
            const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            return { inicio: inicioDoDia(d), fim: fimDoDia(hoje) };
        }
        if (filtroRapido === "custom") {
            return {
                inicio: dataInicio ? inicioDoDia(dataInicio) : null,
                fim: dataFim ? fimDoDia(dataFim) : null,
            };
        }
        return { inicio: null, fim: null };
    }, [filtroRapido, dataInicio, dataFim]);

    // Aplica filtros
    const comprasFiltradas = useMemo(() => {
        return compras.filter((c) => {
            // Filtro status
            if (filtroStatus !== "TODOS" && c.status !== filtroStatus) return false;

            // Filtro período
            const dataMov = c.data?.toDate ? c.data.toDate() : new Date(c.data);
            if (inicio && dataMov < inicio) return false;
            if (fim && dataMov > fim) return false;

            return true;
        });
    }, [compras, filtroStatus, inicio, fim]);

    // Totalizadores
    const resumo = useMemo(() => {
        const finalizadas = comprasFiltradas.filter(c => c.status === "FINALIZADA");
        const totalGasto = finalizadas.reduce((acc, c) => acc + (c.total || 0), 0);
        const totalDesconto = finalizadas.reduce((acc, c) => acc + (c.desconto || 0), 0);
        return {
            qtdTotal: comprasFiltradas.length,
            qtdFinalizadas: finalizadas.length,
            totalGasto,
            totalDesconto,
        };
    }, [comprasFiltradas]);

    const abrirPicker = (alvo) => {
        setPickerAlvo(alvo);
        setShowPicker(true);
    };

    const handlePickerChange = (event, selectedDate) => {
        setShowPicker(false);
        if (!selectedDate) return;
        if (pickerAlvo === "inicio") {
            setDataInicio(selectedDate);
        } else {
            setDataFim(selectedDate);
        }
    };

    const handleCancelar = (item) => {
        Alert.alert(
            "Cancelar compra",
            `Deseja cancelar a compra ${item.nf ? `NF ${item.nf}` : item.documentoId}? As contas a pagar serão canceladas.`,
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        const res = await cancelaCompra(item.documentoId);
                        if (!res.success) Alert.alert("Erro", res.message);
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const cor = STATUS_COR[item.status] || { bg: "#FFF8E1", text: "#F57F17" };
        return (
            <TouchableOpacity onPress={() => navigation.navigate("DetalheCompra", { compra: item })} activeOpacity={0.8}>
            <Card style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 15, color: theme.colors.text }}>
                            {item.condpag_desc || "Compra"}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                            {item.nf ? `NF ${item.nf} · ` : ""}{formataData(item.data)}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: cor.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full }}>
                        <Text style={{ fontSize: 11, fontFamily: theme.fonts.semiBold, color: cor.text }}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                    <View>
                        <Text style={{ fontSize: 11, color: theme.colors.muted }}>Subtotal</Text>
                        <Text style={{ fontSize: 13, color: theme.colors.text }}>{formataMoeda(item.subtotal)}</Text>
                    </View>
                    {item.desconto > 0 && (
                        <View>
                            <Text style={{ fontSize: 11, color: theme.colors.muted }}>Desconto</Text>
                            <Text style={{ fontSize: 13, color: theme.colors.danger }}>- {formataMoeda(item.desconto)}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={{ fontSize: 11, color: theme.colors.muted }}>Total</Text>
                        <Text style={{ fontSize: 14, fontFamily: theme.fonts.semiBold, color: theme.colors.primary }}>
                            {formataMoeda(item.total)}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons
                            name={item.total_parcelas > 1 ? "layers-outline" : "cash-outline"}
                            size={13}
                            color={theme.colors.muted}
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            {item.total_parcelas > 1
                                ? `${item.total_parcelas}x de ${formataMoeda(item.total / item.total_parcelas)}`
                                : "À vista"}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.muted} />
                    </View>
                </View>
            </Card>
            </TouchableOpacity>
        );
    };

    if (loading) return <Loading />;

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header
                    title="Compras"
                    subtitle="Entradas de mercadoria"
                    onBack={() => navigation.goBack()}
                />

                <FlatList
                    data={comprasFiltradas}
                    keyExtractor={(i) => i.documentoId}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={<EmptyState icone="shopping-cart" mensagem="Nenhuma compra no período" />}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 16 }}>

                            {/* ── FILTROS RÁPIDOS ── */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {FILTROS_RAPIDOS.map((f) => {
                                        const ativo = filtroRapido === f.valor;
                                        return (
                                            <TouchableOpacity
                                                key={f.valor}
                                                onPress={() => setFiltroRapido(f.valor)}
                                                style={{
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 8,
                                                    borderRadius: theme.radius.full,
                                                    backgroundColor: ativo ? theme.colors.primary : theme.colors.surface,
                                                    borderWidth: 1,
                                                    borderColor: ativo ? theme.colors.primary : theme.colors.border,
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 13,
                                                    fontFamily: theme.fonts.semiBold,
                                                    color: ativo ? "#fff" : theme.colors.muted,
                                                }}>
                                                    {f.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            {/* ── SELEÇÃO DE DATA PERSONALIZADA ── */}
                            {filtroRapido === "custom" && (
                                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => abrirPicker("inicio")}
                                        style={{
                                            flex: 1,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                            backgroundColor: theme.colors.surface,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                            borderRadius: theme.radius.md,
                                            padding: 10,
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={15} color={theme.colors.muted} />
                                        <Text style={{ fontSize: 13, color: dataInicio ? theme.colors.text : theme.colors.muted }}>
                                            {dataInicio ? dataInicio.toLocaleDateString("pt-BR") : "Data início"}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => abrirPicker("fim")}
                                        style={{
                                            flex: 1,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                            backgroundColor: theme.colors.surface,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                            borderRadius: theme.radius.md,
                                            padding: 10,
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={15} color={theme.colors.muted} />
                                        <Text style={{ fontSize: 13, color: dataFim ? theme.colors.text : theme.colors.muted }}>
                                            {dataFim ? dataFim.toLocaleDateString("pt-BR") : "Data fim"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* ── FILTRO STATUS ── */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {["TODOS", "FINALIZADA", "CANCELADA"].map((s) => {
                                        const ativoS = filtroStatus === s;
                                        const cor = STATUS_COR[s];
                                        return (
                                            <TouchableOpacity
                                                key={s}
                                                onPress={() => setFiltroStatus(s)}
                                                style={{
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 6,
                                                    borderRadius: theme.radius.full,
                                                    backgroundColor: ativoS ? (cor?.bg || theme.colors.primaryLight) : theme.colors.surface,
                                                    borderWidth: 1,
                                                    borderColor: ativoS ? (cor?.text || theme.colors.primary) : theme.colors.border,
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    fontFamily: theme.fonts.semiBold,
                                                    color: ativoS ? (cor?.text || theme.colors.primary) : theme.colors.muted,
                                                }}>
                                                    {s === "TODOS" ? "Todos" : s.charAt(0) + s.slice(1).toLowerCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            {/* ── CARD RESUMO ── */}
                            <Card style={{ backgroundColor: theme.colors.primaryLight, marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, color: theme.colors.primary, fontFamily: theme.fonts.semiBold, marginBottom: 10 }}>
                                    RESUMO DO PERÍODO
                                </Text>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ alignItems: "center" }}>
                                        <Text style={{ fontSize: 20, fontFamily: theme.fonts.semiBold, color: theme.colors.primaryDark }}>
                                            {resumo.qtdFinalizadas}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 2 }}>Compras</Text>
                                    </View>
                                    <View style={{ width: 1, backgroundColor: theme.colors.primary + "30" }} />
                                    <View style={{ alignItems: "center" }}>
                                        <Text style={{ fontSize: 20, fontFamily: theme.fonts.semiBold, color: theme.colors.primaryDark }}>
                                            {formataMoeda(resumo.totalGasto)}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 2 }}>Total gasto</Text>
                                    </View>
                                    <View style={{ width: 1, backgroundColor: theme.colors.primary + "30" }} />
                                    <View style={{ alignItems: "center" }}>
                                        <Text style={{ fontSize: 20, fontFamily: theme.fonts.semiBold, color: "#C62828" }}>
                                            {formataMoeda(resumo.totalDesconto)}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 2 }}>Descontos</Text>
                                    </View>
                                </View>
                            </Card>
                        </View>
                    }
                />

                {showPicker && (
                    <DateTimePicker
                        value={pickerAlvo === "inicio" ? (dataInicio || new Date()) : (dataFim || new Date())}
                        mode="date"
                        display="default"
                        onChange={handlePickerChange}
                    />
                )}

                <FAB onPress={() => navigation.navigate("NovaCompra")} />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}