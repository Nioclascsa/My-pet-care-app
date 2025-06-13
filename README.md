My pet Care App

Integrantes: Nicolás Cristóbal Salamanca Arce

Descripción
My Pet Care es una aplicación móvil integral para el cuidado y seguimiento de mascotas, diseñada para ayudar a los dueños a gestionar todos los aspectos relacionados con la salud y bienestar de sus animales. La aplicación permite registrar información vital, programar citas veterinarias, controlar medicamentos y monitorear la alimentación y el peso de cada mascota.

Tecnologías utilizadas
-React Native con TypeScript
-Expo Framework y Expo Router para navegación
-Firebase (Authentication, Firestore, Storage)
-Sistema de notificaciones locales
-Integración con Google Calendar
-Persistencia de datos con AsyncStorage
---------------------------------------------------------------------

Requerimientos funcionales
1. Gestión de usuarios

Registro e inicio de sesión seguro con email y contraseña
Persistencia de sesión entre reinicios de la aplicación
Cierre de sesión y gestión de perfil

2. Gestión de mascotas

 Registro de múltiples mascotas por usuario
Almacenamiento de datos básicos: nombre, especie, raza, edad, peso, foto
Actualización y eliminación de registros de mascotas

3. Control médico y veterinario

 Registro de citas veterinarias con fecha, hora y motivo
Programación de recordatorios para citas
Integración con Google Calendar
Historial de citas anteriores

4. Seguimiento de medicamentos

 Registro de medicamentos con dosis, frecuencia y duración
Sistema de notificaciones para administración de medicamentos
Historial de medicamentos administrados

5. Control de alimentación

 Registro de dietas y horarios de alimentación
Notificaciones de horarios de comida
Seguimiento de consumo y preferencias

6. Monitoreo de peso

 Registro periódico del peso de la mascota
Visualización de la evolución del peso
Alertas por cambios significativos

7. Sistema de notificaciones

 Recordatorios para citas veterinarias
Alertas para administración de medicamentos
Notificaciones para rutinas de alimentación

Requerimientos no funcionales

1. Seguridad

Protección de datos de usuario mediante autenticación
Reglas de seguridad para acceso a datos en Firebase

2. Usabilidad

Interfaz intuitiva y amigable para el usuario
Diseño responsivo para diferentes tamaños de pantalla

3. Rendimiento

Tiempos de carga rápidos (menos de 3 segundos)
Funcionamiento fluido incluso con múltiples mascotas registradas
Optimización de consumo de recursos del dispositivo

4. Disponibilidad

Funcionamiento parcial sin conexión a internet
Sincronización automática al recuperar la conexión
Persistencia de datos críticos en el dispositivo

5. Escalabilidad

Arquitectura que permite añadir nuevas funcionalidades
Capacidad para gestionar aumento en la base de usuarios
Diseño modular para facilitar mantenimiento

6. Compatibilidad

Funcionamiento en dispositivos Android modernos
Adaptación a diferentes resoluciones de pantallas



## Instrucciones

1. Instalar las dependencias

   
   npm install
   

2. Iniciar la app


   npx expo start
   

Descargar la aplicacion Expo go en play store y usar la opcion de escanear el codigo que va a generar la terminal.


- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo.

