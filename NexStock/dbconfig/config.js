import { initializeApp } from 'firebase/app';
import { getFirestore} from "firebase/firestore"
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: 'AIzaSyCOJIS5sBjcD1ZM2aM946sqScFQAWBX9cw',
  authDomain: 'com.nexstock',
  projectId: 'nexstock-6f22d',
  storageBucket: 'nexstock-6f22d.firebasestorage.app',
  messagingSenderId: '157258166428',
  appId: '1:157258166428:android:9ad464688ed1f2b0f93d59',
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export {db,auth};