import { db } from "../dbconfig/config";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
} from "firebase/firestore";

import { COLLECTIONS } from "../database/collections";
import { saidaEstoque } from "./MovEstoqueService";

const vendaRef = collection(db, COLLECTIONS.VENDAS);

// ─────────────────────────────────────────────────────────────────────────────
// LISTENER em tempo real — todas as vendas
// ─────────────────────────────────────────────────────────────────────────────
export function escutaVendas(callback) {
    return onSnapshot(
        query(vendaRef, orderBy("id", "desc")),
        (snapshot) => {
            const lista = [];
            snapshot.forEach((d) => {
                lista.push({ documentoId: d.id, ...d.data() });
            });
            callback(lista);
        }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCA vendas do mês (por Timestamp)
// mes e ano são números (ex: 5, 2025)
// ─────────────────────────────────────────────────────────────────────────────
export async function buscaVendasDoMes(mes, ano) {
    try {
        const inicio = Timestamp.fromDate(new Date(ano, mes - 1, 1, 0, 0, 0));
        const fim    = Timestamp.fromDate(new Date(ano, mes, 1, 0, 0, 0)); // início do mês seguinte

        const snapshot = await getDocs(
            query(
                vendaRef,
                orderBy("criado_em", "desc")
            )
        );

        // Filtra no cliente (evita precisar de índice composto no Firestore)
        const lista = [];
        snapshot.forEach((d) => {
            const data = d.data();
            if (
                data.criado_em &&
                data.criado_em.seconds >= inicio.seconds &&
                data.criado_em.seconds < fim.seconds
            ) {
                lista.push({ documentoId: d.id, ...data });
            }
        });

        return { success: true, vendas: lista };
    } catch (e) {
        console.error("buscaVendasDoMes:", e);
        return { success: false, message: "Erro ao buscar vendas do mês.", error: e };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
export async function addVenda(itens, formaPagamento, parcelas, desconto) {
    try {
        // ── Próximo ID sequencial ──────────────────────────────────────────────
        const q    = query(vendaRef, orderBy("id", "desc"), limit(1));
        const snap = await getDocs(q);
        const proximoId = snap.empty ? 1 : snap.docs[0].data().id + 1;
        const docName   = `venda${proximoId}`;

        // ── Cálculos financeiros ───────────────────────────────────────────────
        const subtotal = itens.reduce(
            (acc, item) => acc + item.preco_venda * item.quantidade,
            0
        );
        const descontoValor = desconto
            ? Math.min(parseFloat(desconto.replace(",", ".")) || 0, subtotal)
            : 0;
        const total = subtotal - descontoValor;

        // ── Grava a venda ──────────────────────────────────────────────────────
        await setDoc(doc(vendaRef, docName), {
            id: proximoId,
            itens: itens.map((item) => ({
                variacao_id:     item.id,           // numérico
                variacao_doc_id: item.documentoId,  // ex: "Variacao3"
                produto_nome:    item.produto_nome,
                codigo:          item.codigo || "",
                preco_venda:     item.preco_venda,
                quantidade:      item.quantidade,
                subtotal:        item.preco_venda * item.quantidade,
            })),
            subtotal,
            desconto:        descontoValor,
            total,
            forma_pagamento: formaPagamento,
            parcelas:        formaPagamento === "credito" ? parcelas : 1,
            criado_em:       Timestamp.now(),
        });

        // ── Movimenta estoque via saidaEstoque (grava mov + atualiza saldo) ───
        // saidaEstoque(variacao_id_numerico, quantidade, motivo)
        const erros = [];
        for (const item of itens) {
            const res = await saidaEstoque(
                item.id,
                item.quantidade,
                `Venda #${docName}`
            );
            if (!res.success) {
                erros.push(`${item.produto_nome}: ${res.message}`);
            }
        }

        return {
            success: true,
            id:      docName,
            total,
            message:
                erros.length > 0
                    ? `Venda registrada, mas atenção:\n${erros.join("\n")}`
                    : "Venda registrada com sucesso!",
        };
    } catch (e) {
        console.error("addVenda:", e);
        return {
            success: false,
            message: "Erro ao registrar a venda.",
            error:   e,
        };
    }
}