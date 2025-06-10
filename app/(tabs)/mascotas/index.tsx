import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../../config/firebase';
import { deleteMascota, getMascotas, type Mascota } from '../../../services/pets';

export default function MascotasScreen() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
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
    }, [])
  );

  const handleMascotaPress = (mascotaId: string) => {
    router.push({
      pathname: "/mascotas/detail/[id]",
      params: { id: mascotaId }
    });
  };

  const handleDelete = async (mascota: Mascota) => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro de que quieres eliminar a ${mascota.nombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMascota(mascota.id);
              fetchData(); // Recargar lista después de eliminar
              Alert.alert('Éxito', `${mascota.nombre} ha sido eliminado`);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la mascota');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 Mis Mascotas</Text>
        <Text style={styles.headerSubtitle}>
          {mascotas.length === 0 ? 'No tienes mascotas registradas' : `${mascotas.length} mascota${mascotas.length > 1 ? 's' : ''} registrada${mascotas.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={styles.addButtonContainer}>
        <Button
          title="➕ Agregar Nueva Mascota"
          onPress={() => router.push('/(tabs)/mascotas/addPet')}
          color="#4CAF50"
        />
      </View>

      {mascotas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>¡Agrega tu primera mascota! 🐶🐱</Text>
          <Text style={styles.emptyStateText}>
            Comienza registrando a tu compañero peludo para llevar un control completo de su cuidado.
          </Text>
        </View>
      ) : (
        <FlatList
          data={mascotas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleMascotaPress(item.id)}
              style={styles.mascotaItem}
            >
              <View style={styles.item}>
                <View style={styles.mascotaInfo}>
                  <Text style={styles.name}>🐾 {item.nombre}</Text>
                  <Text style={styles.details}>
                    {item.especie} {item.raza ? `• ${item.raza}` : ''} 
                  </Text>
                  <Text style={styles.details}>
                    Peso: {item.peso ? `${item.peso}kg` : 'No registrado'}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <View style={styles.actionButton}>
                    <Button
                      title="Ver"
                      onPress={() => handleMascotaPress(item.id)}
                      color="#2196F3"
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Editar"
                      onPress={() => router.push({
                        pathname: "/mascotas/edit/[id]",
                        params: { id: item.id }
                      })}
                      color="#FF9800"
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Eliminar"
                      onPress={() => handleDelete(item)}
                      color="#F44336"
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshing={loading}
          onRefresh={fetchData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  addButtonContainer: {
    margin: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  item: { 
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mascotaInfo: {
    marginBottom: 10,
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  details: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 2,
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  mascotaItem: {},
});