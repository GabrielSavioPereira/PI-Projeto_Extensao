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

const marcaRef = collection(db, COLLECTIONS.MARCAS);

export function escutaMarcas(callback) {
    return onSnapshot(
        marcaRef,
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

export async function addMarca(marca) {
    try {
        const q = query(
            marcaRef,
            orderBy("id","desc"),
            limit(1)
        )

        const marcas = await getDocs(q)
        
        let proximoId = 1;

        if (!marcas.empty) {
            const ultimaMarca = marcas.docs[0].data();

            proximoId = ultimaMarca.id + 1;
        }

        const novaMarca = `marca${proximoId}`;

        await setDoc(
            doc(marcaRef, novaMarca),
            {
                id: proximoId,
                ...marca
            }
        )

        return {
            success: true,
            id: novaMarca,
            message: "Marca adicionada com sucesso!"
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar a marca: " + marca.nome,
            error: e
        }
    }
}

export async function buscaMarcaId(id){
   
   try {

        const q = query(
            marcaRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const marca = snapshot.docs[0];

        return {
            ...marca.data()
        };
    } catch (error){
        return {
            success: false,
            message: `Erro ao buscar o Marca ${id}`,
            error: e 
        }
    }

}


export async function buscaMarcas() {
    try {
        const snapshot = await getDoc(marcaRef);

        const marcas = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            marcas
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar marcas",
            error: e
        }
    }
}

export async function deletaMarca(id){
    try {
        let documento = id

        await deleteDoc(doc(
            produtoRef,
            documento
        ));

        return {
            success: true
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar o produto: " + id.toString(),
            error: e
        }
    }
}

export async function alteraMarca(id, data){
    try {

        let documento = id;

        let docRef = doc(marcaRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true,
            }

        } else {
            return {
                success: false,
                message: "Produto não encontrado"
            }
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar o produto: " + id.toString(),
            error: e
        }
    }
}

