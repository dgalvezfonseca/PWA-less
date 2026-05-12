// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCiJI5cEEZg_ZZpnHxyrPMLC7Qzl9K_aJY",
    authDomain: "pwa-less.firebaseapp.com",
    projectId: "pwa-less",
    storageBucket: "pwa-less.firebasestorage.app",
    messagingSenderId: "279550026440",
    appId: "1:279550026440:web:8071c1da9bd6aaf469bbfd"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guardar score
export async function guardarScore(nombre, score) {
    const cleanName = String(nombre || "Jugador").trim().slice(0, 24) || "Jugador";
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));

    if (cleanScore <= 0) return null;

    const docRef = await addDoc(collection(db, "scores"), {
        nombre: cleanName,
        score: cleanScore,
        fecha: serverTimestamp()
    });

    console.log("Score guardado");
    return docRef.id;
}

// Obtener top 10
export async function obtenerScores() {

    const q = query(
        collection(db, "scores"),
        orderBy("score", "desc"),
        limit(10)
    );

    const querySnapshot = await getDocs(q);

    const scores = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        scores.push({
            nombre: String(data.nombre || "Jugador").slice(0, 24),
            score: Math.floor(Number(data.score) || 0),
            fecha: data.fecha || null
        });
    });

    return scores;
}
