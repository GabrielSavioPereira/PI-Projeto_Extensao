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

// Adicione "CLIENTES: 'clientes'" no seu arquivo collections.js
const clienteRef = collection(db, COLLECTIONS.CLIENTES);

export function escutaClientes(callback) {
    return onSnapshot(
        clienteRef,
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

export async function addCliente(cliente) {
    try {
        const q = query(
            clienteRef,
            orderBy("id", "desc"),
            limit(1)
        );

        const clientes = await getDocs(q);

        let proximoId = 1;

        if (!clientes.empty) {
            const ultimoCliente = clientes.docs[0].data();
            proximoId = ultimoCliente.id + 1;
        }

        const novoCliente = `cliente${proximoId}`;

        await setDoc(
            doc(clienteRef, novoCliente),
            {
                id: proximoId,
                ...cliente
            }
        );

        return {
            success: true,
            id: novoCliente,
            message: "Cliente adicionado com sucesso!"
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar o cliente",
            error: e
        };
    }
}

export async function buscaClientes() {
    try {
        const snapshot = await getDocs(clienteRef);

        const clientes = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }));

        return {
            success: true,
            clientes
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar clientes",
            error: e
        };
    }
}

export async function buscaClienteId(id) {
    try {
        const q = query(
            clienteRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const cliente = snapshot.docs[0];

        return {
            documentoId: cliente.id,
            ...cliente.data()
        };
    } catch (e) {
        return {
            success: false,
            message: `Erro ao buscar o cliente ${id}`,
            error: e
        };
    }
}

export async function deletaCliente(docId) {
    try {
        await deleteDoc(doc(clienteRef, docId));

        return {
            success: true
        };
    } catch (e) {
        return {
            success: false,
            message: "Erro ao deletar o cliente: " + docId.toString(),
            error: e
        };
    }
}

export async function alteraCliente(docId, data) {
    try {
        const docRef = doc(clienteRef, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true
            };
        } else {
            return {
                success: false,
                message: "Cliente não encontrado"
            };
        }
    } catch (e) {
        return {
            success: false,
            message: "Erro ao alterar o cliente: " + docId.toString(),
            error: e
        };
    }
}