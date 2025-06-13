import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA6x68Nfq8dyogg2G_tBfrYxR9GDHDkOsQ",
  authDomain: "my-pet-care-bc030.firebaseapp.com",
  projectId: "my-pet-care-bc030",
  storageBucket: "my-pet-care-bc030.firebasestorage.app",
  messagingSenderId: "295678536983",
  appId: "1:295678536983:web:4a20fc6338eef1588cdb52"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Exportar servicios de Firebase
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

