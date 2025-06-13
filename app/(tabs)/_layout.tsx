import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mascotas" 
        options={{
          title: "Mascotas", 
          tabBarIcon: ({ color }) => <FontAwesome5 name="paw" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile" 
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}