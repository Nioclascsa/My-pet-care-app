import { initializeApp } from 'firebase/app';
import { Auth, getAuth, indexedDBLocalPersistence, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA6x68Nfq8dyogg2G_tBfrYxR9GDHDkOsQ",
  authDomain: "my-pet-care-bc030.firebaseapp.com",
  projectId: "my-pet-care-bc030",
  storageBucket: "my-pet-care-bc030.firebasestorage.app",
  messagingSenderId: "295678536983",
  appId: "1:295678536983:web:4a20fc6338eef1588cdb52"
};

let auth: Auth;
let db: Firestore;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Configurar persistencia basada en plataforma
  // Para RN en iOS/Android usaremos indexedDBLocalPersistence que es más compatible
  const persistenceType = Platform.OS === 'web' ? indexedDBLocalPersistence : inMemoryPersistence;

  setPersistence(auth, persistenceType)
    .then(() => {
      console.log(`Firebase Auth: Persistencia ${Platform.OS === 'web' ? 'local' : 'en memoria'} configurada`);
    })
    .catch((error) => {
      console.warn('No se pudo configurar la persistencia:', error.code, error.message);
    });

  // Verificar la inicialización
  if (auth && db) {
    console.log('Firebase inicializado correctamente');
  }

  // Solo para desarrollo - comentar en producción
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('Modo desarrollo detectado');
    auth.useDeviceLanguage();
  }
} catch (error) {
  console.error('Error inicializando Firebase:', error);
  throw error;
}

// También podemos implementar una función de reconexión manual
export const mantenerSesionActiva = () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    // Esto renueva el token de autenticación
    currentUser.getIdToken(true).catch(e => 
      console.warn('Error al renovar token de autenticación:', e)
    );
  }
};

export { auth, db };
export const storage = getStorage();

