import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase';
import { getMascotas, Mascota } from '../../services/pets';
import { MaterialIcons } from '@expo/vector-icons';

export default function SeleccionarMascotaScreen() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadMascotas = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'No hay sesión activa');
          router.replace('/auth/Login');
          return;
        }

        const mascotasData = await getMascotas(user.uid);
        setMascotas(mascotasData);
      } catch (error) {
        console.error('Error cargando mascotas:', error);
        Alert.alert('Error', 'No se pudieron cargar las mascotas');
      } finally {
        setLoading(false);
      }
    };

    loadMascotas();
  }, []);

  const handleMascotaSelect = (mascota: Mascota) => {
    router.push(`/mascotas/care/citas?id=${mascota.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
      </View>
    );
  }

  if (mascotas.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="pets" size={60} color="#cccccc" />
        <Text style={styles.noMascotas}>No tienes mascotas registradas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/mascotas/addPet')}
        >
          <Text style={styles.addButtonText}>Añadir Mascota</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una mascota</Text>
      <Text style={styles.subtitle}>Para agendar una cita médica</Text>
      
      <FlatList
        data={mascotas}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.mascotaItem} 
            onPress={() => handleMascotaSelect(item)}
          >
            <View style={styles.mascotaInfo}>
              <Text style={styles.mascotaNombre}>{item.nombre}</Text>
              <Text style={styles.mascotaTipo}>{item.especie} {item.raza ? `- ${item.raza}` : ''}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#2196F3" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  mascotaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  mascotaInfo: {
    flex: 1,
  },
  mascotaNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mascotaTipo: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  noMascotas: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});