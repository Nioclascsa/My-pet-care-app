import { Stack } from 'expo-router';

export default function CareLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="alimentacion" 
        options={{ 
          title: 'Registro de Alimentación',
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="peso" 
        options={{ 
          title: 'Registro de Peso',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="citas" 
        options={{ 
          title: 'Citas Médicas',
          headerStyle: { backgroundColor: '#F44336' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="medicamentos" 
        options={{ 
          title: 'Medicamentos',
          headerStyle: { backgroundColor: '#9C27B0' },
          headerTintColor: 'white',
        }} 
      />
    </Stack>
  );
}