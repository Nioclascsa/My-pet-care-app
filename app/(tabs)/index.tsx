import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebase';
import {
  getCitasMedicas,
  getMascotas,
  getMedicamentos,
  type Mascota
} from '../../services/pets';

const { width } = Dimensions.get('window');

export default function HomeTab() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [proximasCitas, setProximasCitas] = useState<any[]>([]);
  const [medicamentosActivos, setMedicamentosActivos] = useState<any[]>([]);
  const [alertasImportantes, setAlertasImportantes] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalMascotas: 0,
    citasProximas: 0,
    medicamentosActivos: 0,
    registrosHoy: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('🔄 Cargando datos del dashboard...');
      
      // Cargar mascotas
      const mascotasList = await getMascotas(user.uid);
      setMascotas(mascotasList);

      // Inicializar arrays
      const todasLasCitas: any[] = [];
      const todosMedicamentos: any[] = [];
      const alertas: any[] = [];
      let registrosHoy = 0;

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      for (const mascota of mascotasList) {
        try {
          // Cargar citas
          const citas = await getCitasMedicas(mascota.id);
          const citasFuturas = citas
            .filter(cita => new Date(cita.fecha) >= hoy)
            .map(cita => ({ 
              ...cita, 
              mascotaNombre: mascota.nombre,
              diasRestantes: Math.ceil((new Date(cita.fecha).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
            }));
          todasLasCitas.push(...citasFuturas);

          // Citas urgentes (mañana o hoy)
          const citasUrgentes = citasFuturas.filter(cita => cita.diasRestantes <= 1);
          citasUrgentes.forEach(cita => {
            alertas.push({
              tipo: 'cita_urgente',
              titulo: cita.diasRestantes === 0 ? '🚨 Cita HOY' : '⚠️ Cita MAÑANA',
              mensaje: `${cita.mascotaNombre} - ${cita.tipo} a las ${cita.hora}`,
              prioridad: cita.diasRestantes === 0 ? 'alta' : 'media'
            });
          });

          // Cargar medicamentos
          const medicamentos = await getMedicamentos(mascota.id);
          const medicamentosActivos = medicamentos
            .filter(med => med.estado === 'activo' && new Date(med.fechaFin) >= hoy)
            .map(med => ({ 
              ...med, 
              mascotaNombre: mascota.nombre,
              diasRestantes: Math.ceil((new Date(med.fechaFin).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
            }));
          todosMedicamentos.push(...medicamentosActivos);

          // Medicamentos que terminan pronto
          const medicamentosTerminando = medicamentosActivos.filter(med => med.diasRestantes <= 3);
          medicamentosTerminando.forEach(med => {
            alertas.push({
              tipo: 'medicamento_terminando',
              titulo: '💊 Medicamento por terminar',
              mensaje: `${med.mascotaNombre} - ${med.nombre} (${med.diasRestantes} días restantes)`,
              prioridad: med.diasRestantes <= 1 ? 'alta' : 'baja'
            });
          });

            // Contar registros de hoy
            // Contar registros de hoy
            // Contar registros de hoy
            try {
              // TODO: Implement getPesoRegistros or remove this functionality
              // const pesoHoy = await getPesoRegistros(mascota.id);
              // const registrosPesoHoy = pesoHoy.filter(reg => 
              //   new Date(reg.fecha).toDateString() === hoy.toDateString()
              // );
              // registrosHoy += registrosPesoHoy.length;
            } catch (error) {
              console.log('No se pudieron cargar algunos registros para', mascota.nombre);
            }
          } catch (error) {
            console.error(`Error cargando datos para ${mascota.nombre}:`, error);
        }
      }

      // Ordenar por fecha más próxima
      todasLasCitas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      todosMedicamentos.sort((a, b) => a.diasRestantes - b.diasRestantes);
      
      // Ordenar alertas por prioridad
      alertas.sort((a, b) => {
        const prioridadOrden: { [key: string]: number } = { alta: 3, media: 2, baja: 1 };
        return (prioridadOrden[b.prioridad] || 0) - (prioridadOrden[a.prioridad] || 0);
      });

      setProximasCitas(todasLasCitas.slice(0, 3));
      setMedicamentosActivos(todosMedicamentos.slice(0, 3));
      setAlertasImportantes(alertas.slice(0, 5));
      
      setEstadisticas({
        totalMascotas: mascotasList.length,
        citasProximas: todasLasCitas.length,
        medicamentosActivos: todosMedicamentos.length,
        registrosHoy
      });

      console.log('✅ Dashboard cargado correctamente');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudieron cargar algunos datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Buenos días';
    if (hour < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return '#FF5722';
      case 'media': return '#FF9800';
      case 'baja': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>🐾 Cargando tu dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header personalizado */}
      <View style={styles.header}>
        <Text style={styles.title}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>
          {auth.currentUser?.email?.split('@')[0] || 'Usuario'}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </Text>
      </View>

      {/* Alertas importantes */}
      {alertasImportantes.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>🚨 Alertas Importantes</Text>
          {alertasImportantes.map((alerta, index) => (
            <View 
              key={index} 
              style={[
                styles.alertCard, 
                { borderLeftColor: getPriorityColor(alerta.prioridad) }
              ]}
            >
              <Text style={styles.alertCardTitle}>{alerta.titulo}</Text>
              <Text style={styles.alertCardMessage}>{alerta.mensaje}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statNumber, { color: '#1976D2' }]}>
            {estadisticas.totalMascotas}
          </Text>
          <Text style={styles.statLabel}>Mascotas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.statNumber, { color: '#388E3C' }]}>
            {estadisticas.citasProximas}
          </Text>
          <Text style={styles.statLabel}>Citas Próximas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statNumber, { color: '#F57C00' }]}>
            {estadisticas.medicamentosActivos}
          </Text>
          <Text style={styles.statLabel}>Medicamentos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Text style={[styles.statNumber, { color: '#7B1FA2' }]}>
            {estadisticas.registrosHoy}
          </Text>
          <Text style={styles.statLabel}>Registros Hoy</Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#E8F5E8' }]}
            onPress={() => router.push('/mascotas/addPet')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Agregar Mascota</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#E3F2FD' }]}
            onPress={() => router.push('/(tabs)/mascotas')}
          >
            <Text style={styles.actionIcon}>🐾</Text>
            <Text style={styles.actionText}>Ver Mascotas</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FFF3E0' }]}
            onPress={() => {
              if (mascotas.length > 0) {
                router.push(`/mascotas/care/citas?id=${mascotas[0].id}`);
              } else {
                Alert.alert('Info', 'Primero agrega una mascota');
              }
            }}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Agendar Cita</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F3E5F5' }]}
            onPress={() => {
              if (mascotas.length > 0) {
                router.push(`/mascotas/care/medicamentos?id=${mascotas[0].id}`);
              } else {
                Alert.alert('Info', 'Primero agrega una mascota');
              }
            }}
          >
            <Text style={styles.actionIcon}>💊</Text>
            <Text style={styles.actionText}>Medicamentos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Próximas citas */}
      {proximasCitas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Próximas Citas</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/mascotas')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {proximasCitas.map((cita, index) => (
            <TouchableOpacity key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{cita.mascotaNombre}</Text>
                <View style={[
                  styles.daysBadge,
                  { backgroundColor: cita.diasRestantes <= 1 ? '#FF5722' : '#4CAF50' }
                ]}>
                  <Text style={styles.daysBadgeText}>
                    {cita.diasRestantes === 0 ? 'HOY' : 
                     cita.diasRestantes === 1 ? 'MAÑANA' : 
                     `${cita.diasRestantes}d`}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{cita.tipo} - {cita.veterinario}</Text>
              <Text style={styles.itemDate}>
                📅 {new Date(cita.fecha).toLocaleDateString()} • 🕐 {cita.hora}
              </Text>
              <Text style={styles.itemDescription}>{cita.motivo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Medicamentos activos */}
      {medicamentosActivos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💊 Medicamentos Activos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/mascotas')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {medicamentosActivos.map((med, index) => (
            <TouchableOpacity key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{med.mascotaNombre}</Text>
                <View style={[
                  styles.daysBadge,
                  { backgroundColor: med.diasRestantes <= 3 ? '#FF9800' : '#4CAF50' }
                ]}>
                  <Text style={styles.daysBadgeText}>{med.diasRestantes}d</Text>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{med.nombre} - {med.dosis}</Text>
              <Text style={styles.itemDate}>
                ⏰ {med.frecuencia} • 📅 Hasta {new Date(med.fechaFin).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Estado vacío */}
      {mascotas.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyTitle}>¡Bienvenido a Pet Care!</Text>
          <Text style={styles.emptySubtitle}>
            Comienza agregando tu primera mascota para llevar un control completo de su cuidado
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/mascotas/addPet')}
          >
            <Text style={styles.primaryButtonText}>➕ Agregar Mi Primera Mascota</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer con tip */}
      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Tip del día:</Text>
        <Text style={styles.tipText}>
          Mantén actualizados los registros diarios para un mejor seguimiento de la salud de tus mascotas
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 25,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  alertSection: {
    margin: 15,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  alertCardMessage: {
    fontSize: 14,
    color: '#555',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 5,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipSection: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});