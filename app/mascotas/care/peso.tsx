import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryScatter, VictoryTheme } from 'victory';
import { auth } from '../../../config/firebase';
import { addRegistroPeso, getMascotas, getRegistrosPeso, type Mascota, type RegistroPeso } from '../../../services/pets';

export default function RegistroPesoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  
  // Estados del formulario
  const [peso, setPeso] = useState('');
  const [fecha, setFecha] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);

  // Cargar mascota y registros de peso
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const user = auth.currentUser;
        if (!user || !id) return;
        
        // Cargar información de la mascota
        const mascotas = await getMascotas(user.uid);
        const found = mascotas.find(m => m.id === id);
        setMascota(found || null);
        
        // Establecer fecha actual por defecto
        const today = new Date().toISOString().split('T')[0];
        setFecha(today);
        
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
        setLoadingData(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleSave = async () => {
    if (!mascota || !peso || !fecha) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (isNaN(parseFloat(peso)) || parseFloat(peso) <= 0) {
      Alert.alert('Error', 'El peso debe ser un número positivo');
      return;
    }

    setLoading(true);
    try {
      const pesoData = {
        mascotaId: mascota.id,
        fecha,
        peso: parseFloat(peso),
        notas,
      };

      await addRegistroPeso(pesoData);
      
      // Actualizar la lista de registros
      const nuevosRegistros = [...registrosPeso, { ...pesoData, id: Date.now().toString() }];
      setRegistrosPeso(nuevosRegistros.sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      ));

      // Limpiar formulario
      setPeso('');
      setNotas('');

      Alert.alert(
        'Peso Registrado',
        `Se ha registrado el peso de ${mascota.nombre}: ${peso} kg`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar el registro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatear datos para el gráfico
  const chartData = registrosPeso.map(registro => ({
    x: new Date(registro.fecha),
    y: registro.peso
  }));

  if (loadingData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (!mascota) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>No se encontró la mascota</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Control de Peso: {mascota.nombre}</Text>
        <Text style={styles.subtitle}>Mantén un registro del peso para un mejor seguimiento de la salud</Text>
      </View>

      {/* Sección del gráfico */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>📊 Evolución del Peso</Text>
        
        {chartData.length > 1 ? (
          <View style={styles.chartContainer}>
            <VictoryChart 
              theme={VictoryTheme.material}
              width={350}
              height={250}
              padding={{ top: 10, bottom: 40, left: 50, right: 20 }}
              scale={{ x: "time" }}
            >
              <VictoryAxis
                tickFormat={(date) => `${date.getDate()}/${date.getMonth()+1}`}
                label="Fecha"
                style={{
                  axisLabel: { padding: 30 }
                }}
              />
              <VictoryAxis
                dependentAxis
                label="Peso (kg)"
                style={{
                  axisLabel: { padding: 35 }
                }}
              />
              <VictoryLine
                data={chartData}
                style={{
                  data: { stroke: "#FF9800", strokeWidth: 2 }
                }}
              />
              <VictoryScatter
                data={chartData}
                size={5}
                style={{
                  data: { fill: "#E65100" }
                }}
              />
            </VictoryChart>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {chartData.length === 0 
                ? "No hay registros de peso para mostrar"
                : "Se necesitan al menos 2 registros para generar el gráfico"}
            </Text>
          </View>
        )}
      </View>

      {/* Formulario de registro */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Nuevo Registro</Text>
        
        <Text style={styles.label}>⚖️ Peso (kg) *</Text>
        <TextInput
          placeholder="Ej: 12.5"
          value={peso}
          onChangeText={setPeso}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>📅 Fecha *</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={fecha}
          onChangeText={setFecha}
          style={styles.input}
        />

        <Text style={styles.label}>📝 Notas adicionales</Text>
        <TextInput
          placeholder="Observaciones, cambios en la dieta..."
          value={notas}
          onChangeText={setNotas}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Tabla de registros recientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Registros Recientes</Text>
        
        {registrosPeso.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.dateColumn]}>Fecha</Text>
              <Text style={[styles.tableHeaderText, styles.weightColumn]}>Peso</Text>
              <Text style={[styles.tableHeaderText, styles.notesColumn]}>Notas</Text>
            </View>
            
            {registrosPeso.slice().reverse().slice(0, 5).map((registro, index) => (
              <View key={registro.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.dateColumn]}>{registro.fecha}</Text>
                <Text style={[styles.tableCell, styles.weightColumn]}>{registro.peso} kg</Text>
                <Text style={[styles.tableCell, styles.notesColumn]} numberOfLines={1} ellipsizeMode="tail">
                  {registro.notas || '-'}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No hay registros previos</Text>
        )}
      </View>

      {/* Consejos */}
      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Consejos:</Text>
        <Text style={styles.tipText}>• Pesa a tu mascota siempre a la misma hora del día</Text>
        <Text style={styles.tipText}>• Usa la misma báscula para mayor precisión</Text>
        <Text style={styles.tipText}>• Los cambios drásticos de peso pueden indicar problemas de salud</Text>
        <Text style={styles.tipText}>• Consulta con el veterinario si notas cambios significativos</Text>
      </View>

      {/* Botones */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Guardando..." : "💾 Guardar Registro"}
          onPress={handleSave}
          disabled={loading}
          color="#FF9800"
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="Volver"
          onPress={() => router.back()}
          color="#666"
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
    backgroundColor: '#FF9800',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  chartSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#FF9800',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  tableCell: {
    color: '#333',
  },
  dateColumn: {
    flex: 2,
  },
  weightColumn: {
    flex: 1,
    textAlign: 'center',
  },
  notesColumn: {
    flex: 3,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tipSection: {
    backgroundColor: '#FFF3E0',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
  },
  buttonContainer: {
    margin: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});