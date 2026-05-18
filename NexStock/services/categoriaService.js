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

const categRef = collection(db, COLLECTIONS.CATEGORIAS);

export function escutaCategs(callback) {
    return onSnapshot(
        categRef,
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

export async function addCateg(categ) {
    try {
        const q = query(
            categRef,
            orderBy("id","desc"),
            limit(1)
        )

        const categs = await getDocs(q)
        
        let proximoId = 1;

        if (!categs.empty) {
            const ultimaCateg = categs.docs[0].data();

            proximoId = ultimaCateg.id + 1;
        }

        const novaCateg = `categoria${proximoId}`;

        await setDoc(
            doc(categRef, novaCateg),
            {
                id: proximoId,
                ...categ
            }
        )

        return {
            success: true,
            id: novaCateg,
            message: "Categoria adicionada com sucesso!"
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao adicionar a categoria: " + categ.nome,
            error: e
        }
    }
}

export async function buscaCategId(id){
   
   try {

        const q = query(
            categRef,
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


export async function buscaCategs() {
    try {
        const snapshot = await getDoc(categRef);

        const categs = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            categs
        }

    } catch (e) {
        return {
            success: false,
            message: "Erro ao buscar categorias",
            error: e
        }
    }
}

export async function deletaCateg(docId){
    try {

        await deleteDoc(doc(
            categRef,
            docId
        ));

        return {
            success: true
        }
        
    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar a categoria: " + docId.toString(),
            error: e
        }
    }
}

export async function alteraCateg(id, data){
    try {

        let documento = id;

        let docRef = doc(categRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);

            return {
                success: true,
            }

        } else {
            return {
                success: false,
                message: "Categoria não encontrada"
            }
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar a catogoria: " + id.toString(),
            error: e
        }
    }
}

