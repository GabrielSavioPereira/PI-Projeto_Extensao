import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Ionicons } from "@expo/vector-icons";
import { entradaEstoque, saidaEstoque, ajusteEstoque } from "../services/MovEstoqueService";
import { buscaVariacoes } from "../services/ProdutoVariacaoService";
import { buscaProdutos } from "../services/ProdutoService";
import { theme } from "../components/ui";
import RNPickerSelect from "react-native-picker-select";

export default function NovaMovimentacaoModal({ visible, onClose, variacao_id = null, tipo = "ENTRADA" }) {
    const [tipoMov, setTipoMov] = useState(tipo);
    const [quantidade, setQuantidade] = useState("");
    const [motivo, setMotivo] = useState("");
    const [variacaoSelecionada, setVariacaoSelecionada] = useState(variacao_id);
    const [variacoes, setVariacoes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [buscaTexto, setBuscaTexto] = useState("");
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [scannerVisible, setScannerVisible] = useState(false);

    useEffect(() => {
        carregarListas();
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasCameraPermission(status === "granted");
        })();
    }, []);

    const carregarListas = async () => {
        const [varRes, prodRes] = await Promise.all([buscaVariacoes(), buscaProdutos()]);
        if (varRes.success) setVariacoes(varRes.variacoes);
        if (prodRes.success) setProdutos(prodRes.produtos);
    };

    const handleBarCodeScanned = ({ data }) => {
        setScannerVisible(false);
        // data é o código de barras (pode ser o SKU ou código da variação)
        const encontrada = variacoes.find(v => v.sku === data || v.codigo === data);
        if (encontrada) {
            setVariacaoSelecionada(encontrada.id);
            setBuscaTexto("");
            setResultadosBusca([]);
            Alert.alert("Sucesso", `Variação encontrada: ${encontrada.codigo}`);
        } else {
            Alert.alert("Não encontrado", "Nenhuma variação com esse código de barras");
        }
    };

    const buscarVariacaoPorTexto = (texto) => {
        setBuscaTexto(texto);
        if (texto.length < 2) {
            setResultadosBusca([]);
            return;
        }
        const filtradas = variacoes.filter(v =>
            v.codigo?.toLowerCase().includes(texto.toLowerCase()) ||
            v.sku?.toLowerCase().includes(texto.toLowerCase())
        );
        const comProduto = filtradas.map(v => {
            const p = produtos.find(prod => prod.id === v.produto_id);
            return { ...v, produtoNome: p?.nome };
        });
        setResultadosBusca(comProduto);
    };

    const salvar = async () => {
        if (!variacaoSelecionada) {
            Alert.alert("Erro", "Selecione uma variação");
            return;
        }
        const qtd = parseInt(quantidade);
        if (isNaN(qtd) || qtd <= 0) {
            Alert.alert("Erro", "Quantidade inválida");
            return;
        }
        if (!motivo.trim()) {
            Alert.alert("Erro", "Informe o motivo");
            return;
        }
        setLoading(true);
        let result;
        if (tipoMov === "ENTRADA") {
            result = await entradaEstoque(variacaoSelecionada, qtd, motivo);
        } else if (tipoMov === "SAIDA") {
            result = await saidaEstoque(variacaoSelecionada, qtd, motivo);
        } else {
            result = await ajusteEstoque(variacaoSelecionada, qtd, motivo);
        }
        setLoading(false);
        if (result.success) {
            Alert.alert("Sucesso", result.message);
            onClose(true);
        } else {
            Alert.alert("Erro", result.message);
        }
    };

    const variacaoObj = variacoes.find(v => v.id === variacaoSelecionada);
    const produtoObj = variacaoObj ? produtos.find(p => p.id === variacaoObj.produto_id) : null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Nova Movimentação</Text>
                    <TouchableOpacity onPress={() => onClose()}><Ionicons name="close" size={28} /></TouchableOpacity>
                </View>

                <View style={styles.tipoContainer}>
                    {["ENTRADA", "SAIDA", "AJUSTE"].map(t => (
                        <TouchableOpacity key={t} onPress={() => setTipoMov(t)} style={[styles.tipoBtn, tipoMov === t && styles.tipoAtivo]}>
                            <Text style={tipoMov === t ? { color: theme.colors.primary } : {}}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Variação</Text>
                {!variacao_id && (
                    <>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <TextInput
                                style={styles.input}
                                placeholder="Buscar por código ou SKU"
                                value={buscaTexto}
                                onChangeText={buscarVariacaoPorTexto}
                            />
                            {hasCameraPermission && (
                                <TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.cameraBtn}>
                                    <Ionicons name="camera" size={24} color={theme.colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {resultadosBusca.length > 0 && (
                            <View style={styles.resultadosLista}>
                                {resultadosBusca.map(v => (
                                    <TouchableOpacity key={v.id} onPress={() => { setVariacaoSelecionada(v.id); setBuscaTexto(""); setResultadosBusca([]); }} style={styles.resultadoItem}>
                                        <Text>{v.produtoNome} - {v.codigo} (SKU: {v.sku})</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}
                {variacaoSelecionada && !variacao_id && (
                    <View style={styles.selecionado}>
                        <Text>Selecionado: {variacaoObj?.codigo} - {produtoObj?.nome}</Text>
                        <TouchableOpacity onPress={() => setVariacaoSelecionada(null)}><Ionicons name="close-circle" size={20} /></TouchableOpacity>
                    </View>
                )}
                {variacao_id && <Text style={styles.info}>Variação pré-selecionada</Text>}

                <Text style={styles.label}>Quantidade</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={quantidade} onChangeText={setQuantidade} />

                <Text style={styles.label}>Motivo</Text>
                <TextInput style={styles.input} value={motivo} onChangeText={setMotivo} placeholder="Ex: Compra, Venda, Ajuste..." />

                <PrimaryButton title={loading ? "Processando..." : "Registrar"} onPress={salvar} loading={loading} style={{ marginTop: 20 }} />
            </View>

            {scannerVisible && (
                <Modal visible={scannerVisible} animationType="slide">
                    <View style={{ flex: 1 }}>
                        <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ flex: 1 }} />
                        <TouchableOpacity onPress={() => setScannerVisible(false)} style={{ position: "absolute", top: 40, right: 20, backgroundColor: "white", padding: 10, borderRadius: 20 }}>
                            <Ionicons name="close" size={28} />
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { fontSize: 20, fontFamily: theme.fonts.semiBold },
    tipoContainer: { flexDirection: "row", gap: 12, marginBottom: 20 },
    tipoBtn: { padding: 10, borderRadius: 8, backgroundColor: "#eee", flex: 1, alignItems: "center" },
    tipoAtivo: { backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary },
    label: { fontSize: 14, marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 8 },
    cameraBtn: { padding: 10, backgroundColor: "#eee", borderRadius: 8 },
    resultadosLista: { maxHeight: 150, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 8 },
    resultadoItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
    selecionado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.colors.primaryLight, padding: 8, borderRadius: 8, marginBottom: 8 },
    info: { backgroundColor: "#eee", padding: 8, borderRadius: 8, marginBottom: 8, textAlign: "center" }
});