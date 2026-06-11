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

const variacaoRef = collection(db, COLLECTIONS.PROD_VARIACOES);

export function escutaProdVariacao(callback) {
    return onSnapshot(
        variacaoRef,
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

export async function addVariacao(variacao) {
    try {
        
        const q = query(
                variacaoRef,
                orderBy("id", "desc"),
                limit(1)
        )

        const variacoes = await getDocs(q)

        let proximoId = 1;

        if (!variacoes.empty) {
            const ultimoVariacao = variacoes.docs[0].data();

            proximoId = ultimoVariacao.id + 1;
        }

        const novaVariacao = `Variacao${proximoId}`;

        await setDoc(
            doc(variacaoRef, novaVariacao),
            {
                id: proximoId,
              ...variacao
            }
        )

        return {
            success: true,
            id: novaVariacao,
            message: "Variacao Criada com Sucesso!"
        }

    } catch(e){
        
        return {
            success: false,
            message: "Erro ao criar a Variacao",
            error: e
        }
    }
}

export async function buscaVariacaoId(id){
   
   try {

        const q = query(
            variacaoRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const variacao = snapshot.docs[0];

        return {
            success: true,
            ...variacao.data()
        };
    } catch (error){
        return {
            success: false,
            message: "Erro ao buscar a variacao " + id.toString(),
            error: e 
        }
    }

}

export async function buscaVariacoes(){
    try {
        const snapshot = await getDocs(variacaoRef);

        const variacoes = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            variacoes
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao buscar os variacoes",
            error: e
        }
    }
}

export async function deletaVariacao(id){
    try {
        let documento = id

        await deleteDoc(doc(
            variacaoRef,
            documento
        ));

        return {
            success: true
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao deletar a variacao: " + id.toString(),
            error: e
        }
    }
}

export async function alteraVariacao(id, data){
    try {

        let documento = id;

        let docRef = doc(variacaoRef, documento)

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
