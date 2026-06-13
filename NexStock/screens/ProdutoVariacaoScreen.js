import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Alert,
    StyleSheet,
    View,
    Text,
    TouchableOpacity
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { addVariacao, alteraVariacao } from "../services/ProdutoVariacaoService";
import { inicializaSaldo } from "../services/SaldoVariacaoService";
import { buscaProdutos } from "../services/ProdutoService";
import { buscaCores } from "../services/CorService";
import { buscaTams } from "../services/TamanhoService";

import {
    Header,
    SectionLabel,
    FormField,
    PrimaryButton,
    theme,
} from "../components/ui";

// Picker customizado (sem dependência externa)
function PickerField({ label, valor, placeholder, opcoes, onSelect, desabilitado = false }) {
    const [aberto, setAberto] = useState(false);
    const selecionado = opcoes.find((o) => o.value === valor);

    if (desabilitado) {
        return (
            <View style={pickerStyles.container}>
                <Text style={pickerStyles.label}>{label}</Text>
                <View style={[pickerStyles.input, pickerStyles.desabilitado]}>
                    <Text style={pickerStyles.valorText}>
                        {selecionado ? selecionado.label : placeholder}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={pickerStyles.container}>
            <Text style={pickerStyles.label}>{label}</Text>
            <View>
                <TouchableOpacity
                    style={pickerStyles.input}
                    onPress={() => setAberto(!aberto)}
                    activeOpacity={0.7}
                >
                    <Text style={[pickerStyles.valorText, !selecionado && { color: theme.colors.muted }]}>
                        {selecionado ? selecionado.label : placeholder}
                    </Text>
                    <Text style={{ color: theme.colors.muted }}>▾</Text>
                </TouchableOpacity>

                {aberto && (
                    <View style={pickerStyles.dropdown}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                            {opcoes.map((op) => (
                                <TouchableOpacity
                                    key={op.value}
                                    style={[
                                        pickerStyles.opcao,
                                        op.value === valor && pickerStyles.opcaoSelecionada,
                                    ]}
                                    onPress={() => {
                                        onSelect(op.value);
                                        setAberto(false);
                                    }}
                                    activeOpacity={0.6}
                                >
                                    {op.hex ? (
                                        <View style={[pickerStyles.bolinha, { backgroundColor: op.hex }]} />
                                    ) : null}
                                    <Text style={[
                                        pickerStyles.opcaoText,
                                        op.value === valor && { color: theme.colors.primary, fontFamily: "Poppins_600SemiBold" },
                                    ]}>
                                        {op.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const pickerStyles = StyleSheet.create({
    container: { marginBottom: 12 },
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
        justifyContent: "space-between",
        alignItems: "center",
        ...theme.shadow,
    },
    desabilitado: {
        backgroundColor: theme.colors.primaryLight,
        opacity: 0.7,
    },
    valorText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 15,
        color: theme.colors.text,
    },
    dropdown: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        zIndex: 999,
        ...theme.shadow,
    },
    opcao: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    opcaoSelecionada: { backgroundColor: theme.colors.primaryLight },
    opcaoText: {
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

// TELA PRINCIPAL
export default function ProdutoVariacaoScreen({ route, navigation }) {
    const variacao = route.params?.variacao;
    const produtoFixo = route.params?.produtoFixo || route.params?.produtoFixado;
    const editando = !!variacao;

    const [produtos, setProdutos] = useState([]);
    const [cores, setCores] = useState([]);
    const [tamanhos, setTamanhos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [produto_id, setProdutoId] = useState(null);
    const [cor_id, setCorId] = useState(null);
    const [tamanho_id, setTamanhoId] = useState(null);
    const [codigo, setCodigo] = useState("");     // NOVO campo código da variação
    const [sku, setSku] = useState("");
    const [preco_custo, setPrecoCusto] = useState("");
    const [preco_venda, setPrecoVenda] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carrega() {
            const [prodRes, corRes, tamRes] = await Promise.all([
                buscaProdutos(),
                buscaCores(),
                buscaTams(),
            ]);
            if (prodRes.success) setProdutos(prodRes.produtos);
            if (corRes.success) setCores(corRes.cores);
            if (tamRes.success) setTamanhos(tamRes.tams);
            setCarregando(false);
        }
        carrega();
    }, []);

    useEffect(() => {
        if (editando && variacao) {
            setProdutoId(variacao.produto_id ?? null);
            setCorId(variacao.cor_id ?? null);
            setTamanhoId(variacao.tamanho_id ?? null);
            setCodigo(variacao.codigo ?? "");
            setSku(variacao.sku ?? "");
            setPrecoCusto(variacao.preco_custo?.toString() ?? "");
            setPrecoVenda(variacao.preco_venda?.toString() ?? "");
        } else if (produtoFixo && produtoFixo.id) {
            setProdutoId(produtoFixo.id);
        }
    }, [editando, variacao, produtoFixo]);

    const produtoSelecionado = produtos.find((p) => p.id === produto_id);
    const corSelecionada = cores.find((c) => c.id === cor_id);
    const tamanhoSelecionado = tamanhos.find((t) => t.id === tamanho_id);

    // Gera SKU e código automaticamente
    function gerarCodigoESku() {
        if (!produtoSelecionado || !corSelecionada || !tamanhoSelecionado) {
            Alert.alert("Atenção", "Selecione produto, cor e tamanho para gerar.");
            return;
        }
        const codigoProduto = produtoSelecionado.codigo ?? produtoSelecionado.nome.slice(0, 3).toUpperCase();
        const corSig = corSelecionada.nome.slice(0, 3).toUpperCase();
        const tamSig = tamanhoSelecionado.nome.toUpperCase();
        const gerado = `${codigoProduto}-${corSig}-${tamSig}`;
        setSku(gerado);
        setCodigo(gerado);  
    }

    function validar() {
        if (!produto_id) { Alert.alert("Atenção", "Selecione um produto."); return false; }
        if (!cor_id) { Alert.alert("Atenção", "Selecione uma cor."); return false; }
        if (!tamanho_id) { Alert.alert("Atenção", "Selecione um tamanho."); return false; }
        if (!codigo.trim()) { Alert.alert("Atenção", "Informe o código da variação."); return false; }
        if (!sku.trim()) { Alert.alert("Atenção", "Informe o SKU da variação."); return false; }
        if (!preco_venda) { Alert.alert("Atenção", "Informe o preço de venda."); return false; }
        return true;
    }

    async function salvar() {
        if (!validar()) return;
        setSalvando(true);

        const obj = {
            produto_id,
            cor_id,
            tamanho_id,
            codigo: codigo.trim(),
            sku: sku.trim(),
            preco_custo: parseFloat(preco_custo) || 0,
            preco_venda: parseFloat(preco_venda)
        };

        let response;
        if (editando) {
            response = await alteraVariacao(variacao.documentoId, obj);
        } else {
            response = await addVariacao(obj);
            if (response.success && response.id) {
                await inicializaSaldo(response.id);
            }
        }

        setSalvando(false);

        if (response.success) {
            Alert.alert(
                "Sucesso",
                editando ? "Variação atualizada!" : "Variação cadastrada!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert("Erro", response.message ?? "Ocorreu um erro.");
        }
    }

    const opcoesProdutos = produtos
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((p) => ({ value: p.id, label: `${p.nome} ${p.codigo ? `(${p.codigo})` : ""}` }));

    const opcoesCores = cores
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((c) => ({ value: c.id, label: c.nome, hex: c.hex }));

    const opcoesTamanhos = tamanhos
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((t) => ({ value: t.id, label: t.nome }));

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <Header
                    title={editando ? "Editar Variação" : "Nova Variação"}
                    onBack={() => navigation.goBack()}
                />

                {carregando ? (
                    <View style={styles.loadingWrap}>
                        <Text style={styles.loadingText}>Carregando dados...</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Preview */}
                        {(produtoSelecionado || corSelecionada || tamanhoSelecionado) && (
                            <View style={styles.previewCard}>
                                <Text style={styles.previewTitulo}>{produtoSelecionado?.nome ?? "Produto"}</Text>
                                <View style={styles.previewTags}>
                                    {corSelecionada && (
                                        <View style={styles.previewTag}>
                                            {corSelecionada.hex && <View style={[styles.previewBolinha, { backgroundColor: corSelecionada.hex }]} />}
                                            <Text style={styles.previewTagText}>{corSelecionada.nome}</Text>
                                        </View>
                                    )}
                                    {tamanhoSelecionado && (
                                        <View style={styles.previewTag}>
                                            <Text style={styles.previewTagText}>{tamanhoSelecionado.nome}</Text>
                                        </View>
                                    )}
                                    {codigo ? (
                                        <View style={[styles.previewTag, { backgroundColor: theme.colors.primaryLight }]}>
                                            <Text style={[styles.previewTagText, { color: theme.colors.primary }]}>
                                                Código: {codigo}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {sku ? (
                                        <View style={[styles.previewTag, { backgroundColor: theme.colors.primaryLight }]}>
                                            <Text style={[styles.previewTagText, { color: theme.colors.primary }]}>
                                                SKU: {sku}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                {preco_venda ? (
                                    <Text style={styles.previewPreco}>R$ {parseFloat(preco_venda).toFixed(2).replace(".", ",")}</Text>
                                ) : null}
                            </View>
                        )}

                        <SectionLabel titulo="Produto" icone="shirt-outline" />
                        {produtoFixo ? (
                            <View style={styles.produtoFixado}>
                                <Text style={styles.produtoFixadoLabel}>Produto</Text>
                                <Text style={styles.produtoFixadoValor}>{produtoFixo.nome}</Text>
                            </View>
                        ) : (
                            <PickerField
                                label="Produto *"
                                valor={produto_id}
                                placeholder="Selecione um produto..."
                                opcoes={opcoesProdutos}
                                onSelect={setProdutoId}
                            />
                        )}

                        <SectionLabel titulo="Variação" icone="color-palette-outline" />
                        <PickerField label="Cor *" valor={cor_id} placeholder="Selecione uma cor..." opcoes={opcoesCores} onSelect={setCorId} />
                        <PickerField label="Tamanho *" valor={tamanho_id} placeholder="Selecione um tamanho..." opcoes={opcoesTamanhos} onSelect={setTamanhoId} />

                        <SectionLabel titulo="Identificação" icone="barcode-outline" />
                        <FormField label="Código da variação *" value={codigo} onChangeText={setCodigo} placeholder="Código único (ex: CAM001)" autoCapitalize="characters" />
                        <FormField label="SKU *" value={sku} onChangeText={setSku} placeholder="Código de barras / SKU" autoCapitalize="characters" />

                        <TouchableOpacity style={styles.btnGerar} onPress={gerarCodigoESku}>
                            <Text style={styles.btnGerarText}>Gerar código e SKU automaticamente</Text>
                        </TouchableOpacity>

                        <FormField label="Preço de Custo" value={preco_custo} onChangeText={setPrecoCusto} keyboardType="numeric" />
                        <FormField label="Preço de Venda *" value={preco_venda} onChangeText={setPrecoVenda} keyboardType="numeric" />

                        {!produtoFixo && produtoSelecionado && (
                            <>
                                <SectionLabel titulo="Informações do Produto" icone="information-circle-outline" />
                                <View style={styles.infoCard}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Código do produto</Text>
                                        <Text style={styles.infoValor}>{produtoSelecionado.codigo ?? "-"}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Preço de custo</Text>
                                        <Text style={styles.infoValor}>R$ {produtoSelecionado.preco_custo?.toFixed(2) ?? "-"}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Preço de venda</Text>
                                        <Text style={[styles.infoValor, { color: theme.colors.primary }]}>R$ {produtoSelecionado.preco_venda?.toFixed(2) ?? "-"}</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        <PrimaryButton
                            title={editando ? "Salvar alterações" : "Cadastrar variação"}
                            onPress={salvar}
                            loading={salvando}
                            style={{ marginTop: 28 }}
                        />
                    </ScrollView>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1, paddingHorizontal: 16 },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { fontFamily: "Poppins_400Regular", color: theme.colors.muted, fontSize: 14 },

    previewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 16,
        marginVertical: 16,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        ...theme.shadow,
    },
    previewTitulo: { fontFamily: "Poppins_600SemiBold", fontSize: 16, marginBottom: 8 },
    previewTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
    previewTag: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.border, borderRadius: theme.radius.full, paddingHorizontal: 10, paddingVertical: 4 },
    previewBolinha: { width: 12, height: 12, borderRadius: 6, marginRight: 6, borderWidth: 1 },
    previewTagText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
    previewPreco: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: theme.colors.primary },

    produtoFixado: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 14, marginBottom: 12, ...theme.shadow },
    produtoFixadoLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: theme.colors.muted },
    produtoFixadoValor: { fontFamily: "Poppins_500Medium", fontSize: 15, marginTop: 2 },

    btnGerar: { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 10, alignItems: "center", marginBottom: 16 },
    btnGerarText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: theme.colors.primary },

    infoCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 14, marginTop: 8, ...theme.shadow },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: theme.colors.muted },
    infoValor: { fontFamily: "Poppins_500Medium", fontSize: 13 },
});