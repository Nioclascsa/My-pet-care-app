import { Stack } from 'expo-router';

export default function MascotasTabLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Mis Mascotas',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="addPet" 
        options={{ 
          title: 'Agregar Mascota',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: 'white',
        }} 
      />
    </Stack>
  );
}