import { signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { auth, db } from '../../config/firebase';

export default function TestConnection() {
  const [status, setStatus] = useState('Verificando conexión...');

  const testConnection = async () => {
    try {
      // Prueba la autenticación
      await signInAnonymously(auth);
      // Prueba Firestore
      const testDocRef = doc(collection(db, 'test'), 'test');
      await setDoc(testDocRef, { test: true });
      await deleteDoc(testDocRef);

      setStatus('Conexión exitosa ✅');
    } catch (error: any) {
      setStatus(`Error de conexión ❌: ${error.message}`);
      console.error('Error completo:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>{status}</Text>
      <Button title="Probar Conexión" onPress={testConnection} />
    </View>
  );
}