import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { auth, mantenerSesionActiva } from '../config/firebase';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Configurar listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Cuando la app vuelve al primer plano, refrescar el token de sesión
        console.log('App volvió al primer plano, refrescando sesión...');
        mantenerSesionActiva();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return null; // O un loading screen
  }

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="mascotas" options={{ headerShown: false }} />
    </Stack>
  );
}
