import {db} from "../dbconfig/config"
import {
  collection,
  addDoc,
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
  onSnapshot,
  documentId
} from "firebase/firestore";

import {COLLECTIONS} from "../database/collections"

const corRef = collection(db, COLLECTIONS.CORES);

export function escutaCores(callback) {
    return onSnapshot(
        corRef,
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

export async function addCor(cor) {
    try {
        
        const q = query(
                corRef,
                orderBy("id", "desc"),
                limit(1)
        )

        const cores = await getDocs(q)

        let proximoId = 1;

        if (!cores.empty) {
            const ultimaCor = cores.docs[0].data();

            proximoId = ultimaCor.id + 1;
        }

        const novaCor = `Cores${proximoId}`;

        await setDoc(
            doc(corRef, novaCor),
            {
                id: proximoId,
              ...cor
            }
        )

        return {
            success: true,
            id: novaCor,
            message: "Cor Criada com Sucesso!"
        }

    } catch(e){
        
        return {
            success: false,
            message: "Erro ao criar nova Cor",
            error: e
        }
    }
}

export async function buscaCorId(id){
   
   try {

        const q = query(
            corRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const cor = snapshot.docs[0];

        return {
            ...cor.data()
        };
    } catch (error){
        return {
            success: false,
            message: "Erro ao buscar a cor " + id.toString(),
            error: e 
        }
    }

}

export async function buscaCores(){
    try {
        const snapshot = await getDocs(corRef);

        const cores = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            cores
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao buscar as cores",
            error: e
        }
    }
}

export async function deletaCor(id){
    try {
        let documento = id

        await deleteDoc(doc(
            corRef,
            documento
        ));

        return {
            success: true
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar a cor: " + id.toString(),
            error: e
        }
    }
}

export async function alteraVariacao(id, data){
    try {

        let documento = id;

        let docRef = doc(corRef, documento)

        await updateDoc(docRef, data);
 

        return {
            success: true,
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar a variação : " + id.toString(),
            error: e
        }
    }
}
