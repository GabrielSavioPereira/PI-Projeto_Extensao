import {

    View,
    Text,
    StyleSheet,
    TextInput,
    Button

} from "react-native";

import {use, useEffect, useState} from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker"
import { addProduto, alteraProduto } from "../services/produtoService";

export default function ProdutoDetalheScreen({
    route
}) {

    const produto = route.params?.produto;

    const [nome, setNome] = useState();
    const [codigo, setCodigo] = useState();
    const [preco_custo, setPrecoCusto] = useState();
    const [preco_venda, setPrecoVenda] = useState();
    const [categorias, setCategorias]  = useState([])
    const [categoria, setCategoria]    = useState();
    const [marcas, setMarcas]  = useState([]);
    const [marca, setMarca]    = useState();
    const [unidades, setUnidades] = useState([]);
    const [unidade, setUnidade] = useState();

    async function listaCategorias() {
        setCategorias([
            {id: 1, nome: "Vestidos"},
            {id: 0, nome: "Exemplo"}
        ])
    }

    async function listaMarcas() {
        setMarcas([
            {id: 1, nome: "Damyler"},
            {id: 0, nome: "Marca Exemplo"}
        ])
    }

    async function listaUnidades() {
        setUnidades([
            {id: 1, nome: "UN"},
            {id: 0, nome: "Unidade Exemplo"}
        ])
    }

    async function  salvar() {
        const objProduto = {
            "nome": nome,
            "codigo": codigo,
            "preco_custo": parseFloat(preco_custo),
            "preco_venda": parseFloat(preco_venda),
            "categoria_id": categoria,
            "unidade_id": unidade,
            "marca_id": marca
        }

        if (produto) {
            const response = await alteraProduto(produto.documentoId, objProduto);
            
            if (response.success) {
                alert("Produto Alterado com sucesso")
            } else {
                alert(response.message)
            }
        } else {
            const response = await addProduto(objProduto);

            if (response.success) {
                alert("Produto adicionado com sucesso!")
            } else {
                alert(response.message)
            }
        }

    }

    useEffect(() => {
        
        if (produto){
            setNome(produto.nome)
            setCodigo(produto.codigo)
            setPrecoCusto(produto.preco_custo.toString())
            setPrecoVenda(produto.preco_venda.toString())
            setCategoria(produto.categoria_id)
            setMarca(produto.marca_id)
            setUnidade(produto.unidade_id)
        }
        
        listaMarcas()
        listaUnidades()
        listaCategorias()
    }, [])

    return (

        <SafeAreaProvider>
         <SafeAreaView style={styles.container}>
            <TextInput
                style={styles.input}
                onChangeText={setNome}
                value={nome}
                placeholder="nome"
                />

            <TextInput
                style={styles.input}
                onChangeText={setCodigo}
                value={codigo}
                placeholder="Código de barras"
                />
            
            <TextInput
                style={styles.input}
                onChangeText={setPrecoCusto}
                value={preco_custo}
                placeholder="Preço de Custo"
                keyboardType="numeric"
                />

            <TextInput
                style={styles.input}
                onChangeText={setPrecoVenda}
                value={preco_venda}
                placeholder="Preço de Venda"
                keyboardType="numeric"
                />

            <Picker
                selectedValue={categoria}
                onValueChange={(value) => setCategoria(value)}
            >
                <Picker.Item label="Selecione uma categoria..." value="" />
                {
                    categorias.map((item) => (
                        <Picker.Item 
                            key={item.id}
                            label={item.nome}
                            value={item.id}
                        />   
                    ))
                }
            </Picker>

            <Picker
                selectedValue={marca}
                onValueChange={(value) => setMarca(value)}
            >
                <Picker.Item label="Selecione uma marca..." value="" />
                {
                    marcas.map((item) => (
                        <Picker.Item 
                            key={item.id}
                            label={item.nome}
                            value={item.id}
                        />   
                    ))
                }
            </Picker>

            <Picker
                selectedValue={unidade}
                onValueChange={(value) => setUnidade(value)}
            >
                <Picker.Item label="Selecione uma unidade de medida..." value="" />
                {
                    unidades.map((item) => (
                        <Picker.Item 
                            key={item.id}
                            label={item.nome}
                            value={item.id}
                        />   
                    ))
                }
            </Picker>

            <Button
                title="salvar"
                onPress={salvar}
            />
         </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20
    },

    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 5
    }
});