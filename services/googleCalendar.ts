import { Alert, Linking } from 'react-native';

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  location?: string;
}

export const createGoogleCalendarEvent = async (event: CalendarEvent) => {
  try {
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatDateForGoogle(event.startDate);
    const endTime = formatDateForGoogle(event.endDate);

 
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startTime}/${endTime}`,
      details: event.description,
      ...(event.location && { location: event.location })
    });

    const calendarUrl = `${baseUrl}?${params.toString()}`;

    console.log('🗓️ Abriendo Google Calendar:', calendarUrl);

    
    const supported = await Linking.canOpenURL(calendarUrl);
    
    if (supported) {
      await Linking.openURL(calendarUrl);
      return true;
    } else {
      throw new Error('No se puede abrir Google Calendar');
    }
  } catch (error) {
    console.error('❌ Error abriendo Google Calendar:', error);
    return false;
  }
};

export const showCalendarOptions = (event: CalendarEvent) => {
  Alert.alert(
    '📅 Agregar al Calendario',
    '¿Cómo quieres guardar este recordatorio?',
    [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: '🗓️ Google Calendar',
        onPress: async () => {
          const success = await createGoogleCalendarEvent(event);
          if (!success) {
            Alert.alert(
              'Error',
              'No se pudo abrir Google Calendar. ¿Quieres copiar la información manualmente?',
              [
                { text: 'No', style: 'cancel' },
                { 
                  text: 'Sí, copiar', 
                  onPress: () => showEventInfo(event)
                }
              ]
            );
          }
        }
      },
      {
        text: '📋 Copiar Info',
        onPress: () => showEventInfo(event)
      }
    ]
  );
};

const showEventInfo = (event: CalendarEvent) => {
  const eventInfo = `${event.title}

📅 Fecha: ${event.startDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}

🕐 Hora: ${event.startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })} - ${event.endDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}

📍 Lugar: ${event.location || 'No especificado'}

📝 Descripción:
${event.description}`;

  Alert.alert(
    'Información del Evento',
    eventInfo,
    [{ text: 'OK' }]
  );
};

// Función específica para citas veterinarias
export const createVetAppointmentEvent = (
  mascotaNombre: string,
  tipo: string,
  fechaCita: Date,
  veterinario: string,
  motivo: string,
  notas?: string
): CalendarEvent => {
  // Duración estimada de la cita (1 hora por defecto)
  const endDate = new Date(fechaCita.getTime() + 60 * 60 * 1000);

  const title = `🐾 Cita Veterinaria: ${mascotaNombre}`;
  
  const description = `Tipo de cita: ${tipo}
Motivo: ${motivo}
${notas ? `\nNotas: ${notas}` : ''}

¡No olvides llevar:
• Cartilla de vacunación
• Historial médico
• Lista de preguntas para el veterinario`;

  return {
    title,
    startDate: fechaCita,
    endDate,
    description,
    location: veterinario
  };
};
export const createMedicationSchedule = (
  mascotaNombre: string,
  medicamento: string,
  dosis: string,
  frecuencia: string,
  fechaInicio: Date,
  fechaFin: Date
) => {
  const events: CalendarEvent[] = [];
  
  const getHoursInterval = (freq: string) => {
    switch (freq) {
      case 'cada_8_horas': return 8;
      case 'cada_12_horas': return 12;
      case 'diario': return 24;
      case 'cada_2_dias': return 48;
      case 'semanal': return 168; // 24 * 7
      default: return 24;
    }
  };

  const interval = getHoursInterval(frecuencia);
  const currentDate = new Date(fechaInicio);
  
  // Establecer hora por defecto (9:00 AM para el primer medicamento)
  currentDate.setHours(9, 0, 0, 0);

  let contador = 1;
  while (currentDate <= fechaFin && contador <= 50) { // Máximo 50 eventos
    const endTime = new Date(currentDate.getTime() + 15 * 60 * 1000); // 15 minutos

    events.push({
      title: `💊 ${medicamento} - ${mascotaNombre}`,
      startDate: new Date(currentDate),
      endDate: endTime,
      description: `🐾 Dar ${dosis} de ${medicamento} a ${mascotaNombre}

⏰ Frecuencia: ${getFrecuenciaText(frecuencia)}
📋 Dosis ${contador}

💡 Recordatorios:
• Dar con comida si es necesario
• Observar reacciones adversas
• No saltar dosis`,
      location: 'Casa'
    });

    // Avanzar al siguiente horario según la frecuencia
    currentDate.setTime(currentDate.getTime() + interval * 60 * 60 * 1000);
    contador++;
  }

  return events;
};

const getFrecuenciaText = (frecuencia: string) => {
  switch (frecuencia) {
    case 'cada_8_horas': return 'Cada 8 horas';
    case 'cada_12_horas': return 'Cada 12 horas';
    case 'diario': return 'Una vez al día';
    case 'cada_2_dias': return 'Cada 2 días';
    case 'semanal': return 'Una vez por semana';
    case 'segun_necesidad': return 'Según necesidad';
    default: return frecuencia;
  }
};

export const showMedicationCalendarOptions = (events: CalendarEvent[]) => {
  if (events.length === 0) {
    Alert.alert('Error', 'No se pudieron crear eventos de calendario');
    return;
  }

  Alert.alert(
    '📅 Agregar Recordatorios',
    `Se crearán ${events.length} recordatorios en tu calendario.\n\n¿Cómo quieres proceder?`,
    [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: '🗓️ Crear Todos en Google Calendar',
        onPress: async () => {
          let success = 0;
          for (const event of events.slice(0, 5)) { // Solo los primeros 5 para no saturar
            const result = await createGoogleCalendarEvent(event);
            if (result) success++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre eventos
          }
          
          Alert.alert(
            'Eventos Creados',
            `Se abrieron ${success} eventos en Google Calendar.\n\n💡 Tip: Puedes duplicar el último evento para el resto del tratamiento.`
          );
        }
      },
      {
        text: '📋 Ver Primer Evento',
        onPress: () => showEventInfo(events[0])
      }
    ]
  );
};