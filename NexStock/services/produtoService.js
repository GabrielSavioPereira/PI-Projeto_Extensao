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

const produtoRef = collection(db, COLLECTIONS.PRODUTOS);

export function escutaProdutos(callback) {
    return onSnapshot(
        produtoRef,
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

export async function addProduto(produto) {
    try {
        
        const q = query(
                produtoRef,
                orderBy("id", "desc"),
                limit(1)
        )

        const produtos = await getDocs(q)

        let proximoId = 1;

        if (!produtos.empty) {
            const ultimoProduto = produtos.docs[0].data();

            proximoId = ultimoProduto.id + 1;
        }

        const novoProduto = `produto${proximoId}`;

        await setDoc(
            doc(produtoRef, novoProduto),
            {
                id: proximoId,
              ...produto
            }
        )

        return {
            success: true,
            id: novoProduto,
            message: "Produto Criado com Sucesso!"
        }

    } catch(e){
        
        return {
            success: false,
            message: "Erro ao criar o produto",
            error: e
        }
    }
}

export async function buscaProdutoId(id){
   
   try {

        const q = query(
            produtoRef,
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty){
            return null
        }

        const produto = snapshot.docs[0];

        return {
            ...produto.data()
        };
    } catch (error){
        return {
            success: false,
            message: "Erro ao buscar o produto " + id.toString(),
            error: e 
        }
    }

}

export async function buscaProdutos(){
    try {
        const snapshot = await getDocs(produtoRef);

        const produtos = snapshot.docs.map(doc => ({
            documentoId: doc.id,
            ...doc.data()
        }))

        return {
            success: true,
            produtos
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao buscar os produtos",
            error: e
        }
    }
}

export async function deletaProduto(id){
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

export async function alteraProduto(id, data){
    try {

        let documento = id;
        let dadosAnteriores;
        let produtoAlt = {}

        let docRef = doc(produtoRef, documento)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            dadosAnteriores = docSnap.data()

            if (data.categoria_id !== dadosAnteriores.categoria_id){
                produtoAlt["categoria_id"] = data.categoria_id
            }

            if (data.codigo !== dadosAnteriores.codigo){
                produtoAlt["codigo"] = data.codigo
            }

            if (data.marca_id !== dadosAnteriores.marca_id){
                produtoAlt["marca_id"] = data.marca_id
            }

            if (data.nome !== dadosAnteriores.nome){
                produtoAlt["nome"] = data.nome
            }
            
            if (data.preco_custo !== dadosAnteriores.preco_custo){
                produtoAlt["preco_custo"] = parseFloat(data.preco_custo)
            }

            if (data.preco_venda !== dadosAnteriores.preco_venda){
                produtoAlt["preco_venda"] = parseFloat(data.preco_venda)
            }

            if (data.unidade_id !== dadosAnteriores.unidade_id){
                produtoAlt["unidade_id"] = data.unidade_id
            }

        } else {
            return {
                success: false,
                message: "Produto não encontrado"
            }
        }

        await updateDoc(docRef, produtoAlt);


        return {
            success: true,
        }

    } catch(e) {
        return {
            success: false,
            message: "Erro ao alterar o produto: " + id.toString(),
            error: e
        }
    }
}
