import { Stack } from 'expo-router';
import { Text } from 'react-native';

export default function MascotasLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{
            headerTitle: () => <Text>Mascotas</Text>,
          }} 
        />
      </Stack>
    </>
  );
}