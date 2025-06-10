import { Stack } from 'expo-router';

export default function MascotasLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="detail/[id]" 
        options={{ 
          title: 'Detalle de Mascota',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{ 
          title: 'Editar Mascota',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="care" 
        options={{ 
          headerShown: false // Porque care tiene su propio layout
        }} 
      />
    </Stack>
  );
}