import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ImagePicker from '../../../components/ImagePicker';
import { auth } from '../../../config/firebase';
import { getMascotas, getRegistrosPeso, updateMascota, type Mascota, type RegistroPeso } from '../../../services/pets';

export default function MascotaDetailScreen() {
  const params = useLocalSearchParams<{ id: string; updated?: string }>();
  const { id, updated } = params;
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);
  const [loadingPeso, setLoadingPeso] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingImage, setEditingImage] = useState(false);

  // Función para cargar datos
  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const user = auth.currentUser;
      if (!user || !id) return;
      
      // Cargar datos de la mascota
      const mascotas = await getMascotas(user.uid);
      const found = mascotas.find(m => m.id === id);
      setMascota(found || null);
      
      // Cargar registros de peso
      if (found) {
        const registros = await getRegistrosPeso(found.id);
        setRegistrosPeso(registros.sort((a, b) => 
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
      setLoadingPeso(false);
      setIsRefreshing(false);
    }
  };

  // useEffect para carga inicial
  useEffect(() => {
    if (id) {
      console.log('Cargando datos de mascota con ID:', id);
      loadData();
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`Pantalla de detalle enfocada, id: ${id}, updated: ${updated}`);
      console.log('Datos actuales de mascota:', mascota);
      loadData();
      return () => {};
    }, [id, updated])
  );

  // Función para manejar la actualización de imagen
  const handleImageSelected = async (url: string) => {
    if (!mascota || !id) return;
    
    try {
      // Actualizar la mascota con la nueva imagen en Firebase
      await updateMascota(id, {
        ...mascota,
        imagen: url
      });
      
      // Actualizar el estado local
      setMascota({
        ...mascota,
        imagen: url
      });
      
      // Salir del modo de edición
      setEditingImage(false);
      
      // Opcional: mostrar confirmación
      Alert.alert('Éxito', 'Foto actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar la foto:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto');
    }
  };

  const calcularEdad = (fechaNacimiento: string | undefined) => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const años = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    
    if (años > 0) {
      return `${años} año${años > 1 ? 's' : ''}`;
    } else {
      return `${meses} mes${meses !== 1 ? 'es' : ''}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return dateString;
      }
      
      // Opciones de formato localizadas
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString('es-ES', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Devolver el string original en caso de error
    }
  };

  // Calcular estadísticas del peso
  const calculateWeightStats = () => {
    if (registrosPeso.length < 2) {
      return null;
    }

    const pesos = registrosPeso.map(r => r.peso);
    const pesoMinimo = Math.min(...pesos);
    const pesoMaximo = Math.max(...pesos);
    const pesoPromedio = pesos.reduce((sum, peso) => sum + peso, 0) / pesos.length;
    
    // Tendencia (comparar últimos 3 vs anteriores)
    let tendencia = 'Estable';
    if (pesos.length >= 6) {
      const ultimosTres = pesos.slice(-3);
      const anterioresTres = pesos.slice(-6, -3);
      const promedioUltimos = ultimosTres.reduce((sum, peso) => sum + peso, 0) / ultimosTres.length;
      const promedioAnteriores = anterioresTres.reduce((sum, peso) => sum + peso, 0) / anterioresTres.length;
      
      if (promedioUltimos > promedioAnteriores + 0.5) {
        tendencia = 'Aumentando';
      } else if (promedioUltimos < promedioAnteriores - 0.5) {
        tendencia = 'Disminuyendo';
      }
    }

    return {
      minimo: pesoMinimo,
      maximo: pesoMaximo,
      promedio: pesoPromedio,
      tendencia,
      registros: pesos.length
    };
  };

  const stats = calculateWeightStats();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (!mascota) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Mascota no encontrada</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadData(true)}
          colors={["#2196F3"]}
          tintColor="#2196F3"
        />
      }
    >
      <View style={styles.header}>
        {/* Sección de la foto */}
        {editingImage ? (
          <View style={styles.imagePickerContainer}>
            <ImagePicker 
              defaultImage={mascota.imagen}
              onImageSelected={handleImageSelected}
              mascotaId={mascota.id}
              size={120}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={() => setEditingImage(true)}
          >
            {mascota.imagen ? (
              <Image 
                source={{ uri: mascota.imagen }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.noImageContainer}>
                <MaterialIcons name="pets" size={50} color="white" />
              </View>
            )}
            <View style={styles.editImageButton}>
              <MaterialIcons name="edit" size={16} color="white" />
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.name}>{mascota.nombre}</Text>
        <Text style={styles.species}>{mascota.especie} - {mascota.raza}</Text>
        <Text style={styles.age}>Edad: {calcularEdad(mascota.fechaNacimiento)}</Text>
        <Text style={styles.weight}>Peso: {mascota.peso} kg</Text>
      </View>

    
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Evolución del Peso</Text>
        
       {loadingPeso ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : registrosPeso.length > 1 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: registrosPeso.slice(-6).map(r => {
                  const date = new Date(r.fecha);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }),
                datasets: [
                  {
                    data: registrosPeso.slice(-6).map(r => r.peso),
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    strokeWidth: 2
                  }
                ],
                legend: ["Peso (kg)"]
              }}
              width={Dimensions.get("window").width - 60}
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#f5f9ff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(90, 90, 90, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#2196F3"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <Text style={styles.chartNote}>
              📈 Evolución de los últimos {Math.min(6, registrosPeso.length)} registros
            </Text>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {registrosPeso.length === 0 
                ? "No hay registros de peso"
                : "Se necesitan al menos 2 registros para mostrar el gráfico"}
            </Text>
            <Button 
              title="Añadir Primer Registro" 
              onPress={() => router.push(`/mascotas/care/peso?id=${id}`)}
              color="#2196F3"
            />
          </View>
        )}
      </View>

      {/* Estadísticas del peso */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Estadísticas de Peso</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Registros</Text>
              <Text style={styles.statValue}>{stats.registros}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peso Mín.</Text>
              <Text style={styles.statValue}>{stats.minimo.toFixed(1)} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peso Máx.</Text>
              <Text style={styles.statValue}>{stats.maximo.toFixed(1)} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tendencia</Text>
              <Text style={[
                styles.statValue,
                {
                  color: stats.tendencia === 'Aumentando' ? '#4CAF50' : 
                         stats.tendencia === 'Disminuyendo' ? '#FF5722' : '#2196F3'
                }
              ]}>
                {stats.tendencia === 'Aumentando' ? '📈' : 
                 stats.tendencia === 'Disminuyendo' ? '📉' : '➡️'} {stats.tendencia}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionButtons}>
          <View style={styles.buttonSpacing}>
            <Button
              title="🍽️ Registrar Alimentación"
              onPress={() => router.push(`/mascotas/care/alimentacion?id=${mascota.id}`)}
              color="#2196F3"
            />
          </View>
          <View style={styles.buttonSpacing}>
            <Button
              title="⚖️ Registrar Peso"
              onPress={() => router.push(`/mascotas/care/peso?id=${mascota.id}`)}
              color="#2196F3"
            />
          </View>
          <View style={styles.buttonSpacing}>
            <Button
              title="🏥 Agendar Cita"
              onPress={() => router.push(`/mascotas/care/citas?id=${mascota.id}`)}
              color="#2196F3"
            />
          </View>
          <View style={styles.buttonSpacing}>
            <Button
              title="💊 Medicamentos"
              onPress={() => router.push(`/mascotas/care/medicamentos?id=${mascota.id}`)}
              color="#2196F3"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Veterinaria</Text>
        <Text style={styles.infoText}>Veterinario: {mascota.veterinario || 'No especificado'}</Text>
        <Text style={styles.infoText}>Chip: {mascota.numeroChip || 'No registrado'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Próximas Citas</Text>
        
        {mascota.fechas ? (
          <>
            {mascota.fechas.proximaVacuna ? (
              <View style={styles.appointmentItem}>
                <View style={styles.appointmentIconContainer}>
                  <Text style={styles.appointmentIcon}>💉</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>Vacunación</Text>
                  <Text style={styles.appointmentDate}>
                    {formatDate(mascota.fechas.proximaVacuna)}
                  </Text>
                </View>
              </View>
            ) : null}
            
            {mascota.fechas.proximaDesparasitacion ? (
              <View style={styles.appointmentItem}>
                <View style={styles.appointmentIconContainer}>
                  <Text style={styles.appointmentIcon}>🪱</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>Desparasitación</Text>
                  <Text style={styles.appointmentDate}>
                    {formatDate(mascota.fechas.proximaDesparasitacion)}
                  </Text>
                </View>
              </View>
            ) : null}
            
            {mascota.fechas.proximaRevision ? (
              <View style={styles.appointmentItem}>
                <View style={styles.appointmentIconContainer}>
                  <Text style={styles.appointmentIcon}>🩺</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>Revisión General</Text>
                  <Text style={styles.appointmentDate}>
                    {formatDate(mascota.fechas.proximaRevision)}
                  </Text>
                </View>
              </View>
            ) : null}
            
            {!mascota.fechas.proximaVacuna && !mascota.fechas.proximaDesparasitacion && !mascota.fechas.proximaRevision ? (
              <View style={styles.noAppointmentsContainer}>
                <Text style={styles.noAppointmentsText}>No hay citas próximas programadas</Text>
                <Button
                  title="Agendar Cita"
                  onPress={() => router.push(`/mascotas/care/citas?id=${mascota.id}`)}
                  color="#2196F3"
                />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <Text style={styles.noAppointmentsText}>No hay citas próximas programadas</Text>
            <Button
              title="Agendar Cita"
              onPress={() => router.push(`/mascotas/care/citas?id=${mascota.id}`)}
              color="#2196F3"
            />
          </View>
        )}
      </View>

      <View style={styles.editButton}>
        <Button
          title="Editar Información"
          onPress={() => router.push(`/mascotas/edit/${id}`)}
          color="#2196F3"
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
    alignItems: 'center',
    paddingTop: 40, // Más espacio para la foto
    paddingBottom: 30,
  },
  // Estilos para la imagen de perfil
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1976d2', // Color más oscuro para el fondo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#64b5f6', // Color más claro
  },
  editImageButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  imagePickerContainer: {
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  species: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  age: {
    fontSize: 16,
    color: 'white',
  },
  weight: {
    fontSize: 16,
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  actionButtons: {
    gap: 10,
  },
  buttonSpacing: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  editButton: {
    margin: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chartNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appointmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentIcon: {
    fontSize: 20,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noAppointmentsContainer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 5,
  },
  noAppointmentsText: {
    color: '#666',
    fontSize: 15,
    marginBottom: 10,
    fontStyle: 'italic',
  },
});