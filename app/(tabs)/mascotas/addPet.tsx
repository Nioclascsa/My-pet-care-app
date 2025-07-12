import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import ImagePicker from '../../../components/ImagePicker';
import { auth } from '../../../config/firebase';
import { addMascota } from '../../../services/pets';

export default function AddMascota() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [numeroChip, setNumeroChip] = useState('');
  const [imagen, setImagen] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [alertaVacunas, setAlertaVacunas] = useState(true);
  const [alertaDesparasitacion, setAlertaDesparasitacion] = useState(true);
  const [alertaRevision, setAlertaRevision] = useState(true);
  const [alertaMedicamentos, setAlertaMedicamentos] = useState(true);

  // Estados para el dropdown de especies
  const [open, setOpen] = useState(false);
  const [especie, setEspecie] = useState('');
  const [especies, setEspecies] = useState([
    { label: 'Perro', value: 'Perro' },
    { label: 'Gato', value: 'Gato' },
    { label: 'Ave', value: 'Ave' },
    { label: 'Pez', value: 'Pez' },
    { label: 'Hámster', value: 'Hámster' },
    { label: 'Conejo', value: 'Conejo' },
    { label: 'Reptil', value: 'Reptil' },
    { label: 'Otro', value: 'Otro' },
  ]);

  // Función para manejar la selección de imagen
  const handleImageSelected = (url: string) => {
    setImagen(url);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Error', 'Usuario no autenticado');
    if (!nombre || !especie) return Alert.alert('Error', 'Nombre y especie son obligatorios');

    try {
      setLoading(true);
      await addMascota({
        nombre,
        especie,
        raza,
        fechaNacimiento,
        peso: parseFloat(peso) || 0,
        veterinario,
        numeroChip,
        imagen, // Agregamos la URL de la imagen
        ownerId: user.uid,
        alertasActivas: {
          vacunas: alertaVacunas,
          desparasitacion: alertaDesparasitacion,
          revision: alertaRevision,
          medicamentos: alertaMedicamentos,
        },
        fechas: {}
      });
      
      Alert.alert(
        '¡Éxito!', 
        `${nombre} ha sido registrado correctamente`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back(); // Esto regresará a la lista que se actualizará automáticamente
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Error al crear', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Nueva Mascota</Text>
      
      {/* Sección de la foto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto de la Mascota</Text>
        <View style={styles.photoContainer}>
          <ImagePicker
            onImageSelected={handleImageSelected}
            size={150}
          />
        </View>
        <Text style={styles.photoHint}>
          Toca el círculo para seleccionar una foto de tu mascota
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        <TextInput
          placeholder="Nombre de la mascota"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <Text style={styles.label}>Especie *</Text>
        <DropDownPicker
          open={open}
          value={especie}
          items={especies}
          setOpen={setOpen}
          setValue={setEspecie}
          setItems={setEspecies}
          placeholder="Selecciona una especie"
          style={styles.dropdownStyle}
          textStyle={styles.dropdownText}
          dropDownContainerStyle={styles.dropdownContainer}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            nestedScrollEnabled: true,
          }}
          zIndex={3000}
          zIndexInverse={1000}
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
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Guardando...</Text>
          ) : (
            <>
              <MaterialIcons name="pets" size={20} color="white" />
              <Text style={styles.buttonText}>Registrar Mascota</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Espaciado final para evitar que el botón quede oculto en algunos dispositivos */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  photoHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
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
  dropdownStyle: {
    borderColor: '#ddd',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 5,
    marginBottom: 10,
  },
  dropdownContainer: {
    borderColor: '#ddd',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownSpacer: {
    height: 150, // Ajusta este valor según sea necesario
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});