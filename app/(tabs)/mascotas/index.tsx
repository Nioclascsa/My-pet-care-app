import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../../config/firebase';
import { deleteMascota, getMascotas, Mascota } from '../../../services/pets';

export default function MascotasScreen() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para ver tus mascotas');
      router.replace('/auth/Login');
      return;
    }

    setLoading(true);
    try {
      const list = await getMascotas(user.uid);
      setMascotas(list);
    } catch (error) {
      console.error('Error fetching mascotas:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para carga inicial
  useEffect(() => { 
    fetchData(); 
  }, []);

  // useFocusEffect para recargar cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      return () => {};
    }, [])
  );

  const handleDelete = async (mascota: Mascota) => {
    Alert.alert(
      "Eliminar Mascota",
      `¿Estás seguro de que deseas eliminar a ${mascota.nombre}? Esta acción eliminará todos los registros asociados como historial de peso, alimentación, citas médicas y medicamentos. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteMascota(mascota.id!);
              
              Alert.alert(
                "Mascota eliminada",
                `${mascota.nombre} y todos sus datos asociados han sido eliminados correctamente.`
              );
              
              // Actualizar la lista de mascotas
              fetchData();
            } catch (error) {
              console.error("Error al eliminar mascota:", error);
              Alert.alert(
                "Error",
                "No se pudo eliminar la mascota. Por favor, inténtalo de nuevo."
              );
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleAddPet = () => {
    router.push('/mascotas/addPet');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Mascotas</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddPet}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {mascotas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="paw" size={50} color="#cccccc" />
          <Text style={styles.emptyText}>
            No tienes mascotas registradas
          </Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={handleAddPet}
          >
            <Text style={styles.addFirstButtonText}>Añadir Mi Primera Mascota</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mascotas}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.mascotaCard}
              onPress={() => router.push(`/mascotas/detail/${item.id}`)}
            >
              <View style={styles.mascotaInfo}>
                <Text style={styles.mascotaName}>{item.nombre}</Text>
                <Text style={styles.mascotaDetails}>
                  {item.especie} {item.raza ? `- ${item.raza}` : ''}
                </Text>
                {item.fechaNacimiento && (
                  <Text style={styles.mascotaAge}>
                    Edad: {calculateAge(item.fechaNacimiento)}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push(`/mascotas/edit/${item.id}`)}
                >
                  <MaterialIcons name="edit" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialIcons name="delete" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const calculateAge = (fechaNacimiento: string) => {
  const birthDate = new Date(fechaNacimiento);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  } else {
    return `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  mascotaCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  mascotaInfo: {
    flex: 1,
  },
  mascotaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mascotaDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  mascotaAge: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
});