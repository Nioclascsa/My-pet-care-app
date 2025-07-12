import { MaterialIcons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, storage } from '../config/firebase';

type ImagePickerProps = {
  defaultImage?: string;
  onImageSelected: (url: string) => void;
  mascotaId?: string;
  size?: number;
};

export default function ImagePicker({
  defaultImage,
  onImageSelected,
  mascotaId,
  size = 150
}: ImagePickerProps) {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Solicitar permisos para acceder a la galería
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la galería');
      return;
    }

    // Abrir el selector de imágenes
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        
        // Subir imagen a Firebase Storage
        const imageUrl = await uploadImage(imageUri);
        
        // Actualizar estado local y notificar al componente padre
        setImage(imageUrl);
        onImageSelected(imageUrl);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        alert('Ocurrió un error al subir la imagen. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const takePicture = async () => {
    // Solicitar permisos para acceder a la cámara
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la cámara');
      return;
    }

    // Abrir la cámara
    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        
        // Subir imagen a Firebase Storage
        const imageUrl = await uploadImage(imageUri);
        
        // Actualizar estado local y notificar al componente padre
        setImage(imageUrl);
        onImageSelected(imageUrl);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        alert('Ocurrió un error al subir la imagen. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Convertir URI a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Crear referencia única en Firebase Storage
    const filename = `mascotas/${userId}/${mascotaId || Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Subir archivo
    await uploadBytes(storageRef, blob);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.imageContainer, 
          { width: size, height: size, borderRadius: size / 2 }
        ]} 
        onPress={pickImage}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : image ? (
          <Image 
            source={{ uri: image }} 
            style={[
              styles.image, 
              { width: size, height: size, borderRadius: size / 2 }
            ]} 
          />
        ) : (
          <View style={[
            styles.placeholderContainer,
            { width: size, height: size, borderRadius: size / 2 }
          ]}>
            <MaterialIcons name="pets" size={size / 2.5} color="#aaa" />
            <Text style={styles.placeholderText}>Foto</Text>
          </View>
        )}
        <View style={styles.editButton}>
          <MaterialIcons name="edit" size={18} color="white" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <MaterialIcons name="photo-library" size={18} color="#4CAF50" />
          <Text style={styles.buttonText}>Galería</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <MaterialIcons name="camera-alt" size={18} color="#4CAF50" />
          <Text style={styles.buttonText}>Cámara</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 15,
  },
  imageContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#aaa',
    marginTop: 5,
    fontSize: 12,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    marginLeft: 5,
    color: '#4CAF50',
    fontWeight: '500',
  }
});