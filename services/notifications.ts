import * as Notifications from 'expo-notifications';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const scheduleAppointmentNotification = async (
  title: string,
  body: string,
  scheduledDate: Date,
  petName: string
) => {
  const trigger = {
    date: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // 1 día antes
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏥 Cita Veterinaria - ${petName}`,
      body: `Mañana: ${body}`,
      data: { type: 'appointment', petName },
    },
    trigger,
  });
};

export const scheduleMedicationReminder = async (
  medicationName: string,
  petName: string,
  scheduledTimes: string[]
) => {
  for (const time of scheduledTimes) {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Hora del medicamento - ${petName}`,
        body: `Es hora de dar ${medicationName}`,
        data: { type: 'medication', petName, medicationName },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }
};
