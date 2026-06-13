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
    Timestamp
} from "firebase/firestore";

import { COLLECTIONS } from "../database/collections";
import { buscaVariacaoId } from "./ProdutoVariacaoService";
import { atualizaSaldo, buscaSaldoPorVariacao } from "./SaldoVariacaoService";

const movStockRef = collection(db, COLLECTIONS.MOV_ESTOQUE);

// ─────────────────────────────────────────────────────────────────────────────
// LISTENER em tempo real — todas as movimentações
// ─────────────────────────────────────────────────────────────────────────────
export function escutaMovStock(callback) {
    const q = query(movStockRef, orderBy("data", "desc"));

    return onSnapshot(q, (snapshot) => {
        const lista = [];
        snapshot.forEach((d) => {
            lista.push({ documentoId: d.id, ...d.data() });
        });
        callback(lista);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTENER em tempo real — movimentações de UMA variação específica
// ─────────────────────────────────────────────────────────────────────────────
export function escutaMovPorVariacao(variacao_id, callback) {
    const q = query(
        movStockRef,
        where("variacao_id", "==", variacao_id),
        orderBy("data", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const lista = [];
        snapshot.forEach((d) => {
            lista.push({ documentoId: d.id, ...d.data() });
        });
        callback(lista);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Gera o próximo ID numérico sequencial
// ─────────────────────────────────────────────────────────────────────────────
async function proximoIdMovimentacao() {
    const q = query(movStockRef, orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
        return snap.docs[0].data().id + 1;
    }
    return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRADA de estoque
// Registra movimentação + atualiza saldo da variação
// ─────────────────────────────────────────────────────────────────────────────
export async function entradaEstoque(variacao_id, quantidade, motivo = "Compra") {
    try {
        if (!variacao_id || quantidade <= 0) {
            return {
                success: false,
                message: "Variação inválida ou quantidade deve ser maior que zero."
            };
        }

        // Verifica se a variação existe
        const variacaoResp = await buscaVariacaoId(variacao_id);
        if (!variacaoResp || !variacaoResp.success) {
            return {
                success: false,
                message: "Variação não encontrada: " + variacao_id
            };
        }

        // Registra a movimentação
        const proximoId = await proximoIdMovimentacao();
        const docName = `movimentacao${proximoId}`;

        const movimentacao = {
            id: proximoId,
            variacao_id,
            tipo: "ENTRADA",
            quantidade,
            motivo,
            data: Timestamp.now()
        };

        await setDoc(doc(movStockRef, docName), movimentacao);

        // Atualiza o saldo
        const saldoResp = await buscaSaldoPorVariacao(variacao_id);
        const saldoAtual = saldoResp?.quantidade ?? 0;
        const novoSaldo = saldoAtual + quantidade;

        const saldoAtualizado = await atualizaSaldo(variacao_id, novoSaldo);

        if (!saldoAtualizado.success) {
            return {
                success: false,
                message: "Movimentação registrada, mas falha ao atualizar saldo: " + saldoAtualizado.message
            };
        }

        return {
            success: true,
            id: docName,
            novoSaldo,
            message: `Entrada de ${quantidade} unidade(s) registrada com sucesso!`
        };

    } catch (e) {
        return {
            success: false,
            message: "Erro ao registrar entrada de estoque.",
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAÍDA de estoque
// Registra movimentação + atualiza saldo da variação
// ─────────────────────────────────────────────────────────────────────────────
export async function saidaEstoque(variacao_id, quantidade, motivo = "Venda") {
    try {
        if (!variacao_id || quantidade <= 0) {
            return {
                success: false,
                message: "Variação inválida ou quantidade deve ser maior que zero."
            };
        }

        // Verifica se a variação existe
        const variacaoResp = await buscaVariacaoId(variacao_id);
        if (!variacaoResp || !variacaoResp.success) {
            return {
                success: false,
                message: "Variação não encontrada: " + variacao_id
            };
        }

        // Verifica se há saldo suficiente
        const saldoResp = await buscaSaldoPorVariacao(variacao_id);
        const saldoAtual = saldoResp?.quantidade ?? 0;

        if (saldoAtual < quantidade) {
            return {
                success: false,
                message: `Saldo insuficiente. Disponível: ${saldoAtual}, solicitado: ${quantidade}.`
            };
        }

        // Registra a movimentação
        const proximoId = await proximoIdMovimentacao();
        const docName = `movimentacao${proximoId}`;

        const movimentacao = {
            id: proximoId,
            variacao_id,
            tipo: "SAIDA",
            quantidade,
            motivo,
            data: Timestamp.now()
        };

        await setDoc(doc(movStockRef, docName), movimentacao);

        // Atualiza o saldo
        const novoSaldo = saldoAtual - quantidade;
        const saldoAtualizado = await atualizaSaldo(variacao_id, novoSaldo);

        if (!saldoAtualizado.success) {
            return {
                success: false,
                message: "Movimentação registrada, mas falha ao atualizar saldo: " + saldoAtualizado.message
            };
        }

        return {
            success: true,
            id: docName,
            novoSaldo,
            message: `Saída de ${quantidade} unidade(s) registrada com sucesso!`
        };

    } catch (e) {
        return {
            success: false,
            message: "Erro ao registrar saída de estoque.",
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Define a quantidade diretamente, sem verificar saldo mínimo
// ─────────────────────────────────────────────────────────────────────────────
export async function ajusteEstoque(variacao_id, quantidadeNova, motivo = "Ajuste de inventário") {
    try {
        if (!variacao_id || quantidadeNova < 0) {
            return {
                success: false,
                message: "Variação inválida ou quantidade não pode ser negativa."
            };
        }

        const variacaoResp = await buscaVariacaoId(variacao_id);
        if (!variacaoResp || !variacaoResp.success) {
            return {
                success: false,
                message: "Variação não encontrada: " + variacao_id
            };
        }

        const saldoResp = await buscaSaldoPorVariacao(variacao_id);
        const saldoAtual = saldoResp?.quantidade ?? 0;
        const diferenca = quantidadeNova - saldoAtual;

        if (diferenca === 0) {
            return {
                success: true,
                novoSaldo: saldoAtual,
                message: "Nenhuma alteração necessária, saldo já está correto."
            };
        }

        const tipoAjuste = diferenca > 0 ? "AJUSTE_ENTRADA" : "AJUSTE_SAIDA";

        // Registra a movimentação de ajuste
        const proximoId = await proximoIdMovimentacao();
        const docName = `movimentacao${proximoId}`;

        const movimentacao = {
            id: proximoId,
            variacao_id,
            tipo: tipoAjuste,
            quantidade: Math.abs(diferenca),
            motivo,
            data: Timestamp.now()
        };

        await setDoc(doc(movStockRef, docName), movimentacao);

        // Atualiza o saldo
        const saldoAtualizado = await atualizaSaldo(variacao_id, quantidadeNova);

        if (!saldoAtualizado.success) {
            return {
                success: false,
                message: "Ajuste registrado, mas falha ao atualizar saldo."
            };
        }

        return {
            success: true,
            id: docName,
            novoSaldo: quantidadeNova,
            diferenca,
            message: `Estoque ajustado com sucesso! Novo saldo: ${quantidadeNova}.`
        };

    } catch (e) {
        return {
            success: false,
            message: "Erro ao realizar ajuste de estoque.",
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR movimentação por ID numérico
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaMovStock(id) {
    try {
        const q = query(movStockRef, where("id", "==", id));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        return {
            documentoId: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar movimentação: " + id.toString(),
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR todas as movimentações de uma variação
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaMovPorVariacao(variacao_id) {
    try {
        const q = query(
            movStockRef,
            where("variacao_id", "==", variacao_id),
            orderBy("data", "desc")
        );

        const snapshot = await getDocs(q);

        const movimentacoes = snapshot.docs.map((d) => ({
            documentoId: d.id,
            ...d.data()
        }));

        return { success: true, movimentacoes };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar movimentações da variação: " + variacao_id,
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR todas as movimentações (com paginação opcional)
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaTodasMovimentacoes(limiteDocs = 50) {
    try {
        const q = query(
            movStockRef,
            orderBy("data", "desc"),
            limit(limiteDocs)
        );

        const snapshot = await getDocs(q);

        const movimentacoes = snapshot.docs.map((d) => ({
            documentoId: d.id,
            ...d.data()
        }));

        return { success: true, movimentacoes };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar movimentações.",
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR movimentações por tipo (ENTRADA / SAIDA / AJUSTE_ENTRADA / AJUSTE_SAIDA)
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaMovPorTipo(tipo) {
    try {
        const q = query(
            movStockRef,
            where("tipo", "==", tipo),
            orderBy("data", "desc")
        );

        const snapshot = await getDocs(q);

        const movimentacoes = snapshot.docs.map((d) => ({
            documentoId: d.id,
            ...d.data()
        }));

        return { success: true, movimentacoes };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar movimentações por tipo: " + tipo,
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETAR movimentação (somente registro — NÃO estorna o saldo)
// Use com cautela; prefira ajusteEstoque para correções.
// ─────────────────────────────────────────────────────────────────────────────
export async function deletaMovimentacao(docId) {
    try {
        await deleteDoc(doc(movStockRef, docId));
        return { success: true };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao excluir a movimentação: " + docId.toString(),
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ALTERAR apenas o motivo ou observação de uma movimentação já registrada
// ─────────────────────────────────────────────────────────────────────────────
export async function alteraMotivMovimentacao(docId, novoMotivo) {
    try {
        const docRef = doc(movStockRef, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return {
                success: false,
                message: "Movimentação não encontrada: " + docId
            };
        }

        await updateDoc(docRef, { motivo: novoMotivo });

        return { success: true };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao alterar o motivo da movimentação: " + docId.toString(),
            error: e
        };
    }
}