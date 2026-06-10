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
    onSnapshot
} from "firebase/firestore";

import { COLLECTIONS } from "../database/collections";

// Adicione "CONDPAG: 'condpag'" no seu arquivo collections.js
const condPagRef = collection(db, COLLECTIONS.CONDPAG);

export function escutaCondPag(callback) {
    return onSnapshot(
        condPagRef,
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

export async function addCondPag(condPag) {
    try {
        const q = query(
            condPagRef,
            orderBy("id", "desc"),
            limit(1)
        );

        const docs = await getDocs(q);

        let proximoId = 1;

        if (!docs.empty) {
            const ultimo = docs.docs[0].data();
            proximoId = ultimo.id + 1;
        }

        const novoId = `condpag${proximoId}`;

        await setDoc(
            doc(condPagRef, novoId),
            {
                id: proximoId,
                ...condPag
            }
        );

        return {
            success: true,
            id: novoId,
            message: "Condição de pagamento adicionada com sucesso!"
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar condição de pagamento",
            error: e
        };
    }
}

export async function deletaCondPag(docId) {
    try {
        await deleteDoc(doc(condPagRef, docId));

        return { success: true };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao deletar condição de pagamento: " + docId.toString(),
            error: e
        };
    }
}

export async function alteraCondPag(docId, data) {
    try {
        const docRef = doc(condPagRef, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);
            return { success: true };
        } else {
            return {
                success: false,
                message: "Condição de pagamento não encontrada"
            };
        }
    } catch (e) {
        return {
            success: false,
            message: "Erro ao alterar condição de pagamento: " + docId.toString(),
            error: e
        };
    }
}