import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../../config/firebase';
import { createMedicationSchedule, showMedicationCalendarOptions } from '../../../services/googleCalendar';
import { addMedicamento, getMascotas, type Mascota, type Medicamento } from '../../../services/pets';

export default function MedicamentosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [notas, setNotas] = useState('');
  
  // Estados de UI
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMascota = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) return;
        
        const mascotas = await getMascotas(user.uid);
        const found = mascotas.find(m => m.id === id);
        setMascota(found || null);
        
        // Establecer fecha de fin por defecto (7 días después)
        const finDefault = new Date();
        finDefault.setDate(finDefault.getDate() + 7);
        setFechaFin(finDefault);
      } catch (error) {
        console.error('Error loading mascota:', error);
      }
    };
    
    loadMascota();
  }, [id]);

  const handleSave = async () => {
    if (!mascota || !nombre || !dosis || !frecuencia) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (fechaFin <= fechaInicio) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setLoading(true);
    try {
      const medicamentoData: Omit<Medicamento, 'id'> = {
        mascotaId: mascota.id,
        nombre,
        dosis,
        frecuencia,
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        estado: 'activo',
        notas,
      };

      await addMedicamento(medicamentoData);

      const duracion = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));

      // Crear eventos de calendario para el medicamento
      const calendarEvents = createMedicationSchedule(
        mascota.nombre,
        nombre,
        dosis,
        frecuencia,
        fechaInicio,
        fechaFin
      );

      Alert.alert(
        '¡Medicamento Registrado! 💊',
        `Medicamento registrado para ${mascota.nombre}:\n\n💊 ${nombre}\n📏 ${dosis}\n⏰ ${getFrecuenciaDisplayText(frecuencia)}\n📅 Duración: ${duracion} días\n🔔 ${calendarEvents.length} recordatorios creados`,
        [
          {
            text: '📅 Agregar Recordatorios al Calendario',
            onPress: () => {
              showMedicationCalendarOptions(calendarEvents);
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
      Alert.alert('Error', 'No se pudo registrar el medicamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChangeInicio = (event: any, selectedDate?: Date) => {
    setShowDatePickerInicio(false);
    if (selectedDate) {
      setFechaInicio(selectedDate);
    }
  };

  const onDateChangeFin = (event: any, selectedDate?: Date) => {
    setShowDatePickerFin(false);
    if (selectedDate) {
      setFechaFin(selectedDate);
    }
  };

  // Función auxiliar para mostrar la frecuencia de forma legible
  const getFrecuenciaDisplayText = (freq: string) => {
    switch (freq) {
      case 'cada_8_horas': return 'Cada 8 horas';
      case 'cada_12_horas': return 'Cada 12 horas';
      case 'diario': return 'Una vez al día';
      case 'cada_2_dias': return 'Cada 2 días';
      case 'semanal': return 'Una vez por semana';
      case 'segun_necesidad': return 'Según necesidad';
      default: return freq;
    }
  };

  if (!mascota) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💊 Medicamentos de {mascota.nombre}</Text>
        <Text style={styles.subtitle}>Registra medicamentos para no olvidar las dosis</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💊 Información del Medicamento</Text>
        
        <Text style={styles.label}>Nombre del Medicamento *</Text>
        <TextInput
          placeholder="Ej: Amoxicilina, Ibuprofeno..."
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />

        <Text style={styles.label}>Dosis *</Text>
        <TextInput
          placeholder="Ej: 250mg, 1 tableta, 5ml..."
          value={dosis}
          onChangeText={setDosis}
          style={styles.input}
        />

        <Text style={styles.label}>Frecuencia *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={frecuencia}
            onValueChange={(itemValue) => setFrecuencia(itemValue)}
          >
            <Picker.Item label="Selecciona frecuencia..." value="" />
            <Picker.Item label="🕐 Cada 8 horas" value="cada_8_horas" />
            <Picker.Item label="🕛 Cada 12 horas" value="cada_12_horas" />
            <Picker.Item label="📅 Una vez al día" value="diario" />
            <Picker.Item label="📅 Cada 2 días" value="cada_2_dias" />
            <Picker.Item label="📅 Una vez por semana" value="semanal" />
            <Picker.Item label="💊 Según necesidad" value="segun_necesidad" />
          </Picker>
        </View>

        <Text style={styles.label}>📅 Fecha de Inicio *</Text>
        <Button
          title={`${fechaInicio.toLocaleDateString()}`}
          onPress={() => setShowDatePickerInicio(true)}
        />
        {showDatePickerInicio && (
          <DateTimePicker
            value={fechaInicio}
            mode="date"
            display="default"
            onChange={onDateChangeInicio}
          />
        )}

        <Text style={styles.label}>📅 Fecha de Fin *</Text>
        <Button
          title={`${fechaFin.toLocaleDateString()}`}
          onPress={() => setShowDatePickerFin(true)}
        />
        {showDatePickerFin && (
          <DateTimePicker
            value={fechaFin}
            mode="date"
            display="default"
            onChange={onDateChangeFin}
            minimumDate={fechaInicio}
          />
        )}

        <Text style={styles.label}>📝 Notas adicionales</Text>
        <TextInput
          placeholder="Instrucciones especiales, efectos secundarios observados..."
          value={notas}
          onChangeText={setNotas}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Consejos para Medicamentos:</Text>
        <Text style={styles.tipText}>• Sigue siempre las indicaciones del veterinario</Text>
        <Text style={styles.tipText}>• Completa el tratamiento aunque mejore</Text>
        <Text style={styles.tipText}>• Observa efectos secundarios</Text>
        <Text style={styles.tipText}>• Configura alarmas para no olvidar dosis</Text>
        <Text style={styles.tipText}>• Nunca automediques a tu mascota</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Guardando..." : "💊 Registrar Medicamento"}
          onPress={handleSave}
          disabled={loading}
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
  },
  header: {
    backgroundColor: '#9C27B0',
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
  tipSection: {
    backgroundColor: '#F3E5F5',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6A1B9A',
    marginBottom: 4,
  },
  buttonContainer: {
    margin: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});