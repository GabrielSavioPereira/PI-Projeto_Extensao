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

const umedRef = collection(db, COLLECTIONS.UNIDADES_MEDIDA);

export function escutaUmeds(callback) {
    return onSnapshot(
        umedRef,
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

export async function addUmeds(umed) {
    try {
        const q = query(
            umedRef,
            orderBy("id","desc"),
            limit(1)
        )

        const umeds = await getDocs(q)
        
        let proximoId = 1;

        if (!umeds.empty) {
            const ultimaUmed = umeds.docs[0].data();

            proximoId = ultimaUmed.id + 1;
        }

        const novaUmed = `umed${proximoId}`;

        await setDoc(
            doc(umedRef, novaUmed),
            {
                id: proximoId,
                ...umed
            }
        )

        return {
            success: true,
            id: novaUmed,
            message: "Unidade de medida adicionada com sucesso!"
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar a unidade de medida: " + categ.nome,
            error: e
        }
    }
}

export async function buscaUmedId(id){
   
   try {

        const q = query(
            umedRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const umed = snapshot.docs[0];

        return {
            ...umed.data()
        };
    } catch (error){
        return {
            success: false,
            message: `Erro ao buscar o Unidade de medida ${id}`,
            error: e 
        }
    }

}


export async function buscaUmeds() {
    try {
        const snapshot = await getDocs(umedRef);

        const umeds = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            umeds
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar unidade de medidas",
            error: e
        }
    }
}

export async function deletaUmeds(docId){
    try {

        await deleteDoc(doc(
            umedRef,
            docId
        ));

        return {
            success: true
        }
        
    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar a unidade de medida: " + docId.toString(),
            error: e
        }
    }
}

export async function alteraUmed(id, data){
    try {

        let documento = id;

        let docRef = doc(umedRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true,
            }

        } else {
            return {
                success: false,
                message: "Unidade de medida não encontrada"
            }
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar a unidade de medida: " + id.toString(),
            error: e
        }
    }
}

