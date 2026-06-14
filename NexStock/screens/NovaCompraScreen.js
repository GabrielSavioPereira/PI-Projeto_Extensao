import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Modal
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Header, Card, PrimaryButton, SectionLabel, FormField, EmptyState, theme } from "../components/ui";
import { finalizaCompra } from "../services/MovCompraService";
import { escutaFornecedores } from "../services/FornecedorService";
import { escutaCondPag } from "../services/CondPagService";
import { buscaVariacoes } from "../services/ProdutoVariacaoService";
import { buscaProdutos } from "../services/ProdutoService";

// ─── STEP INDICATOR ────────────────────────────────────────────
function StepIndicator({ step }) {
    const steps = ["Cabeçalho", "Itens", "Pagamento"];
    return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
            {steps.map((label, i) => {
                const num = i + 1;
                const ativo = step === num;
                const feito = step > num;
                return (
                    <React.Fragment key={i}>
                        <View style={{ alignItems: "center" }}>
                            <View style={{
                                width: 30, height: 30, borderRadius: 15,
                                backgroundColor: ativo || feito ? theme.colors.primary : theme.colors.border,
                                alignItems: "center", justifyContent: "center",
                            }}>
                                {feito
                                    ? <Ionicons name="checkmark" size={16} color="#fff" />
                                    : <Text style={{ color: ativo ? "#fff" : theme.colors.muted, fontSize: 13, fontFamily: theme.fonts.semiBold }}>{num}</Text>
                                }
                            </View>
                            <Text style={{ fontSize: 10, marginTop: 4, color: ativo ? theme.colors.primary : theme.colors.muted, fontFamily: theme.fonts.semiBold }}>
                                {label}
                            </Text>
                        </View>
                        {i < steps.length - 1 && (
                            <View style={{ flex: 1, height: 2, backgroundColor: step > num ? theme.colors.primary : theme.colors.border, marginBottom: 14, marginHorizontal: 6 }} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

// ─── SELECTOR MODAL ────────────────────────────────────────────
function SelectorModal({ visible, onClose, titulo, lista, labelKey, onSelect }) {
    const [busca, setBusca] = useState("");
    const filtrada = lista.filter(i =>
        (i[labelKey] || "").toLowerCase().includes(busca.toLowerCase())
    );
    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.text }}>{titulo}</Text>
                </View>
                <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <TextInput
                        style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 10, fontFamily: theme.fonts.regular, fontSize: 14 }}
                        placeholder="Buscar..."
                        value={busca}
                        onChangeText={setBusca}
                    />
                </View>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {filtrada.length === 0 && <EmptyState mensagem="Nenhum item encontrado" />}
                    {filtrada.map((item, idx) => (
                        <TouchableOpacity key={idx} onPress={() => { onSelect(item); onClose(); setBusca(""); }}
                            style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text }}>{item[labelKey]}</Text>
                            {item.subtitulo ? <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>{item.subtitulo}</Text> : null}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── MODAL ADICIONAR ITEM ──────────────────────────────────────
function AddItemModal({ visible, onClose, onAdd, variacoes, produtos }) {
    const [busca, setBusca] = useState("");
    const [varSelecionada, setVarSelecionada] = useState(null);
    const [quantidade, setQuantidade] = useState("1");
    const [custo, setCusto] = useState("");

    const lista = variacoes
        .filter(v => v.codigo?.toLowerCase().includes(busca.toLowerCase()) || v.sku?.toLowerCase().includes(busca.toLowerCase()))
        .map(v => {
            const p = produtos.find(p => p.id === v.produto_id || p.documentoId === v.produto_id);
            return { ...v, produto_nome: p?.nome || "" };
        });

    const handleAdd = () => {
        if (!varSelecionada) return Alert.alert("Atenção", "Selecione uma variação");
        const qtd = parseInt(quantidade);
        const custoVal = parseFloat(custo.replace(",", "."));
        if (!qtd || qtd <= 0) return Alert.alert("Atenção", "Quantidade inválida");
        if (!custoVal || custoVal <= 0) return Alert.alert("Atenção", "Custo inválido");

        onAdd({
            variacao_id: varSelecionada.documentoId,
            variacao_codigo: varSelecionada.codigo,
            produto_nome: varSelecionada.produto_nome,
            quantidade: qtd,
            custo_unitario: custoVal,
            total_item: parseFloat((qtd * custoVal).toFixed(2)),
        });
        setVarSelecionada(null); setBusca(""); setQuantidade("1"); setCusto("");
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.text }}>Adicionar produto</Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <SectionLabel titulo="Buscar variação" icone="search" />
                    <TextInput
                        style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 }}
                        placeholder="Código ou SKU"
                        value={busca}
                        onChangeText={(t) => { setBusca(t); setVarSelecionada(null); }}
                    />
                    {busca.length > 0 && !varSelecionada && (
                        <Card style={{ marginBottom: 12, padding: 0 }}>
                            {lista.slice(0, 5).map((v, idx) => (
                                <TouchableOpacity key={idx} onPress={() => { setVarSelecionada(v); setBusca(""); }}
                                    style={{ padding: 12, borderBottomWidth: idx < lista.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
                                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text }}>{v.produto_nome}</Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted }}>Cód: {v.codigo} · SKU: {v.sku}</Text>
                                </TouchableOpacity>
                            ))}
                            {lista.length === 0 && <Text style={{ padding: 12, color: theme.colors.muted }}>Nenhuma variação encontrada</Text>}
                        </Card>
                    )}
                    {varSelecionada && (
                        <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, padding: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <View>
                                <Text style={{ fontFamily: theme.fonts.semiBold, color: theme.colors.primaryDark }}>{varSelecionada.produto_nome}</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.primary }}>Cód: {varSelecionada.codigo}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setVarSelecionada(null)}>
                                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <SectionLabel titulo="Quantidade e custo" icone="calculator" />
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <FormField label="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <FormField label="Custo unit. (R$)" value={custo} onChangeText={setCusto} keyboardType="decimal-pad" placeholder="0,00" />
                        </View>
                    </View>

                    {quantidade && custo ? (
                        <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, padding: 12, marginBottom: 20, flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: theme.colors.primaryDark }}>Total do item</Text>
                            <Text style={{ fontFamily: theme.fonts.semiBold, color: theme.colors.primary }}>
                                {(parseInt(quantidade || 0) * parseFloat((custo || "0").replace(",", "."))).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </Text>
                        </View>
                    ) : null}

                    <PrimaryButton title="Adicionar item" onPress={handleAdd} icone="add-circle-outline" />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── TELA PRINCIPAL ────────────────────────────────────────────
export default function NovaCompraScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [salvando, setSalvando] = useState(false);

    // Dados Step 1
    const [fornecedor, setFornecedor] = useState(null);
    const [condpag, setCondpag] = useState(null);
    const [nf, setNf] = useState("");
    const [dataCompra, setDataCompra] = useState(new Date());
    const [obs, setObs] = useState("");
    const [showDate, setShowDate] = useState(false);

    // Dados Step 2
    const [itens, setItens] = useState([]);
    const [addItemVisible, setAddItemVisible] = useState(false);

    // Dados Step 3
    const [desconto, setDesconto] = useState("0");
    const [numParcelas, setNumParcelas] = useState("1");
    const [intervaloDias, setIntervaloDias] = useState("30");

    // Listas
    const [fornecedores, setFornecedores] = useState([]);
    const [condpags, setCondpags] = useState([]);
    const [variacoes, setVariacoes] = useState([]);
    const [produtos, setProdutos] = useState([]);

    // Modais seletor
    const [modalForn, setModalForn] = useState(false);
    const [modalCond, setModalCond] = useState(false);

    useEffect(() => {
        const unsubForn = escutaFornecedores((lista) => setFornecedores(lista));
        const unsubCond = escutaCondPag((lista) => setCondpags(lista));

        (async () => {
            const [vRes, pRes] = await Promise.all([
                buscaVariacoes(),
                buscaProdutos(),
            ]);
            if (vRes.success) setVariacoes(vRes.variacoes);
            if (pRes.success) setProdutos(pRes.produtos);
        })();

        return () => {
            unsubForn();
            unsubCond();
        };
    }, []);

    const subtotal = itens.reduce((acc, i) => acc + i.total_item, 0);
    const descontoVal = parseFloat((desconto || "0").replace(",", ".")) || 0;
    const total = subtotal - descontoVal;

    const formataMoeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const removerItem = (idx) => {
        Alert.alert("Remover", "Deseja remover este item?", [
            { text: "Não", style: "cancel" },
            { text: "Sim", onPress: () => setItens(itens.filter((_, i) => i !== idx)) },
        ]);
    };

    const handleFinalizar = async () => {
        if (!fornecedor) return Alert.alert("Atenção", "Selecione o fornecedor");
        if (!condpag) return Alert.alert("Atenção", "Selecione a condição de pagamento");
        if (itens.length === 0) return Alert.alert("Atenção", "Adicione ao menos um item");

        setSalvando(true);
        const parcelas = condpag?.permite_parcelar ? (parseInt(numParcelas) || 1) : 1;
        const res = await finalizaCompra({
            fornecedor_id: fornecedor.documentoId,
            condpag: { ...condpag, num_parcelas: parcelas, intervalo_dias: parseInt(intervaloDias) || 30 },
            nf,
            data: dataCompra,
            obs,
            desconto: descontoVal,
            itens,
        });
        setSalvando(false);

        if (res.success) {
            Alert.alert("Sucesso!", res.message, [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } else {
            Alert.alert("Erro", res.message);
        }
    };

    const validaStep1 = () => {
        if (!fornecedor) return Alert.alert("Atenção", "Selecione o fornecedor");
        if (!condpag) return Alert.alert("Atenção", "Selecione a condição de pagamento");
        setStep(2);
    };

    const validaStep2 = () => {
        if (itens.length === 0) return Alert.alert("Atenção", "Adicione ao menos um item");
        setStep(3);
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header title="Nova Compra" onBack={() => navigation.goBack()} />
                <StepIndicator step={step} />

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

                    {/* ── STEP 1: CABEÇALHO ── */}
                    {step === 1 && (
                        <View>
                            <SectionLabel titulo="Fornecedor" icone="business" />
                            <TouchableOpacity onPress={() => setModalForn(true)}
                                style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <Text style={{ color: fornecedor ? theme.colors.text : theme.colors.muted, fontFamily: theme.fonts.regular, fontSize: 15 }}>
                                    {fornecedor ? fornecedor.nome : "Selecionar fornecedor"}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
                            </TouchableOpacity>

                            <SectionLabel titulo="Nota fiscal e data" icone="document-text" />
                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <FormField label="Nº Nota Fiscal" value={nf} onChangeText={setNf} keyboardType="numeric" placeholder="Opcional" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.secondary, marginBottom: 4, fontWeight: "500" }}>Data</Text>
                                    <TouchableOpacity onPress={() => setShowDate(true)}
                                        style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text }}>
                                            {dataCompra.toLocaleDateString("pt-BR")}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={16} color={theme.colors.muted} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <SectionLabel titulo="Condição de pagamento" icone="card" />
                            <TouchableOpacity onPress={() => setModalCond(true)}
                                style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <View>
                                    <Text style={{ color: condpag ? theme.colors.text : theme.colors.muted, fontFamily: theme.fonts.regular, fontSize: 15 }}>
                                        {condpag ? condpag.descricao : "Selecionar condição"}
                                    </Text>
                                    {condpag && (
                                        <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                                            {condpag.num_parcelas}x · vence a cada {condpag.intervalo_dias} dias
                                        </Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
                            </TouchableOpacity>

                            <FormField label="Observações (opcional)" value={obs} onChangeText={setObs} multiline placeholder="Ex: Compra referente ao pedido 123..." />

                            <PrimaryButton title="Próximo: Itens" onPress={validaStep1} icone="arrow-forward" style={{ marginTop: 8 }} />
                        </View>
                    )}

                    {/* ── STEP 2: ITENS ── */}
                    {step === 2 && (
                        <View>
                            <SectionLabel titulo="Produtos" icone="cube" />

                            {itens.length === 0 && (
                                <EmptyState icone="cube-outline" mensagem="Nenhum produto adicionado ainda" />
                            )}

                            {itens.map((item, idx) => (
                                <Card key={idx} style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text }}>{item.produto_nome}</Text>
                                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>Cód: {item.variacao_codigo}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removerItem(idx)} style={{ padding: 4 }}>
                                            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                                        <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                                            {item.quantidade}x {formataMoeda(item.custo_unitario)}
                                        </Text>
                                        <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary }}>
                                            {formataMoeda(item.total_item)}
                                        </Text>
                                    </View>
                                </Card>
                            ))}

                            <TouchableOpacity
                                onPress={() => setAddItemVisible(true)}
                                style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.primary, borderRadius: theme.radius.md, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 8 }}>
                                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semiBold, fontSize: 14 }}>Adicionar produto</Text>
                            </TouchableOpacity>

                            {itens.length > 0 && (
                                <Card style={{ marginTop: 8, backgroundColor: theme.colors.primaryLight }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text style={{ color: theme.colors.primaryDark }}>Subtotal ({itens.length} {itens.length === 1 ? "item" : "itens"})</Text>
                                        <Text style={{ fontFamily: theme.fonts.semiBold, color: theme.colors.primary }}>{formataMoeda(subtotal)}</Text>
                                    </View>
                                </Card>
                            )}

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                                <TouchableOpacity onPress={() => setStep(1)}
                                    style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radius.md, padding: 14, alignItems: "center" }}>
                                    <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semiBold }}>Voltar</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 2 }}>
                                    <PrimaryButton title="Próximo: Pagamento" onPress={validaStep2} icone="arrow-forward" />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── STEP 3: PAGAMENTO ── */}
                    {step === 3 && (
                        <View>
                            <SectionLabel titulo="Resumo dos itens" icone="list" />
                            {itens.map((item, idx) => (
                                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                                    <Text style={{ fontSize: 13, color: theme.colors.text, flex: 1 }}>{item.produto_nome}</Text>
                                    <Text style={{ fontSize: 13, color: theme.colors.muted }}>{item.quantidade}x</Text>
                                    <Text style={{ fontSize: 13, color: theme.colors.text, minWidth: 80, textAlign: "right" }}>{formataMoeda(item.total_item)}</Text>
                                </View>
                            ))}

                            <SectionLabel titulo="Desconto" icone="pricetag" />
                            <FormField
                                label="Valor do desconto (R$)"
                                value={desconto}
                                onChangeText={setDesconto}
                                keyboardType="decimal-pad"
                                placeholder="0,00"
                            />

                            <SectionLabel titulo="Condição de pagamento" icone="card" />
                            <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, padding: 12, marginBottom: 12 }}>
                                <Text style={{ fontFamily: theme.fonts.semiBold, color: theme.colors.primaryDark }}>{condpag?.nome}</Text>
                                {condpag?.descricao ? <Text style={{ fontSize: 12, color: theme.colors.primary, marginTop: 2 }}>{condpag.descricao}</Text> : null}
                                <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Ionicons
                                        name={condpag?.permite_parcelar ? "checkmark-circle" : "close-circle"}
                                        size={14}
                                        color={condpag?.permite_parcelar ? "#4CAF50" : theme.colors.muted}
                                    />
                                    <Text style={{ fontSize: 12, color: condpag?.permite_parcelar ? "#4CAF50" : theme.colors.muted }}>
                                        {condpag?.permite_parcelar ? "Permite parcelamento" : "Não permite parcelamento"}
                                    </Text>
                                </View>
                            </View>

                            {/* Parcelamento — só aparece se condpag permite */}
                            {condpag?.permite_parcelar && (
                                <>
                                    <SectionLabel titulo="Parcelamento" icone="layers-outline" />
                                    <View style={{ flexDirection: "row", gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <FormField
                                                label="Nº de parcelas"
                                                value={numParcelas}
                                                onChangeText={(v) => setNumParcelas(v.replace(/[^0-9]/g, ""))}
                                                keyboardType="numeric"
                                                placeholder="1"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <FormField
                                                label="Intervalo (dias)"
                                                value={intervaloDias}
                                                onChangeText={(v) => setIntervaloDias(v.replace(/[^0-9]/g, ""))}
                                                keyboardType="numeric"
                                                placeholder="30"
                                            />
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Preview das parcelas */}
                            {(() => {
                                const parc = condpag?.permite_parcelar ? (parseInt(numParcelas) || 1) : 1;
                                const interv = condpag?.permite_parcelar ? (parseInt(intervaloDias) || 30) : 30;
                                if (parc < 1) return null;
                                return (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 8 }}>
                                            {parc === 1 ? "Vencimento:" : "Parcelas que serão geradas:"}
                                        </Text>
                                        {Array.from({ length: parc }).map((_, i) => {
                                            const venc = new Date(dataCompra);
                                            venc.setDate(venc.getDate() + interv * (i + 1));
                                            return (
                                                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                                                    <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                                                        {parc === 1 ? "À vista" : `Parcela ${i + 1}/${parc}`}
                                                    </Text>
                                                    <Text style={{ fontSize: 13, color: theme.colors.muted }}>{venc.toLocaleDateString("pt-BR")}</Text>
                                                    <Text style={{ fontSize: 13, fontFamily: theme.fonts.semiBold, color: theme.colors.text }}>
                                                        {formataMoeda(total / parc)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })()}

                            {/* Total final */}
                            <Card style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                    <Text style={{ color: theme.colors.muted }}>Subtotal</Text>
                                    <Text style={{ color: theme.colors.text }}>{formataMoeda(subtotal)}</Text>
                                </View>
                                {descontoVal > 0 && (
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                        <Text style={{ color: theme.colors.muted }}>Desconto</Text>
                                        <Text style={{ color: theme.colors.danger }}>- {formataMoeda(descontoVal)}</Text>
                                    </View>
                                )}
                                <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text }}>Total</Text>
                                    <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.primary }}>{formataMoeda(total)}</Text>
                                </View>
                            </Card>

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <TouchableOpacity onPress={() => setStep(2)}
                                    style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radius.md, padding: 14, alignItems: "center" }}>
                                    <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semiBold }}>Voltar</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 2 }}>
                                    <PrimaryButton title={salvando ? "Salvando..." : "Registrar Compra"} onPress={handleFinalizar} loading={salvando} icone="checkmark-circle-outline" />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* ── MODAIS ── */}
                {showDate && (
                    <DateTimePicker value={dataCompra} mode="date" display="default"
                        onChange={(e, d) => { setShowDate(false); if (d) setDataCompra(d); }} />
                )}

                <SelectorModal
                    visible={modalForn}
                    onClose={() => setModalForn(false)}
                    titulo="Selecionar fornecedor"
                    lista={fornecedores}
                    labelKey="nome"
                    onSelect={setFornecedor}
                />

                <SelectorModal
                    visible={modalCond}
                    onClose={() => setModalCond(false)}
                    titulo="Condição de pagamento"
                    lista={condpags.map(c => ({ ...c, subtitulo: `${c.num_parcelas}x · a cada ${c.intervalo_dias} dias` }))}
                    labelKey="descricao"
                    onSelect={setCondpag}
                />

                <AddItemModal
                    visible={addItemVisible}
                    onClose={() => setAddItemVisible(false)}
                    onAdd={(item) => setItens([...itens, item])}
                    variacoes={variacoes}
                    produtos={produtos}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}