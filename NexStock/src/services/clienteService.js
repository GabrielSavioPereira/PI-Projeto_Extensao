import {doc, setDoc} from "firebase/firestore";

import { db } from "../services/firebase";


export async function criarCliente() {
    try {
        await setDoc(
            doc(db, 'clientes', 'cliente001'),
            {
                nome: "Pedro Canto",
                cpf: "19423464945",
                telefone: "48995732477"
            }

        );
        console.log(doc)
    } catch (e) {
        console.error(e);
    }
}