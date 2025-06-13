import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from './firebase';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Función para registrar el token del dispositivo
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('¡Se requieren permisos de notificación para recibir recordatorios!');
      return;
    }
    
    // Obtener token de Expo
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'tu-expo-project-id', // Reemplaza con tu ID de proyecto Expo
    })).data;
    
    // Guardar el token en Firestore para este usuario
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'userTokens', auth.currentUser.uid), {
          token,
          platform: Platform.OS,
          userId: auth.currentUser.uid,
          updatedAt: new Date()
        }, { merge: true });
        
        console.log('Token guardado con éxito:', token);
      } catch (error) {
        console.error('Error al guardar token:', error);
      }
    }
  } else {
    alert('Las notificaciones push requieren un dispositivo físico');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });
  }

  return token;
}

// Función para programar una notificación local
export async function scheduleLocalNotification(
  title: string, 
  body: string, 
  trigger: Notifications.NotificationTriggerInput = null
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: trigger || { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 }, // Si no se especifica, muestra después de 2 segundos
  });
}

// Función para programar recordatorios recurrentes
export async function scheduleRecurringNotification(
  title: string,
  body: string,
  hour: number,
  minute: number,
  repeats: boolean = true
) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats,
    },
  });
}

// Función para cancelar todas las notificaciones programadas
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}