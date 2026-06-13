import { db } from "../dbconfig/config";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
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

const saldoRef = collection(db, COLLECTIONS.SAL_VARIACOES);

// ─────────────────────────────────────────────────────────────────────────────
// LISTENER em tempo real — todos os saldos
// ─────────────────────────────────────────────────────────────────────────────
export function escutaSaldos(callback) {
    return onSnapshot(saldoRef, (snapshot) => {
        const lista = [];
        snapshot.forEach((d) => {
            lista.push({ documentoId: d.id, ...d.data() });
        });
        callback(lista);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTENER em tempo real — saldo de UMA variação específica
// ─────────────────────────────────────────────────────────────────────────────
export function escutaSaldoPorVariacao(variacao_id, callback) {
    const q = query(saldoRef, where("variacao_id", "==", variacao_id));

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
            return;
        }
        const d = snapshot.docs[0];
        callback({ documentoId: d.id, ...d.data() });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Gera o próximo ID sequencial de saldo
// ─────────────────────────────────────────────────────────────────────────────
async function proximoIdSaldo() {
    const q = query(saldoRef, orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
        return snap.docs[0].data().id + 1;
    }
    return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR saldo de uma variação pelo variacao_id numérico
// Retorna o objeto de saldo ou null se ainda não existir
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaSaldoPorVariacao(variacao_id) {
    try {
        const q = query(saldoRef, where("variacao_id", "==", variacao_id));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        return {
            documentoId: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        };
    } catch (e) {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR todos os saldos
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaTodosSaldos() {
    try {
        const snapshot = await getDocs(saldoRef);

        const saldos = snapshot.docs.map((d) => ({
            documentoId: d.id,
            ...d.data()
        }));

        return { success: true, saldos };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar saldos.",
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATUALIZAR (ou criar) o saldo de uma variação
// Chamado internamente pelo MovEstoqueService após cada movimentação
// ─────────────────────────────────────────────────────────────────────────────
export async function atualizaSaldo(variacao_id, novaQuantidade) {
    try {
        const saldoExistente = await buscaSaldoPorVariacao(variacao_id);

        if (saldoExistente) {
            // Já existe — atualiza
            const docRef = doc(saldoRef, saldoExistente.documentoId);
            await updateDoc(docRef, {
                quantidade: novaQuantidade,
                atualizado_em: Timestamp.now()
            });

            return {
                success: true,
                documentoId: saldoExistente.documentoId,
                quantidade: novaQuantidade
            };
        } else {
            // Ainda não existe — cria
            const proximoId = await proximoIdSaldo();
            const docName = `saldo${proximoId}`;

            await setDoc(doc(saldoRef, docName), {
                id: proximoId,
                variacao_id,
                quantidade: novaQuantidade,
                atualizado_em: Timestamp.now()
            });

            return {
                success: true,
                documentoId: docName,
                quantidade: novaQuantidade
            };
        }
    } catch (e) {
        return {
            success: false,
            message: "Erro ao atualizar saldo da variação: " + variacao_id,
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZAR saldo zerado para uma nova variação
// Chamar ao criar uma nova variação de produto
// ─────────────────────────────────────────────────────────────────────────────
export async function inicializaSaldo(variacao_id) {
    try {
        const saldoExistente = await buscaSaldoPorVariacao(variacao_id);

        if (saldoExistente) {
            return {
                success: true,
                message: "Saldo já existe para essa variação.",
                quantidade: saldoExistente.quantidade
            };
        }

        const proximoId = await proximoIdSaldo();
        const docName = `saldo${proximoId}`;

        await setDoc(doc(saldoRef, docName), {
            id: proximoId,
            variacao_id,
            quantidade: 0,
            atualizado_em: Timestamp.now()
        });

        return {
            success: true,
            documentoId: docName,
            quantidade: 0,
            message: "Saldo inicializado com zero."
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao inicializar saldo para variação: " + variacao_id,
            error: e
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUMO DE ESTOQUE — retorna saldos com flag de alerta por quantidade mínima
// Útil para o dashboard ou tela de estoque
// ─────────────────────────────────────────────────────────────────────────────
export async function resumoEstoque(qtdMinima = 5) {
    try {
        const snapshot = await getDocs(saldoRef);

        const todos = snapshot.docs.map((d) => ({
            documentoId: d.id,
            ...d.data()
        }));

        const emAlerta = todos.filter((s) => s.quantidade <= qtdMinima);
        const zerados = todos.filter((s) => s.quantidade === 0);
        const totalItens = todos.length;
        const totalPecas = todos.reduce((acc, s) => acc + (s.quantidade || 0), 0);

        return {
            success: true,
            totalItens,
            totalPecas,
            emAlerta,
            zerados,
            todos
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao calcular resumo de estoque.",
            error: e
        };
    }
}