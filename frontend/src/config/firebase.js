import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDjn4uCwBnO3gVSKtprSMDaUAqFtz98oR0",
    authDomain: "tfgmaquetas.firebaseapp.com",
    databaseURL: "https://tfgmaquetas-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tfgmaquetas",
    storageBucket: "tfgmaquetas.firebasestorage.app",
    messagingSenderId: "868045938140",
    appId: "1:868045938140:web:9d1df309cb09a649504319"
};

//Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

//Exportamos Auth (para los logins/registros)
export const auth = getAuth(app);

//Exportamos Firestore (para guardar los datos del usuario)
export const db = getFirestore(app);