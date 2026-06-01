import {db} from "../dbconfig/config"
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

const tamRef = collection(db, COLLECTIONS.TAMANHOS);

export function escutaTam(callback) {
    return onSnapshot(
        tamRef,
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

export async function addTams(tam) {
    try {
        const q = query(
            tamRef,
            orderBy("id","desc"),
            limit(1)
        )

        const tams = await getDocs(q)
        
        let proximoId = 1;

        if (!tams.empty) {
            const ultimaTam = tams.docs[0].data();

            proximoId = ultimaTam.id + 1;
        }

        const novoTam = `tamanho${proximoId}`;

        await setDoc(
            doc(tamRef, novoTam),
            {
                id: proximoId,
                ...tam
            }
        )

        return {
            success: true,
            id: novoTam,
            message: "Tamanho adicionado com sucesso!"
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar um novo tamanho: " + categ.nome,
            error: e
        }
    }
}

export async function buscaTamId(id){
   
   try {

        const q = query(
            tamRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const tam = snapshot.docs[0];

        return {
            ...tam.data()
        };
    } catch (error){
        return {
            success: false,
            message: `Erro ao buscar o tamanho ${id}`,
            error: e 
        }
    }

}


export async function buscaTams() {
    try {
        const snapshot = await getDocs(tamRef);

        const tams = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            tams
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar os tamanhos",
            error: e
        }
    }
}

export async function deletaTams(docId){
    try {

        await deleteDoc(doc(
            tamRef,
            docId
        ));

        return {
            success: true
        }
        
    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar o tamanho: " + docId.toString(),
            error: e
        }
    }
}

export async function alteraTam(id, data){
    try {

        let documento = id;

        let docRef = doc(tamRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true,
            }

        } else {
            return {
                success: false,
                message: "Tamanho não encontrada"
            }
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar o tamanho: " + id.toString(),
            error: e
        }
    }
}

