import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    Alert,
    StyleSheet,
    Pressable,
    Modal,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { addProduto, alteraProduto } from "../services/ProdutoService";
import { addVariacao, alteraVariacao, deletaVariacao, buscaVariacoesPorProduto } from "../services/ProdutoVariacaoService";
import { inicializaSaldo } from "../services/SaldoVariacaoService";
import { buscaMarcas } from "../services/MarcaService";
import { buscaCategs } from "../services/CategoriaService";
import { buscaUmeds } from "../services/UnmedidaService";
import { buscaCores } from "../services/CorService";
import { buscaTams } from "../services/TamanhoService";
import { buscaFornecedores } from "../services/FornecedorService";

import {
    Header,
    FormField,
    PrimaryButton,
    SectionLabel,
    theme,
} from "../components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// PickerField — dropdown via Modal (sem bugs de zIndex/scroll/sobreposição)
// ─────────────────────────────────────────────────────────────────────────────
function PickerField({ label, valor, placeholder, opcoes, onSelect, icone }) {
    const [aberto, setAberto] = useState(false);
    const selecionado = opcoes.find((o) => o.value === valor);

    return (
        <View style={pickerSt.wrap}>
            {label ? <Text style={pickerSt.label}>{label}</Text> : null}

            {/* Botão que abre o modal */}
            <Pressable
                style={[pickerSt.input, aberto && { borderColor: theme.colors.primary }]}
                onPress={() => setAberto(true)}
            >
                {icone ? (
                    <Ionicons name={icone} size={16} color={theme.colors.muted} style={{ marginRight: 8 }} />
                ) : null}
                <Text
                    style={[pickerSt.valor, !selecionado && { color: theme.colors.muted }]}
                    numberOfLines={1}
                >
                    {selecionado ? selecionado.label : placeholder}
                </Text>
                <Ionicons
                    name={aberto ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.colors.muted}
                />
            </Pressable>

            {/* Modal com a lista de opções — renderiza fora da hierarquia,
                sem problemas de zIndex, scroll ou corte */}
            <Modal
                visible={aberto}
                transparent
                animationType="fade"
                onRequestClose={() => setAberto(false)}
            >
                <Pressable style={pickerSt.modalOverlay} onPress={() => setAberto(false)}>
                    {/* stopPropagation para clique dentro do card não fechar */}
                    <Pressable style={pickerSt.modalCard} onPress={() => {}}>
                        {/* Título do picker */}
                        <View style={pickerSt.modalHeader}>
                            <Text style={pickerSt.modalTitulo}>{label ?? placeholder}</Text>
                            <Pressable onPress={() => setAberto(false)}>
                                <Ionicons name="close" size={20} color={theme.colors.muted} />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={{ maxHeight: 360 }}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {opcoes.map((op, idx) => (
                                <Pressable
                                    key={`${idx}-${op.value}`}
                                    style={[
                                        pickerSt.opcao,
                                        op.value === valor && pickerSt.opcaoSel,
                                        idx === opcoes.length - 1 && { borderBottomWidth: 0 },
                                    ]}
                                    onPress={() => {
                                        onSelect(op.value);
                                        setAberto(false);
                                    }}
                                >
                                    {op.hex ? (
                                        <View style={[pickerSt.bolinha, { backgroundColor: op.hex }]} />
                                    ) : null}
                                    <Text style={[
                                        pickerSt.opcaoText,
                                        op.value === valor && { color: theme.colors.primary, fontFamily: "Poppins_600SemiBold" },
                                    ]}>
                                        {op.label}
                                    </Text>
                                    {op.value === valor && (
                                        <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const pickerSt = StyleSheet.create({
    wrap: { marginBottom: 12 },
    label: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: theme.colors.secondary,
        marginBottom: 4,
        fontWeight: "500",
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        ...theme.shadow,
    },
    valor: {
        flex: 1,
        fontFamily: "Poppins_400Regular",
        fontSize: 15,
        color: theme.colors.text,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "#00000060",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        ...theme.shadow,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitulo: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: theme.colors.text,
    },
    opcao: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    opcaoSel: { backgroundColor: theme.colors.primaryLight },
    opcaoText: {
        flex: 1,
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: theme.colors.text,
    },
    bolinha: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Indicador de etapa
// ─────────────────────────────────────────────────────────────────────────────
function StepIndicator({ etapaAtual }) {
    const etapas = ["Produto", "Variacoes"];
    return (
        <View style={stepSt.container}>
            {etapas.map((label, i) => {
                const num       = i + 1;
                const ativa     = etapaAtual === num;
                const concluida = etapaAtual > num;
                return (
                    <React.Fragment key={num}>
                        <View style={stepSt.etapa}>
                            <View style={[
                                stepSt.circulo,
                                ativa     && stepSt.circuloAtivo,
                                concluida && stepSt.circuloConcluido,
                            ]}>
                                {concluida
                                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                                    : <Text style={[stepSt.num, (ativa || concluida) && { color: "#fff" }]}>{num}</Text>
                                }
                            </View>
                            <Text style={[stepSt.label, ativa && { color: theme.colors.primary, fontFamily: "Poppins_600SemiBold" }]}>
                                {label}
                            </Text>
                        </View>
                        {i < etapas.length - 1 && (
                            <View style={[stepSt.linha, concluida && { backgroundColor: theme.colors.primary }]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

const stepSt = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    etapa: { alignItems: "center", gap: 4 },
    circulo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    circuloAtivo:    { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
    circuloConcluido:{ borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
    num: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: theme.colors.muted,
    },
    label: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: theme.colors.muted,
    },
    linha: {
        flex: 1,
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: 8,
        marginBottom: 16,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Linha de variacao na etapa 2
// ─────────────────────────────────────────────────────────────────────────────
function LinhaVariacao({ variacao, cores, tamanhos, onRemover, onAlterarSku, onAlterarPreco, index }) {
    const cor     = cores.find((c) => c.id === variacao.cor_id);
    const tamanho = tamanhos.find((t) => t.id === variacao.tamanho_id);

    return (
        <View style={varSt.linha}>
            <View style={varSt.info}>
                {/* Tags cor + tamanho */}
                <View style={varSt.tags}>
                    {cor?.hex ? (
                        <View style={[varSt.bolinha, { backgroundColor: cor.hex }]} />
                    ) : null}
                    <View style={varSt.tag}>
                        <Text style={varSt.tagText}>{cor?.nome ?? "-"}</Text>
                    </View>
                    <View style={varSt.tag}>
                        <Text style={varSt.tagText}>{tamanho?.nome ?? "-"}</Text>
                    </View>
                </View>

                <FormField
                    label="SKU"
                    value={variacao.sku}
                    onChangeText={(t) => onAlterarSku(index, t)}
                    placeholder="Ex.: CAM-PRE-M"
                    autoCapitalize="characters"
                />
                <View style={varSt.precos}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <FormField
                            label="Custo (R$)"
                            value={variacao.preco_custo?.toString() ?? ""}
                            onChangeText={(t) => onAlterarPreco(index, "preco_custo", t)}
                            placeholder="0,00"
                            keyboardType="decimal-pad"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FormField
                            label="Venda (R$)"
                            value={variacao.preco_venda?.toString() ?? ""}
                            onChangeText={(t) => onAlterarPreco(index, "preco_venda", t)}
                            placeholder="0,00"
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>
            </View>

            <Pressable style={varSt.btnRemover} onPress={() => onRemover(index)}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
            </Pressable>
        </View>
    );
}

const varSt = StyleSheet.create({
    linha: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: 12,
        marginBottom: 10,
        gap: 10,
        ...theme.shadow,
    },
    info: { flex: 1 },
    tags: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" },
    bolinha: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tag: {
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    tagText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: theme.colors.primary,
    },
    precos: {
        flexDirection: "row",
    },
    btnRemover: {
        padding: 8,
        marginTop: 4,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TELA PRINCIPAL — Wizard 2 etapas
// ─────────────────────────────────────────────────────────────────────────────
export default function ProdutoFormScreen({ route, navigation }) {
    const produto  = route.params?.produto;
    const editando = !!produto;

    const [etapa, setEtapa] = useState(1);

    // Dados auxiliares
    const [marcas, setMarcas]             = useState([]);
    const [categorias, setCategorias]     = useState([]);
    const [unidades, setUnidades]         = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [cores, setCores]               = useState([]);
    const [tamanhos, setTamanhos]         = useState([]);
    const [carregando, setCarregando]     = useState(true);

    // Etapa 1
    const [nome, setNome]                   = useState(produto?.nome ?? "");
    const [codigo, setCodigo]               = useState(produto?.codigo ?? "");
    const [marca_id, setMarcaId]            = useState(produto?.marca_id ?? null);
    const [categoria_id, setCategoriaId]    = useState(produto?.categoria_id ?? null);
    const [unidade_id, setUnidadeId]        = useState(produto?.unidade_id ?? null);
    const [fornecedor_id, setFornecedorId]  = useState(produto?.fornecedor_id ?? null);
    const [salvando, setSalvando]           = useState(false);

    // Etapa 2
    const [variacoes, setVariacoes]   = useState([]);
    const [corSel, setCorSel]         = useState(null);
    const [tamanhoSel, setTamanhoSel] = useState(null);
    const [precoCustoNovo, setPrecoCustoNovo] = useState("");
    const [precoVendaNovo, setPrecoVendaNovo] = useState("");

    const [produtoSalvo, setProdutoSalvo] = useState(produto ?? null);

    useEffect(() => {
        async function carrega() {
            const [marcRes, catRes, umedRes, fornRes, corRes, tamRes] = await Promise.all([
                buscaMarcas(),
                buscaCategs(),
                buscaUmeds(),
                buscaFornecedores(),
                buscaCores(),
                buscaTams(),
            ]);
            if (marcRes.success)  setMarcas(marcRes.marcas);
            if (catRes.success)   setCategorias(catRes.categs);
            if (umedRes.success)  setUnidades(umedRes.umeds);
            if (fornRes.success)  setFornecedores(fornRes.fornecedores);
            if (corRes.success)   setCores(corRes.cores);
            if (tamRes.success)   setTamanhos(tamRes.tams.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)));
            setCarregando(false);
        }
        carrega();

        if (editando) {
            buscaVariacoesPorProduto(produto.id).then((res) => {
                if (res.success) {
                    setVariacoes(res.variacoes.map((v) => ({
                        documentoId:  v.documentoId,
                        cor_id:       v.cor_id,
                        tamanho_id:   v.tamanho_id,
                        sku:          v.sku ?? "",
                        preco_custo:  v.preco_custo?.toString() ?? "",
                        preco_venda:  v.preco_venda?.toString() ?? "",
                        salva: true,
                    })));
                }
            });
        }
    }, []);

    // ── Etapa 1: salva produto e avança ──────────────────────────────────────
    async function avancarEtapa1() {
        if (!nome.trim())   { Alert.alert("Atencao", "Informe o nome do produto."); return; }
        if (!marca_id)      { Alert.alert("Atencao", "Selecione uma marca."); return; }
        if (!categoria_id)  { Alert.alert("Atencao", "Selecione uma categoria."); return; }

        setSalvando(true);

        const obj = {
            nome: nome.trim(),
            codigo: codigo.trim(),
            marca_id,
            categoria_id,
            unidade_id,
            fornecedor_id,
        };

        let response;
        if (editando) {
            response = await alteraProduto(produto.documentoId, obj);
            if (response.success) setProdutoSalvo(produto);
        } else {
            response = await addProduto(obj);
            if (response.success) {
                setProdutoSalvo({ ...obj, id: response.proximoId, documentoId: response.id });
            }
        }

        setSalvando(false);

        if (response.success) {
            setEtapa(2);
        } else {
            Alert.alert("Erro", response.message ?? "Nao foi possivel salvar o produto.");
        }
    }

    // ── Etapa 2: adiciona variação na lista local ─────────────────────────────
    function adicionarVariacao() {
        if (!corSel || !tamanhoSel) {
            Alert.alert("Atencao", "Selecione cor e tamanho.");
            return;
        }
        const jaExiste = variacoes.some((v) => v.cor_id === corSel && v.tamanho_id === tamanhoSel);
        if (jaExiste) {
            Alert.alert("Atencao", "Ja existe uma variacao com essa cor e tamanho.");
            return;
        }

        const prod   = produtoSalvo;
        const cor    = cores.find((c) => c.id === corSel);
        const tam    = tamanhos.find((t) => t.id === tamanhoSel);
        const cod    = prod?.codigo ?? prod?.nome?.slice(0, 3).toUpperCase() ?? "PRD";
        const corSig = cor?.nome?.slice(0, 3).toUpperCase() ?? "COR";
        const tamSig = tam?.nome?.toUpperCase() ?? "TAM";

        setVariacoes((prev) => [...prev, {
            cor_id:      corSel,
            tamanho_id:  tamanhoSel,
            sku:         `${cod}-${corSig}-${tamSig}`,
            preco_custo: precoCustoNovo,
            preco_venda: precoVendaNovo,
            salva:       false,
        }]);

        setCorSel(null);
        setTamanhoSel(null);
        setPrecoCustoNovo("");
        setPrecoVendaNovo("");
    }

    function removerVariacao(index) {
        const v = variacoes[index];
        if (v.salva) {
            Alert.alert(
                "Remover variacao",
                "Deseja excluir esta variacao? O saldo ja registrado nao sera afetado.",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Excluir",
                        style: "destructive",
                        onPress: async () => {
                            await deletaVariacao(v.documentoId);
                            setVariacoes((prev) => prev.filter((_, i) => i !== index));
                        },
                    },
                ]
            );
        } else {
            setVariacoes((prev) => prev.filter((_, i) => i !== index));
        }
    }

    function alterarSku(index, novoSku) {
        setVariacoes((prev) => prev.map((v, i) => i === index ? { ...v, sku: novoSku } : v));
    }

    function alterarPreco(index, campo, valor) {
        setVariacoes((prev) => prev.map((v, i) => i === index ? { ...v, [campo]: valor } : v));
    }

    // ── Etapa 2: salva variações e finaliza ──────────────────────────────────
    async function salvarVariacoes() {
        if (variacoes.length === 0) {
            Alert.alert("Atencao", "Adicione ao menos uma variacao antes de finalizar.");
            return;
        }
        if (variacoes.some((v) => !v.sku.trim())) {
            Alert.alert("Atencao", "Preencha o SKU de todas as variacoes.");
            return;
        }

        setSalvando(true);

        const novas      = variacoes.filter((v) => !v.salva);
        const existentes = variacoes.filter((v) => v.salva);
        const erros      = [];

        for (const v of novas) {
            const res = await addVariacao({
                produto_id:  produtoSalvo.id,
                cor_id:      v.cor_id,
                tamanho_id:  v.tamanho_id,
                sku:         v.sku.trim(),
                preco_custo: parseFloat(v.preco_custo) || 0,
                preco_venda: parseFloat(v.preco_venda) || 0,
            });

            if (res.success) {
                await inicializaSaldo(res.proximoId ?? produtoSalvo.id);
            } else {
                erros.push(v.sku + ": " + (res.message ?? "erro"));
            }
        }

        for (const v of existentes) {
            await alteraVariacao(v.documentoId, {
                sku:         v.sku.trim(),
                preco_custo: parseFloat(v.preco_custo) || 0,
                preco_venda: parseFloat(v.preco_venda) || 0,
            });
        }

        setSalvando(false);

        if (erros.length > 0) {
            Alert.alert("Atencao", "Algumas variacoes nao foram salvas:\n" + erros.join("\n"));
        } else {
            Alert.alert(
                "Sucesso",
                editando ? "Produto e variacoes atualizados!" : "Produto cadastrado com sucesso!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        }
    }

    // ── Opções dos pickers ────────────────────────────────────────────────────
    const opcMarcas       = marcas.map((m) => ({ value: m.id, label: m.nome }));
    const opcCategorias   = categorias.map((c) => ({ value: c.id, label: c.nome }));
    const opcUnidades     = unidades.map((u) => ({ value: u.id, label: u.nome + (u.sigla ? " (" + u.sigla + ")" : "") }));
    const opcFornecedores = fornecedores.map((f) => ({ value: f.id, label: f.nome }));
    const opcCores        = cores.map((c) => ({ value: c.id, label: c.nome, hex: c.hex }));
    const opcTamanhos     = tamanhos.map((t) => ({ value: t.id, label: t.nome }));

    if (carregando) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <Header title={editando ? "Editar Produto" : "Novo Produto"} onBack={() => navigation.goBack()} />
                    <View style={styles.loadingWrap}>
                        <Text style={styles.loadingText}>Carregando dados...</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <Header
                    title={editando ? "Editar Produto" : "Novo Produto"}
                    onBack={() => etapa === 2 ? setEtapa(1) : navigation.goBack()}
                />

                <StepIndicator etapaAtual={etapa} />

                {/* ════════ ETAPA 1 — DADOS DO PRODUTO ════════ */}
                {etapa === 1 && (
                    <ScrollView
                        style={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <SectionLabel titulo="Identificacao" icone="shirt-outline" />
                        <FormField
                            label="Nome do produto *"
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Ex.: Camiseta Polo"
                            autoCapitalize="words"
                        />
                        <FormField
                            label="Codigo interno"
                            value={codigo}
                            onChangeText={setCodigo}
                            placeholder="Ex.: CAM001"
                            autoCapitalize="characters"
                        />

                        <SectionLabel titulo="Classificacao" icone="grid-outline" />
                        <PickerField
                            label="Marca *"
                            valor={marca_id}
                            placeholder="Selecione uma marca..."
                            opcoes={opcMarcas}
                            onSelect={setMarcaId}
                            icone="business-outline"
                        />
                        <PickerField
                            label="Categoria *"
                            valor={categoria_id}
                            placeholder="Selecione uma categoria..."
                            opcoes={opcCategorias}
                            onSelect={setCategoriaId}
                            icone="grid-outline"
                        />
                        <PickerField
                            label="Unidade de medida"
                            valor={unidade_id}
                            placeholder="Selecione uma unidade..."
                            opcoes={opcUnidades}
                            onSelect={setUnidadeId}
                            icone="cube-outline"
                        />

                        <SectionLabel titulo="Fornecedor" icone="car-outline" />
                        <PickerField
                            label="Fornecedor padrao"
                            valor={fornecedor_id}
                            placeholder="Selecione um fornecedor..."
                            opcoes={opcFornecedores}
                            onSelect={setFornecedorId}
                            icone="people-outline"
                        />

                        <PrimaryButton
                            title={editando ? "Salvar e continuar" : "Salvar e adicionar variacoes"}
                            icone="arrow-forward-outline"
                            onPress={avancarEtapa1}
                            loading={salvando}
                            style={{ marginTop: 28 }}
                        />
                    </ScrollView>
                )}

                {/* ════════ ETAPA 2 — VARIACOES ════════ */}
                {etapa === 2 && (
                    <ScrollView
                        style={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Preview do produto */}
                        <View style={styles.prodPreview}>
                            <Ionicons name="shirt-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.prodPreviewNome}>{nome}</Text>
                                {codigo ? <Text style={styles.prodPreviewCod}>Cod: {codigo}</Text> : null}
                            </View>
                            <Pressable onPress={() => setEtapa(1)}>
                                <Text style={styles.prodPreviewEditar}>Editar</Text>
                            </Pressable>
                        </View>

                        {/* Adicionar nova variacao */}
                        <SectionLabel titulo="Adicionar variacao" icone="color-palette-outline" />
                        <View style={styles.addVarCard}>
                            <PickerField
                                label="Cor"
                                valor={corSel}
                                placeholder="Selecione a cor..."
                                opcoes={opcCores}
                                onSelect={setCorSel}
                            />
                            <PickerField
                                label="Tamanho"
                                valor={tamanhoSel}
                                placeholder="Selecione o tamanho..."
                                opcoes={opcTamanhos}
                                onSelect={setTamanhoSel}
                            />
                            <View style={styles.precosRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <FormField
                                        label="Custo (R$)"
                                        value={precoCustoNovo}
                                        onChangeText={setPrecoCustoNovo}
                                        placeholder="0,00"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <FormField
                                        label="Venda (R$)"
                                        value={precoVendaNovo}
                                        onChangeText={setPrecoVendaNovo}
                                        placeholder="0,00"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                            <Pressable style={styles.btnAddVar} onPress={adicionarVariacao}>
                                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnAddVarText}>Adicionar variacao</Text>
                            </Pressable>
                        </View>

                        {/* Lista de variacoes */}
                        {variacoes.length > 0 && (
                            <>
                                <SectionLabel
                                    titulo={"Variacoes (" + variacoes.length + ")"}
                                    icone="layers-outline"
                                />
                                {variacoes.map((v, i) => (
                                    <LinhaVariacao
                                        key={i}
                                        index={i}
                                        variacao={v}
                                        cores={cores}
                                        tamanhos={tamanhos}
                                        onRemover={removerVariacao}
                                        onAlterarSku={alterarSku}
                                        onAlterarPreco={alterarPreco}
                                    />
                                ))}
                            </>
                        )}

                        {variacoes.length === 0 && (
                            <View style={styles.semVar}>
                                <Ionicons name="alert-circle-outline" size={36} color={theme.colors.border} />
                                <Text style={styles.semVarText}>Nenhuma variacao adicionada ainda</Text>
                                <Text style={styles.semVarSub}>Selecione cor e tamanho acima</Text>
                            </View>
                        )}

                        <PrimaryButton
                            title={editando ? "Salvar alteracoes" : "Finalizar cadastro"}
                            icone="checkmark-circle-outline"
                            onPress={salvarVariacoes}
                            loading={salvando}
                            style={{ marginTop: 24 }}
                        />

                        {!editando && (
                            <Pressable
                                style={styles.btnPular}
                                onPress={() => Alert.alert(
                                    "Pular variacoes?",
                                    "O produto sera salvo sem variacoes. Voce pode adicionar depois.",
                                    [
                                        { text: "Cancelar", style: "cancel" },
                                        { text: "Pular", onPress: () => navigation.goBack() },
                                    ]
                                )}
                            >
                                <Text style={styles.btnPularText}>Pular por agora</Text>
                            </Pressable>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.colors.background },
    scroll:      { flex: 1, paddingHorizontal: 16 },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { fontFamily: "Poppins_400Regular", color: theme.colors.muted, fontSize: 14 },

    prodPreview: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: 14,
        marginTop: 16,
        marginBottom: 4,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        ...theme.shadow,
    },
    prodPreviewNome: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: theme.colors.text },
    prodPreviewCod:  { fontFamily: "Poppins_400Regular", fontSize: 12, color: theme.colors.muted, marginTop: 2 },
    prodPreviewEditar: { fontFamily: "Poppins_500Medium", fontSize: 13, color: theme.colors.primary },

    addVarCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 14,
        marginBottom: 4,
        ...theme.shadow,
    },
    precosRow: { flexDirection: "row" },
    btnAddVar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingVertical: 12,
        marginTop: 4,
    },
    btnAddVarText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },

    semVar: { alignItems: "center", paddingVertical: 32, gap: 6 },
    semVarText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: theme.colors.muted },
    semVarSub:  { fontFamily: "Poppins_400Regular", fontSize: 12, color: theme.colors.muted },

    btnPular: { alignItems: "center", paddingVertical: 14 },
    btnPularText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: theme.colors.muted,
        textDecorationLine: "underline",
    },
});