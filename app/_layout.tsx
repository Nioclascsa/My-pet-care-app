import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { auth } from '../config/firebase';

const checkSavedSession = async () => {
  try {
    const session = await AsyncStorage.getItem('auth_user');
    return !!session;
  } catch (error) {
    console.error('Error verificando sesión guardada:', error);
    return false;
  }
};

// Función para guardar sesión
const saveUserSession = async (user: any) => {
  try {
    if (!user) {
      await AsyncStorage.removeItem('auth_user');
      return;
    }
    
    await AsyncStorage.setItem('auth_user', JSON.stringify({
      uid: user.uid,
      email: user.email
    }));
  } catch (error) {
    console.error('Error guardando sesión:', error);
  }
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const checkSession = async () => {
      const hasSavedSession = await checkSavedSession();
      if (hasSavedSession) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    
    checkSession();

    // Escuchar cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Estado de autenticación cambió:', user ? `Usuario: ${user.email}` : 'No autenticado');
      setIsAuthenticated(!!user);
      setIsLoading(false);
      
      // Guardar estado de autenticación
      saveUserSession(user);
    });

    return () => unsubscribe();
  }, []);

  // Mientras se carga, mostrar indicador
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 15, fontSize: 16, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        
        <Stack.Screen name="auth" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}