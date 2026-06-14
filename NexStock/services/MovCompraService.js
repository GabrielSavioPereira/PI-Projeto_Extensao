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
    onSnapshot
} from "firebase/firestore";
import { COLLECTIONS } from "../database/collections";
import { entradaEstoque } from "./MovEstoqueService";

const movCompraRef = collection(db, COLLECTIONS.MOV_COMPRA);
const itensCompraRef = collection(db, COLLECTIONS.ITENS_COMPRA);
const contasPagarRef = collection(db, COLLECTIONS.CONTAS_PAGAR);

async function proximoId(ref) {
    const q = query(ref, orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return 1;
    return snap.docs[0].data().id + 1;
}


export function escutaCompras(callback) {
    const q = query(movCompraRef, orderBy("data", "desc"));
    return onSnapshot(q, (snapshot) => {
        const lista = [];
        snapshot.forEach((d) => lista.push({ documentoId: d.id, ...d.data() }));
        callback(lista);
    });
}


export async function buscaCompras() {
    try {
        const q = query(movCompraRef, orderBy("data", "desc"));
        const snap = await getDocs(q);
        const compras = snap.docs.map((d) => ({ documentoId: d.id, ...d.data() }));
        return { success: true, compras };
    } catch (e) {
        return { success: false, message: "Erro ao buscar compras", error: e };
    }
}


export async function buscaItensCompra(movcompra_id) {
    try {
        const q = query(itensCompraRef, where("movcompra_id", "==", movcompra_id));
        const snap = await getDocs(q);
        const itens = snap.docs.map((d) => ({ documentoId: d.id, ...d.data() }));
        return { success: true, itens };
    } catch (e) {
        return { success: false, message: "Erro ao buscar itens", error: e };
    }
}


export async function buscaContasCompra(movcompra_id) {
    try {
        const q = query(contasPagarRef, where("movcompra_id", "==", movcompra_id));
        const snap = await getDocs(q);
        const contas = snap.docs.map((d) => ({ documentoId: d.id, ...d.data() }));
        return { success: true, contas };
    } catch (e) {
        return { success: false, message: "Erro ao buscar contas", error: e };
    }
}


export async function finalizaCompra({ fornecedor_id, condpag, nf, data, obs, desconto, itens }) {
    try {
        // 1. Grava movcompra
        const compraId = await proximoId(movCompraRef);
        const docCompraId = `movcompra${compraId}`;

        const subtotal = itens.reduce((acc, i) => acc + i.total_item, 0);
        const total = subtotal - (desconto || 0);

        await setDoc(doc(movCompraRef, docCompraId), {
            id: compraId,
            fornecedor_id,
            condpag_id: condpag.documentoId,
            condpag_desc: condpag.descricao,
            nf: nf || "",
            data: data || new Date(),
            obs: obs || "",
            desconto: desconto || 0,
            subtotal,
            total,
            status: "FINALIZADA",
        });

        // 2. Grava itens + entrada no estoque
        for (const item of itens) {
            const itemId = await proximoId(itensCompraRef);
            const docItemId = `itemcompra${itemId}`;

            await setDoc(doc(itensCompraRef, docItemId), {
                id: itemId,
                movcompra_id: docCompraId,
                variacao_id: item.variacao_id,
                variacao_codigo: item.variacao_codigo || "",
                produto_nome: item.produto_nome || "",
                quantidade: item.quantidade,
                custo_unitario: item.custo_unitario,
                total_item: item.total_item,
            });

            // CORRIGIDO: verifica se a entrada no estoque foi bem-sucedida
            // item.variacao_id é o documentoId do Firestore (ex: "Variacao5")
            // buscaVariacaoId agora busca por getDoc(doc(ref, id)) em vez de where("id", ==)
            const entradaResult = await entradaEstoque(
                item.variacao_id,
                item.quantidade,
                `Compra NF ${nf || docCompraId}`
            );

            if (!entradaResult.success) {
                // Lança erro para interromper e cair no catch,
                // evitando compra registrada sem estoque atualizado
                throw new Error(
                    `Falha ao dar entrada no estoque da variação ${item.variacao_id}: ${entradaResult.message}`
                );
            }
        }

        // 3. Gera parcelas em contas_pagar
        const numParcelas = condpag.num_parcelas || 1;
        const intervaloDias = condpag.intervalo_dias || 30;
        const valorParcela = parseFloat((total / numParcelas).toFixed(2));

        for (let i = 0; i < numParcelas; i++) {
            const contaId = await proximoId(contasPagarRef);
            const docContaId = `contapagar${contaId}`;

            const vencimento = new Date(data || new Date());
            vencimento.setDate(vencimento.getDate() + intervaloDias * (i + 1));

            await setDoc(doc(contasPagarRef, docContaId), {
                id: contaId,
                movcompra_id: docCompraId,
                fornecedor_id,
                parcela: i + 1,
                total_parcelas: numParcelas,
                valor: valorParcela,
                vencimento,
                status: "ABERTO",
            });
        }

        return {
            success: true,
            message: "Compra registrada com sucesso!",
            docCompraId,
        };
    } catch (e) {
        return { success: false, message: e.message || "Erro ao finalizar compra", error: e };
    }
}

export async function cancelaCompra(docId) {
    try {
        const docRef = doc(movCompraRef, docId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return { success: false, message: "Compra não encontrada" };

        await updateDoc(docRef, { status: "CANCELADA" });

        // Cancela contas a pagar abertas
        const q = query(contasPagarRef, where("movcompra_id", "==", docId), where("status", "==", "ABERTO"));
        const contas = await getDocs(q);
        for (const c of contas.docs) {
            await updateDoc(doc(contasPagarRef, c.id), { status: "CANCELADO" });
        }

        return { success: true };
    } catch (e) {
        return { success: false, message: "Erro ao cancelar compra", error: e };
    }
}