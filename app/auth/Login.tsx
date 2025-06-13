import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../../config/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); // Para comprobar sesión al inicio
  const router = useRouter();

  // Comprobar si existe una sesión guardada al cargar el componente
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('user_email');
        if (savedEmail) {
          setEmail(savedEmail);
        }
        
        // Verificar si hay un usuario ya autenticado
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Usuario ya autenticado:', currentUser.email);
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error comprobando sesión guardada:', error);
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSavedSession();
  }, []);

  const guardarCredenciales = async (userEmail: string) => {
    try {
      await AsyncStorage.setItem('user_email', userEmail);
      console.log('Email guardado para próximos inicios de sesión');
    } catch (error) {
      console.error('Error guardando email:', error);
    }
  };

  // Definir la función saveUserSession localmente si no está disponible en firebase.ts
  const saveUserSession = async (user: any) => {
    try {
      if (!user) return;
      
      // Guardar datos mínimos del usuario
      await AsyncStorage.setItem('auth_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || ''
      }));
      console.log('Sesión guardada correctamente');
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, ingresa tu correo y contraseña");
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Guardar el email para autocompletar
      await guardarCredenciales(userCredential.user.email || '');
      
      // Guardar datos para mantener la sesión
      await saveUserSession(userCredential.user);
      
      console.log("Login exitoso:", userCredential.user.email);
      
      // Navegación a la pantalla principal con una pequeña espera
      // para asegurar que todo se ha guardado correctamente
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      
    } catch (error: any) {
      console.error("Error en login:", error);
      
      // Mensajes de error más específicos para mejorar la experiencia de usuario
      let errorMessage = "Credenciales inválidas, por favor intenta nuevamente";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No existe una cuenta con este correo electrónico";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "La contraseña es incorrecta";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico es inválido";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Demasiados intentos fallidos. Por favor, intenta más tarde";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Navegar a la pantalla de registro
  const navigateToRegister = () => {
    router.push('/auth/Registro');
  };

  // Mostrar indicador de carga mientras se comprueba la sesión
  if (checkingSession) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Comprobando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Text style={styles.subtitle}>Bienvenido a My Pet Care</Text>
      
      
      
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={navigateToRegister}>
          <Text style={styles.registerLink}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  centered: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#555',
  },
  registerLink: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});