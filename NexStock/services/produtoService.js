import { db } from "../dbconfig/config";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    query,
    setDoc,
    orderBy,
    limit,
    where,
    onSnapshot,
} from "firebase/firestore";

import { COLLECTIONS } from "../database/collections";

const produtoRef = collection(db, COLLECTIONS.PRODUTOS);

export function escutaProdutos(callback) {
    return onSnapshot(produtoRef, (snapshot) => {
        const lista = [];
        snapshot.forEach((d) => {
            lista.push({ documentoId: d.id, ...d.data() });
        });
        callback(lista);
    });
}

export async function addProduto(produto) {
    try {
        const q = query(produtoRef, orderBy("id", "desc"), limit(1));
        const produtos = await getDocs(q);

        let proximoId = 1;
        if (!produtos.empty) {
            proximoId = produtos.docs[0].data().id + 1;
        }

        const novoProduto = `produto${proximoId}`;

        await setDoc(doc(produtoRef, novoProduto), {
            id: proximoId,
            ...produto,
        });

        return {
            success: true,
            id: novoProduto,
            proximoId,           // ← retorna o id numerico para usar na etapa 2
            message: "Produto criado com sucesso!",
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao criar o produto.",
            error: e,
        };
    }
}

export async function buscaProdutoId(id) {
    try {
        const q = query(produtoRef, where("id", "==", id));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return { documentoId: d.id, ...d.data() };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar o produto " + id.toString(),
            error: e,
        };
    }
}

export async function buscaProdutos() {
    try {
        const snapshot = await getDocs(produtoRef);
        const produtos = snapshot.docs.map((d) => ({ documentoId: d.id, ...d.data() }));
        return { success: true, produtos: produtos || [] };
    } catch (e) {
        return { success: false, message: "Erro ao buscar os produtos.", error: e, produtos: [] };
    }
}

// Busca produtos de um fornecedor especifico — usado na tela de compra
export async function buscaProdutosPorFornecedor(fornecedor_id) {
    try {
        const q = query(produtoRef, where("fornecedor_id", "==", fornecedor_id));
        const snapshot = await getDocs(q);
        const produtos = snapshot.docs.map((d) => ({ documentoId: d.id, ...d.data() }));
        return { success: true, produtos };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar produtos do fornecedor.",
            error: e,
        };
    }
}

export async function deletaProduto(id) {
    try {
        await deleteDoc(doc(produtoRef, id));
        return { success: true };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao deletar o produto: " + id.toString(),
            error: e,
        };
    }
}

export async function alteraProduto(id, data) {
    try {
        const docRef  = doc(produtoRef, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, message: "Produto nao encontrado." };
        }

        const anterior = docSnap.data();
        const alterado = {};

        // So atualiza campos que mudaram
        const campos = [
            "nome", "codigo", "marca_id", "categoria_id",
            "unidade_id", "fornecedor_id",
        ];
        campos.forEach((campo) => {
            if (data[campo] !== undefined && data[campo] !== anterior[campo]) {
                alterado[campo] = data[campo];
            }
        });

        if (data.preco_custo !== undefined && parseFloat(data.preco_custo) !== anterior.preco_custo) {
            alterado.preco_custo = parseFloat(data.preco_custo) || 0;
        }
        if (data.preco_venda !== undefined && parseFloat(data.preco_venda) !== anterior.preco_venda) {
            alterado.preco_venda = parseFloat(data.preco_venda) || 0;
        }

        if (Object.keys(alterado).length > 0) {
            await updateDoc(docRef, alterado);
        }

        return { success: true };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao alterar o produto: " + id.toString(),
            error: e,
        };
    }
}