import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../../config/firebase';
import { createVetAppointmentEvent, showCalendarOptions } from '../../../services/googleCalendar';
import { addCitaMedica, getMascotas, type CitaMedica, type Mascota } from '../../../services/pets';

export default function AgendarCitaScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  
  console.log('🔍 Parámetros recibidos:', params);
  console.log('🔍 ID extraído:', id);
  
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [tipo, setTipo] = useState<CitaMedica['tipo']>('revision');
  const [veterinario, setVeterinario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  
  // Estados de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadMascota = async () => {
      console.log('🔍 Cargando mascota con ID:', id);
      console.log('🔍 Tipo de ID:', typeof id);
      
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('❌ No hay usuario autenticado');
          setLoading(false);
          return;
        }
        
        if (!id || id === 'undefined') {
          console.log('❌ No hay ID de mascota válido');
          Alert.alert('Error', 'No se recibió el ID de la mascota');
          setLoading(false);
          return;
        }
        
        console.log('📡 Obteniendo mascotas del usuario:', user.uid);
        const mascotas = await getMascotas(user.uid);
        console.log('✅ Mascotas obtenidas:', mascotas.length);
        console.log('🔍 IDs de mascotas:', mascotas.map(m => m.id));
        
        const found = mascotas.find(m => m.id === id);
        console.log('🎯 Mascota encontrada:', found ? found.nombre : 'No encontrada');
        
        setMascota(found || null);
        
        // Pre-llenar veterinario si la mascota tiene uno asignado
        if (found?.veterinario) {
          setVeterinario(found.veterinario);
        }
      } catch (error) {
        console.error('❌ Error loading mascota:', error);
        Alert.alert('Error', 'No se pudo cargar la información de la mascota');
      } finally {
        console.log('✅ Carga completada');
        setLoading(false);
      }
    };
    
    loadMascota();
  }, [id]);

  const handleSave = async () => {
    if (!mascota || !veterinario || !motivo) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      // Combinar fecha y hora
      const fechaCita = new Date(fecha);
      fechaCita.setHours(hora.getHours(), hora.getMinutes(), 0, 0);

      // Validar que la fecha sea futura
      if (fechaCita <= new Date()) {
        Alert.alert('Error', 'La fecha de la cita debe ser futura');
        setSaving(false);
        return;
      }

      const citaData: Omit<CitaMedica, 'id'> = {
        mascotaId: mascota.id,
        fecha: fechaCita.toISOString().split('T')[0],
        hora: fechaCita.toTimeString().split(' ')[0].substring(0, 5),
        tipo,
        veterinario,
        motivo,
        estado: 'programada',
        notas,
      };

      console.log('💾 Guardando cita:', citaData);
      await addCitaMedica(citaData);

      // Crear evento para Google Calendar
      const calendarEvent = createVetAppointmentEvent(
        mascota.nombre,
        tipo,
        fechaCita,
        veterinario,
        motivo,
        notas
      );

      // Mostrar mensaje de éxito con opción de calendario
      Alert.alert(
        '¡Cita Programada! 📅',
        `Recordatorio creado para ${mascota.nombre}:\n\n📅 ${fechaCita.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}\n🕐 ${fechaCita.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}\n🏥 ${veterinario}\n📝 ${motivo}`,
        [
          {
            text: '📅 Agregar al Calendario',
            onPress: () => {
              showCalendarOptions(calendarEvent);
              // No hacemos router.back() aquí para que puedan agregar al calendario
            }
          },
          {
            text: 'Solo Guardar',
            onPress: () => router.back(),
            style: 'cancel'
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Error guardando cita:', error);
      Alert.alert('Error', 'No se pudo guardar el recordatorio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setHora(selectedTime);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando mascota...</Text>
        <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
          ID: {id}
        </Text>
      </View>
    );
  }

  if (!mascota) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>❌ Mascota no encontrada</Text>
        <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
          ID buscado: {id}
        </Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐾 Recordatorio para {mascota.nombre}</Text>
        <Text style={styles.subtitle}>Crea un recordatorio para no olvidar las citas importantes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Información del Recordatorio</Text>
        
        <Text style={styles.label}>Tipo de Cita *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tipo}
            onValueChange={(itemValue) => setTipo(itemValue)}
          >
            <Picker.Item label="🩺 Revisión General" value="revision" />
            <Picker.Item label="💉 Vacunación" value="vacuna" />
            <Picker.Item label="🐛 Desparasitación" value="desparasitacion" />
            <Picker.Item label="🚨 Emergencia" value="emergencia" />
            <Picker.Item label="🔬 Exámenes" value="otro" />
          </Picker>
        </View>

        <Text style={styles.label}>📅 Fecha *</Text>
        <Button
          title={`${fecha.toLocaleDateString()}`}
          onPress={() => setShowDatePicker(true)}
        />
        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.label}>🕐 Hora *</Text>
        <Button
          title={`${hora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
          onPress={() => setShowTimePicker(true)}
        />
        {showTimePicker && (
          <DateTimePicker
            value={hora}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Text style={styles.label}>🏥 Veterinario/Clínica *</Text>
        <TextInput
          placeholder="Nombre del veterinario o clínica"
          value={veterinario}
          onChangeText={setVeterinario}
          style={styles.input}
        />

        <Text style={styles.label}>📝 Motivo de la cita *</Text>
        <TextInput
          placeholder="Ej: Vacuna anual, control de peso, etc."
          value={motivo}
          onChangeText={setMotivo}
          style={styles.input}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>📄 Notas adicionales</Text>
        <TextInput
          placeholder="Recordatorios especiales, preguntas para el vet, etc."
          value={notas}
          onChangeText={setNotas}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Recordatorio Inteligente:</Text>
        <Text style={styles.tipText}>• Al guardar, podrás agregar la cita directamente a Google Calendar</Text>
        <Text style={styles.tipText}>• Se creará un evento con todos los detalles</Text>
        <Text style={styles.tipText}>• Recibirás notificaciones automáticas de Google</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={saving ? "Guardando..." : "💾 Guardar Recordatorio"}
          onPress={handleSave}
          disabled={saving}
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="Cancelar"
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
    padding: 20,
  },
  header: {
    backgroundColor: '#4CAF50',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    margin: 20,
  },
  buttonSpacing: {
    height: 10,
  },
  tipSection: {
    backgroundColor: '#E8F5E8',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
});