import React, { useState, useEffect } from "react";
import { ScrollView, Alert, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import {
    Header,
    FormField,
    PrimaryButton,
    SectionLabel,
    theme
} from "../components/ui";
import { addProduto, alteraProduto } from "../services/ProdutoService";
import { buscaMarcas } from "../services/MarcaService";
import { buscaCategs } from "../services/CategoriaService";
import { buscaUmeds } from "../services/UnmedidaService";
import { Ionicons } from "@expo/vector-icons";

export default function ProdutoFormScreen({ route, navigation }) {
    const produto = route.params?.produto;
    const editando = !!produto;

    const [nome, setNome] = useState(produto?.nome || "");
    const [codigo, setCodigo] = useState(produto?.codigo || "");
    const [categorias, setCategorias] = useState([]);
    const [categoria, setCategoria] = useState(produto?.categoria_id || null);
    const [marcas, setMarcas] = useState([]);
    const [marca, setMarca] = useState(produto?.marca_id || null);
    const [unidades, setUnidades] = useState([]);
    const [unidade, setUnidade] = useState(produto?.unidade_id || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        carregarAuxiliares();
    }, []);

    async function carregarAuxiliares() {
        const [marcasRes, catsRes, unidsRes] = await Promise.all([
            buscaMarcas(),
            buscaCategs(),
            buscaUmeds()
        ]);
        if (marcasRes.success) setMarcas(marcasRes.marcas);
        if (catsRes.success) setCategorias(catsRes.categs);
        if (unidsRes.success) setUnidades(unidsRes.umeds);
    }

    async function salvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "Informe o nome do produto");
            return;
        }
        if (!marca || !categoria) {
            Alert.alert("Erro", "Selecione marca e categoria");
            return;
        }

        console.log("Marca: ", marca, " Unidade: ", unidade, " Categoria: ", categoria)

        const objProduto = {
            nome: nome.trim(),
            codigo: codigo.trim(),
            preco_custo: parseFloat(preco_custo) || 0,
            preco_venda: parseFloat(preco_venda) || 0,
            categoria_id: categoria,
            unidade_id: unidade,
            marca_id: marca
        };

        setLoading(true);
        let response;
        if (editando) {
            response = await alteraProduto(produto.documentoId, objProduto);
        } else {
            response = await addProduto(objProduto);
        }
        setLoading(false);

        if (response.success) {
            Alert.alert(
                "Sucesso",
                editando ? "Produto alterado!" : "Produto criado!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert("Erro", response.message);
        }
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Header
                    title={editando ? "Editar Produto" : "Novo Produto"}
                    onBack={() => navigation.goBack()}
                />
                <ScrollView style={{ flex: 1, padding: 16 }}>
                    {/* Botão para adicionar variação (só aparece se já tiver produto salvo) */}
                    {editando && (
                        <TouchableOpacity
                            style={styles.addVariacaoButton}
                            onPress={() => navigation.navigate("ProdutoVariacao", { produtoFixo: produto })}
                        >
                            <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.addVariacaoText}>Adicionar variação a este produto</Text>
                        </TouchableOpacity>
                    )}

                    <FormField label="Nome" value={nome} onChangeText={setNome} />
                    <FormField label="Código" value={codigo} onChangeText={setCodigo} />

                    <SectionLabel titulo="Categoria" icone="grid-outline" />
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={categoria}
                            onValueChange={setCategoria}
                            style={styles.picker}
                        >
                            <Picker.Item label="Selecione uma categoria..." value={null} />
                            {categorias.map(item => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>

                    <SectionLabel titulo="Marca" icone="business-outline" />
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={marca}
                            onValueChange={setMarca}
                            style={styles.picker}
                        >
                            <Picker.Item label="Selecione uma marca..." value={null} />
                            {marcas.map(item => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>

                    <SectionLabel titulo="Unidade de Medida" icone="cube-outline" />
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={unidade}
                            onValueChange={setUnidade}
                            style={styles.picker}
                        >
                            <Picker.Item label="Selecione uma unidade..." value={null} />
                            {unidades.map(item => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>

                    <PrimaryButton
                        title="Salvar"
                        onPress={salvar}
                        loading={loading}
                        style={{ marginTop: 24 }}
                    />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = {
    addVariacaoButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.radius.md,
        paddingVertical: 12,
        marginBottom: 20,
        gap: 8,
    },
    addVariacaoText: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 14,
        color: theme.colors.primary,
    },
    pickerContainer: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        marginBottom: 12,
        ...theme.shadow,
    },
    picker: {
        height: 50,
    },
};