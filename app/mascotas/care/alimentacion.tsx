import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../../../config/firebase';
import { addActividadAlimentacion, getMascotas, type ActividadAlimentacion, type Mascota } from '../../../services/pets';

export default function RegistroAlimentacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  
  // Estados del formulario
  const [tipoComida, setTipoComida] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMascota = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) return;
        
        const mascotas = await getMascotas(user.uid);
        const found = mascotas.find(m => m.id === id);
        setMascota(found || null);
        
        // Establecer hora actual por defecto
        const now = new Date();
        setHora(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      } catch (error) {
        console.error('Error loading mascota:', error);
      }
    };
    
    loadMascota();
  }, [id]);

  const handleSave = async () => {
    if (!mascota || !tipoComida || !cantidad || !hora) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const alimentacionData: Omit<ActividadAlimentacion, 'id'> = {
        mascotaId: mascota.id,
        fecha: new Date().toISOString().split('T')[0],
        hora,
        tipoComida,
        cantidad,
        notas,
      };

      await addActividadAlimentacion(alimentacionData);

      Alert.alert(
        '¡Alimentación Registrada! 🍽️',
        `Se registró la comida de ${mascota.nombre}:\n\n🕐 ${hora}\n🥘 ${tipoComida}\n📏 ${cantidad}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo registrar la alimentación: ' + error.message);
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>🍽️ Alimentación de {mascota.nombre}</Text>
        <Text style={styles.subtitle}>Registra las comidas para llevar un control saludable</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Registro de Comida</Text>
        
        <Text style={styles.label}>🥘 Tipo de Comida *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tipoComida}
            onValueChange={(itemValue) => setTipoComida(itemValue)}
          >
            <Picker.Item label="Selecciona un tipo..." value="" />
            <Picker.Item label="🥩 Comida seca (pienso)" value="comida_seca" />
            <Picker.Item label="🥫 Comida húmeda (lata)" value="comida_humeda" />
            <Picker.Item label="🍖 Comida casera" value="comida_casera" />
            <Picker.Item label="🦴 Snacks/Premios" value="snacks" />
            <Picker.Item label="🥛 Leche/Líquidos" value="liquidos" />
            <Picker.Item label="🍎 Frutas/Verduras" value="frutas_verduras" />
          </Picker>
        </View>

        <Text style={styles.label}>📏 Cantidad *</Text>
        <TextInput
          placeholder="Ej: 100g, 1/2 taza, 1 lata..."
          value={cantidad}
          onChangeText={setCantidad}
          style={styles.input}
        />

        <Text style={styles.label}>🕐 Hora *</Text>
        <TextInput
          placeholder="HH:MM"
          value={hora}
          onChangeText={setHora}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>📝 Notas adicionales</Text>
        <TextInput
          placeholder="Comportamiento, apetito, reacciones..."
          value={notas}
          onChangeText={setNotas}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Consejos de Alimentación:</Text>
        <Text style={styles.tipText}>• Mantén horarios regulares de comida</Text>
        <Text style={styles.tipText}>• Controla las porciones según el peso</Text>
        <Text style={styles.tipText}>• Agua fresca siempre disponible</Text>
        <Text style={styles.tipText}>• Evita dar comida humana sin consultar</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Guardando..." : "📝 Registrar Alimentación"}
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