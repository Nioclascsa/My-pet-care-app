import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { auth } from '../../../config/firebase'; // Cambié de ../../../../ a ../../../
import { getMascotas, updateMascota, type Mascota } from '../../../services/pets';

export default function EditMascotaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [numeroChip, setNumeroChip] = useState('');
  
  // Alertas
  const [alertaVacunas, setAlertaVacunas] = useState(true);
  const [alertaDesparasitacion, setAlertaDesparasitacion] = useState(true);
  const [alertaRevision, setAlertaRevision] = useState(true);
  const [alertaMedicamentos, setAlertaMedicamentos] = useState(true);

  useEffect(() => {
    const loadMascota = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) return;
        
        const mascotas = await getMascotas(user.uid);
        const found = mascotas.find(m => m.id === id);
        
        if (found) {
          setMascota(found);
          // Llenar el formulario con los datos actuales
          setNombre(found.nombre);
          setEspecie(found.especie);
          setRaza(found.raza || '');
          setFechaNacimiento(found.fechaNacimiento || '');
          setPeso(found.peso?.toString() || '');
          setVeterinario(found.veterinario || '');
          setNumeroChip(found.numeroChip || '');
          
          if (found.alertasActivas) {
            setAlertaVacunas(found.alertasActivas.vacunas);
            setAlertaDesparasitacion(found.alertasActivas.desparasitacion);
            setAlertaRevision(found.alertasActivas.revision);
            setAlertaMedicamentos(found.alertasActivas.medicamentos);
          }
        }
      } catch (error) {
        console.error('Error loading mascota:', error);
        Alert.alert('Error', 'No se pudo cargar la información de la mascota');
      } finally {
        setLoading(false);
      }
    };
    
    loadMascota();
  }, [id]);

  const handleSave = async () => {
    if (!mascota || !nombre || !especie) {
      Alert.alert('Error', 'Nombre y especie son obligatorios');
      return;
    }

    try {
      await updateMascota(mascota.id, {
        nombre,
        especie,
        raza,
        fechaNacimiento,
        peso: parseFloat(peso) || 0,
        veterinario,
        numeroChip,
        alertasActivas: {
          vacunas: alertaVacunas,
          desparasitacion: alertaDesparasitacion,
          revision: alertaRevision,
          medicamentos: alertaMedicamentos,
        },
      });
      
      Alert.alert('¡Éxito!', 'Mascota actualizada correctamente');
      router.back();
    } catch (error: any) {
      Alert.alert('Error al actualizar', error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando...</Text>
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar {mascota.nombre}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        <TextInput
          placeholder="Nombre de la mascota"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <TextInput
          placeholder="Especie (Perro, Gato, etc.)"
          value={especie}
          onChangeText={setEspecie}
          style={styles.input}
        />
        <TextInput
          placeholder="Raza"
          value={raza}
          onChangeText={setRaza}
          style={styles.input}
        />
        <TextInput
          placeholder="Fecha de nacimiento (YYYY-MM-DD)"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
          style={styles.input}
        />
        <TextInput
          placeholder="Peso actual (kg)"
          value={peso}
          onChangeText={setPeso}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Veterinaria</Text>
        <TextInput
          placeholder="Veterinario de cabecera"
          value={veterinario}
          onChangeText={setVeterinario}
          style={styles.input}
        />
        <TextInput
          placeholder="Número de chip (opcional)"
          value={numeroChip}
          onChangeText={setNumeroChip}
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurar Alertas</Text>
        
        <View style={styles.switchRow}>
          <Text>Alertas de vacunación</Text>
          <Switch value={alertaVacunas} onValueChange={setAlertaVacunas} />
        </View>
        
        <View style={styles.switchRow}>
          <Text>Alertas de desparasitación</Text>
          <Switch value={alertaDesparasitacion} onValueChange={setAlertaDesparasitacion} />
        </View>
        
        <View style={styles.switchRow}>
          <Text>Alertas de revisión médica</Text>
          <Switch value={alertaRevision} onValueChange={setAlertaRevision} />
        </View>
        
        <View style={styles.switchRow}>
          <Text>Alertas de medicamentos</Text>
          <Switch value={alertaMedicamentos} onValueChange={setAlertaMedicamentos} />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Guardar Cambios" onPress={handleSave} />
        <View style={styles.buttonSpacing} />
        <Button title="Cancelar" onPress={() => router.back()} color="#666" />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#2196F3',
    color: 'white',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonContainer: {
    margin: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});
