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
import { buscaVariacaoId } from "./ProdutoVariacaoService";

const movStockRef = collection(db, COLLECTIONS.MOV_ESTOQUE);

export function escutaMovStock(callback) {
    return onSnapshot(
        movStockRef,
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

export async function addMovimentacao(movimentacao) {
    try {
        
        const q = query(
                movStockRef,
                orderBy("id", "desc"),
                limit(1)
        )

        const movimentacoes = await getDocs(q)

        let proximoId = 1;

        if (!movimentacoes.empty) {
            const ultimaMovimentacao = movimentacoes.docs[0].data();

            proximoId = ultimaMovimentacao.id + 1;
        }

        const novaMovimentacao = `movimentacao${proximoId}`;

        await setDoc(
            doc(movStockRef, novaMovimentacao),
            {
                id: proximoId,
              ...movimentacao
            }
        )

        return {
            success: true,
            id: novaMovimentacao,
            message: "Nova movimentação realizada com Sucesso!"
        }

    } catch(e){
        
        return {
            success: false,
            message: "Erro ao criar a nova movimentação",
            error: e
        }
    }
}

export async function buscaMovStock(id, variacao_id){
   
   try {

        const q = query(
            movStockRef,
            where("id", "==", id),
            where("variacao_id","==", variacao_id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const movStock = snapshot.docs[0];

        return {
            ...movStock.data()
        };
    } catch (error){
        return {
            success: false,
            message: "Não foi possivel realizar a busca da movimentação: " + id.toString() + " para o produto " + variacao_id.toString(),
            error: e 
        }
    }

}

export async function deletaMovimentacao(id){
    try {
        let documento = id

        await deleteDoc(doc(
            movStockRef,
            documento
        ));

        return {
            success: true
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao excluir a movimentação: " + id.toString(),
            error: e
        }
    }
}

export async function alteraMovimentacao(id, data){
    try {

        let documento = id;

        let docRef = doc(movStockRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true,
            }

        } else {
            return {
                success: false,
                message: "Movimentação não encontrado"
            }
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao modificar a movimentação: " + id.toString(),
            error: e
        }
    }
}

export async function saidaEstoque(prod_varia_id, qtd, motivo_saida) {
    
    const response = await buscaVariacaoId(prod_varia_id);

    if (response.success) {

        return {
            success: false,
            message: "Variação não foi encontrada" 
        }
    }

    const q = query(
        movStockRef,
        orderBy("id", "desc"),
        limit(1)
    )

    const movimentacoes = await getDocs(q)

    let proximoId = 1;

    if (!movimentacoes.empty) {
        const ultimaMovimentacao = movimentacoes.docs[0].data();

        proximoId = ultimaMovimentacao.id + 1;
    }

    const novaMovimentacao = `movimentacao${proximoId}`;

    const movimentacao = {
        id: proximoId,
        variacao_id: prod_varia_id,
        tipo: "SAIDA",
        quantidade: qtd,
        motivo: motivo_saida,
        data: new Date()
    }
    
    await setDoc(
        doc(movStockRef, novaMovimentacao),
        movimentacao
    )
}