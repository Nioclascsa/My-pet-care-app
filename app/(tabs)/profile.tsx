import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../config/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar datos guardados en AsyncStorage
              await AsyncStorage.removeItem('auth_user');
              await AsyncStorage.removeItem('user_email');
              await AsyncStorage.removeItem('user_data');
              
              // Cerrar sesión en Firebase
              await signOut(auth);
              console.log('Sesión cerrada correctamente');
              
              // Usar la ruta correcta
              router.replace('/auth/Login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#2196F3" />
        </View>
        <Text style={styles.userName}>
          {user?.email?.split('@')[0] || 'Usuario'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#666" />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.infoText}>
            Miembro desde: {user?.metadata.creationTime ? 
              new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <Button 
          title="Cambiar Contraseña" 
          onPress={() => Alert.alert('Próximamente', 'Función en desarrollo')}
          color="#2196F3"
        />
      </View>

      <View style={styles.logoutSection}>
        <Button 
          title="Cerrar Sesión" 
          onPress={handleLogout} 
          color="#ff6b6b" 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  logoutSection: {
    margin: 20,
    marginTop: 40,
  },
});