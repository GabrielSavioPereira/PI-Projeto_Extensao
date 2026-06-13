import {db} from "../dbconfig/config"
import {
  collection,
  addDoc,
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
  documentId
} from "firebase/firestore";

import {COLLECTIONS} from "../database/collections"

const variacaoRef = collection(db, COLLECTIONS.PROD_VARIACOES);

export function escutaProdVariacao(callback) {
    return onSnapshot(
        variacaoRef,
        (snapshot) => {
            const lista = []
            snapshot.forEach((doc) => {
                lista.push({
                    documentoId: doc.id,
                    ...doc.data()
                });
            });
            callback(lista);
        }
    )
}

export async function addVariacao(variacao) {
    try {

        const queryValid = query(variacaoRef, 
                                where("produto_id", "==", variacao.produto_id),
                                where("cor_id","==",variacao.cor_id),
                                where("tamanho_id","==",variacao.tamanho_id));
        const snapshotValid = await getDocs(queryValid);

        if (!snapshotValid.empty) {

            return {
                success: false,
                message: "Já existe variação com estas caracteristicas",
            }
        }

        const q = query(variacaoRef, orderBy("id", "desc"), limit(1))
        const variacoes = await getDocs(q)
        let proximoId = 1;
        if (!variacoes.empty) {
            const ultimoVariacao = variacoes.docs[0].data();
            proximoId = ultimoVariacao.id + 1;
        }
        const novaVariacao = `Variacao${proximoId}`;
        await setDoc(doc(variacaoRef, novaVariacao), { id: proximoId, ...variacao })
        return {
            success: true,
            id: novaVariacao,
            message: "Variacao Criada com Sucesso!"
        }
    } catch(e){
        return {
            success: false,
            message: "Erro ao criar a Variacao",
            error: e
        }
    }
}

export async function buscaVariacaoId(id){
   try {
        const q = query(variacaoRef, where("id", "==", id));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null
        const variacao = snapshot.docs[0];
        return { success: true, ...variacao.data() };
    } catch (error){
        return {
            success: false,
            message: "Erro ao buscar a variacao " + id.toString(),
            error: e 
        }
    }
}

export async function buscaVariacoes(){
    try {
        const snapshot = await getDocs(variacaoRef);
        const variacoes = snapshot.docs.map(doc => ({ documentoId: doc.id, ...doc.data() }))
        return { success: true, variacoes }
    } catch(e) {
        return { success: false, message: "Erro ao buscar os variacoes", error: e }
    }
}

export async function buscaVariacoesPorProduto(produtoId) {
    try {
        const q = query(variacaoRef, where("produto_id", "==", produtoId));
        const snapshot = await getDocs(q);
        const variacoes = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }));
        return { success: true, variacoes };
    } catch (error) {
        console.error("Erro buscaVariacoesPorProduto:", error);
        return { success: false, message: "Erro ao buscar variações do produto", error };
    }
}

export async function deletaVariacao(id){
    try {
        await deleteDoc(doc(variacaoRef, id));
        return { success: true }
    } catch(e) {
        console.log(e)
        return { success: false, message: "Erro ao deletar a variacao: " + id.toString(), error: e }
    }
}

export async function alteraVariacao(id, data){
    try {
        let docRef = doc(variacaoRef, id)
        await updateDoc(docRef, data);
        return { success: true }
    } catch(e) {
        return { success: false, message: "Erro ao alterar a variação : " + id.toString(), error: e }
    }
}

// Busca variação pelo código (campo 'codigo')
export async function buscaVariacaoPorCodigo(codigo) {
    try {
        const q = query(variacaoRef, where("codigo", "==", codigo));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { documentoId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        return null;
    }
}

// Busca variação pelo SKU
export async function buscaVariacaoPorSku(sku) {
    try {
        const q = query(variacaoRef, where("sku", "==", sku));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { documentoId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        return null;
    }
}

// Busca variação por texto (código ou SKU) - útil para busca em tempo real
export async function buscaVariacaoPorTexto(texto) {
    try {
        if (!texto) return null;
        // Tenta buscar pelo campo 'codigo'
        let q = query(variacaoRef, where("codigo", "==", texto));
        let snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { documentoId: doc.id, ...doc.data() };
        }
        // Tenta buscar pelo campo 'sku'
        q = query(variacaoRef, where("sku", "==", texto));
        snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { documentoId: doc.id, ...doc.data() };
        }
        // Se for número, tenta buscar pelo 'id' numérico
        const idNum = parseInt(texto);
        if (!isNaN(idNum)) {
            q = query(variacaoRef, where("id", "==", idNum));
            snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { documentoId: doc.id, ...doc.data() };
            }
        }
        return null;
    } catch (error) {
        console.error("Erro buscaVariacaoPorTexto:", error);
        return null;
    }
}