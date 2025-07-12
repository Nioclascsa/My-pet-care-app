import { FontAwesome5, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { EventoDashboard, getMascotas, getProximosEventos, Mascota } from '../../services/pets';


export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [proximosEventos, setProximosEventos] = useState<EventoDashboard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const loadDashboardData = async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const user = auth.currentUser;
      if (!user) {
        router.replace('/auth/Login');
        return;
      }

      // Cargar datos de mascotas
      const mascotasData = await getMascotas(user.uid);
      setMascotas(mascotasData);

      // Cargar eventos próximos para todas las mascotas
      const eventosPromises = mascotasData.map(mascota => {
        return getProximosEventos(mascota.id)
          .catch(error => {
            console.warn(`Error obteniendo eventos para mascota ${mascota.nombre}:`, error);
            return []; // Devolver array vacío en caso de error
          });
      });
      
      const todosEventos = await Promise.all(eventosPromises);
      
      //  ordenar eventos por fecha
      const eventosAplanados = todosEventos
        .flat()
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      
      setProximosEventos(eventosAplanados);
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // Recargar al volver a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
      return () => {};
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  // Función para renderizar un evento
  const renderEvento = ({ item }: { item: EventoDashboard }) => (
    <TouchableOpacity 
      style={styles.eventoItem}
      onPress={() => {
        if (item.tipo === 'cita') {
          router.push(`/mascotas/care/citas/detalle?id=${item.id}`);
        } else if (item.tipo === 'medicacion') {
          router.push(`/mascotas/care/medicamentos/detalle?id=${item.id}`);
        } else {
          router.push(`/mascotas/detail/${item.mascotaId}`);
        }
      }}
    >
      <View style={[styles.eventoIconContainer, { backgroundColor: getEventoColor(item.tipo) }]}>
        {renderEventoIcon(item.tipo)}
      </View>
      <View style={styles.eventoInfo}>
        <Text style={styles.eventoTitulo}>{item.titulo}</Text>
        <Text style={styles.eventoDescripcion}>{item.descripcion}</Text>
        <View style={styles.eventoDetalles}>
          <Text style={styles.eventoFecha}>{formatDate(item.fecha)}</Text>
          <Text style={styles.eventoMascota}>{item.mascotaNombre}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  const renderEventoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cita':
        return <FontAwesome5 name="hospital" size={18} color="white" />;
      case 'vacuna':
        return <MaterialCommunityIcons name="needle" size={22} color="white" />;
      case 'desparasitacion':
        return <MaterialCommunityIcons name="bug" size={22} color="white" />;
      case 'medicacion':
        return <MaterialIcons name="medication" size={22} color="white" />;
      default:
        return <SimpleLineIcons name="calendar" size={18} color="white" />;
    }
  };

  // Función para determinar el color según el tipo de evento
  const getEventoColor = (tipo: string) => {
    switch (tipo) {
      case 'cita':
        return '#2196F3'; // Azul
      case 'vacuna':
        return '#4CAF50'; // Verde
      case 'desparasitacion':
        return '#FF9800'; // Naranja
      case 'medicacion':
        return '#F44336'; // Rojo
      default:
        return '#9C27B0'; // Púrpura
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Si la fecha es hoy
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si la fecha es mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Mañana, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Para otras fechas
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>¡Bienvenido!</Text>
        <Text style={styles.subTitle}>
          {mascotas.length > 0
            ? `Tienes ${mascotas.length} mascota${mascotas.length !== 1 ? 's' : ''} registrada${mascotas.length !== 1 ? 's' : ''}`
            : 'Añade tu primera mascota para comenzar'}
        </Text>
      </View>

      {mascotas.length === 0 ? (
        <View style={styles.noMascotasContainer}>
          <MaterialCommunityIcons name="paw" size={60} color="#cccccc" />
          <Text style={styles.noMascotasText}>No tienes mascotas registradas</Text>
          <TouchableOpacity 
            style={styles.addMascotaButton}
            onPress={() => router.push('/mascotas/addPet')}
          >
            <Text style={styles.addMascotaButtonText}>Añadir Mascota</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>📋 Próximos eventos</Text>
          
          <FlatList
            data={proximosEventos}
            renderItem={renderEvento}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.eventosContainer}
            ListEmptyComponent={(
              <View style={styles.noEventosContainer}>
                <Text style={styles.noEventosText}>No hay eventos próximos</Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadDashboardData(true)}
                colors={["#2196F3"]}
                tintColor="#2196F3"
              />
            }
          />

          <View style={styles.accionesContainer}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            
            <View style={styles.accionesGrid}>
              <TouchableOpacity 
                style={styles.accionItem}
                onPress={() => router.push('/mascotas/addPet')}
              >
                <View style={[styles.accionIconContainer, { backgroundColor: '#4CAF50' }]}>
                  <MaterialIcons name="pets" size={24} color="white" />
                </View>
                <Text style={styles.accionText}>Añadir Mascota</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.accionItem}
                onPress={() => router.push('/mascotas/seleccionar')}
              >
                <View style={[styles.accionIconContainer, { backgroundColor: '#2196F3' }]}>
                  <MaterialIcons name="calendar-today" size={24} color="white" />
                </View>
                <Text style={styles.accionText}>Agendar Cita</Text>
              </TouchableOpacity>
              
             
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingBottom: 30,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subTitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    color: '#333',
  },
  eventosContainer: {
    paddingHorizontal: 20,
  },
  eventoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  eventoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventoDescripcion: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  eventoDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  eventoFecha: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  eventoMascota: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  noEventosContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  noEventosText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  noMascotasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMascotasText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  addMascotaButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMascotaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  accionesContainer: {
    padding: 20,
  },
  accionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  accionItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  accionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  accionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});