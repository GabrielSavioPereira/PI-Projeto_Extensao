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

export async function buscaVendasDoMes(mes, ano) {
    try {
        const inicio = Timestamp.fromDate(new Date(ano, mes - 1, 1, 0, 0, 0));
        const fim    = Timestamp.fromDate(new Date(ano, mes, 1, 0, 0, 0));

        const snapshot = await getDocs(
            query(vendaRef, orderBy("criado_em", "desc"))
        );

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

// clienteId → número (campo "id" do cliente) ou null
export async function addVenda(itens, formaPagamento, parcelas, desconto, clienteId) {
    try {
        const q    = query(vendaRef, orderBy("id", "desc"), limit(1));
        const snap = await getDocs(q);
        const proximoId = snap.empty ? 1 : snap.docs[0].data().id + 1;
        const docName   = `venda${proximoId}`;

        const subtotal = itens.reduce(
            (acc, item) => acc + item.preco_venda * item.quantidade, 0
        );
        const descontoValor = desconto
            ? Math.min(parseFloat(desconto.replace(",", ".")) || 0, subtotal)
            : 0;
        const total = subtotal - descontoValor;

        await setDoc(doc(vendaRef, docName), {
            id: proximoId,
            cliente_id: clienteId ?? null,
            itens: itens.map((item) => ({
                variacao_id:     item.id,
                variacao_doc_id: item.documentoId,
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
        return { success: false, message: "Erro ao registrar a venda.", error: e };
    }
}