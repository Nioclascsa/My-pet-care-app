import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PetPhotoInputProps {
  photoUri?: string;
  onPhotoSelect: () => void;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

export const PetPhotoInput: React.FC<PetPhotoInputProps> = ({
  photoUri,
  onPhotoSelect,
  loading = false,
  size = 'medium',
  editable = true,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 60;
      case 'medium': return 100;
      case 'large': return 150;
    }
  };

  const containerSize = getSize();
  const iconSize = containerSize * 0.4;

  return (
    <TouchableOpacity
      style={[
        styles.photoContainer,
        { width: containerSize, height: containerSize },
        !editable && styles.disabled
      ]}
      onPress={editable ? onPhotoSelect : undefined}
      disabled={loading || !editable}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.petPhoto} />
          {editable && (
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          )}
        </>
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons name="camera" size={iconSize} color="#666" />
          <Text style={[styles.placeholderText, { fontSize: containerSize * 0.12 }]}>
            Agregar Foto
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    borderRadius: 75,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.7,
  },
  petPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
  },
});
