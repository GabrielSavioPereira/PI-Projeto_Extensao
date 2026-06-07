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

// Adicione "FORNECEDORES: 'fornecedores'" no seu arquivo collections.js
const fornecedorRef = collection(db, COLLECTIONS.FORNECEDORES);

export function escutaFornecedores(callback) {
    return onSnapshot(
        fornecedorRef,
        (snapshot) => {
            const lista = [];
            snapshot.forEach((doc) => {
                lista.push({
                    documentoId: doc.id,
                    ...doc.data()
                });
            });
            callback(lista);
        }
    );
}

export async function addFornecedor(fornecedor) {
    try {
        const q = query(
            fornecedorRef,
            orderBy("id", "desc"),
            limit(1)
        );

        const fornecedores = await getDocs(q);

        let proximoId = 1;

        if (!fornecedores.empty) {
            const ultimoFornecedor = fornecedores.docs[0].data();
            proximoId = ultimoFornecedor.id + 1;
        }

        const novoFornecedor = `fornecedor${proximoId}`;

        await setDoc(
            doc(fornecedorRef, novoFornecedor),
            {
                id: proximoId,
                ...fornecedor
            }
        );

        return {
            success: true,
            id: novoFornecedor,
            message: "Fornecedor adicionado com sucesso!"
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar o fornecedor",
            error: e
        };
    }
}

export async function buscaFornecedores() {
    try {
        const snapshot = await getDocs(fornecedorRef);

        const fornecedores = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }));

        return {
            success: true,
            fornecedores
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar fornecedores",
            error: e
        };
    }
}

export async function buscaFornecedorId(id) {
    try {
        const q = query(
            fornecedorRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const fornecedor = snapshot.docs[0];

        return {
            documentoId: fornecedor.id,
            ...fornecedor.data()
        };
    } catch (e) {
        return {
            success: false,
            message: `Erro ao buscar o fornecedor ${id}`,
            error: e
        };
    }
}

export async function deletaFornecedor(docId) {
    try {
        await deleteDoc(doc(fornecedorRef, docId));

        return {
            success: true
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao deletar o fornecedor: " + docId.toString(),
            error: e
        };
    }
}

export async function alteraFornecedor(docId, data) {
    try {
        const docRef = doc(fornecedorRef, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true
            };
        } else {
            return {
                success: false,
                message: "Fornecedor não encontrado"
            };
        }
    } catch (e) {
        return {
            success: false,
            message: "Erro ao alterar o fornecedor: " + docId.toString(),
            error: e
        };
    }
}