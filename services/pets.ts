import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Interfaces existentes
export interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  fechaNacimiento?: string;
  peso?: number;
  ownerId: string;
  veterinario?: string;
  numeroChip?: string;
  alertasActivas?: {
    vacunas: boolean;
    desparasitacion: boolean;
    revision: boolean;
    medicamentos: boolean;
  };
  fechas: {
     proximaVacuna?: string;
    proximaDesparasitacion?: string;
    proximaRevision?: string;
    proximoCita?: string;
  };
}

// Nuevas interfaces para las funcionalidades de cuidado
export interface CitaMedica {
  id?: string;
  mascotaId: string;
  fecha: string;
  hora: string;
  tipo: string; // Vacunación, Desparasitación, etc.
  motivo: string;
  veterinario?: string;
  notas?: string;
  completada: boolean;
}

export interface ActividadAlimentacion {
  id: string;
  mascotaId: string;
  fecha: string;
  hora: string;
  tipoComida: string;
  cantidad: string;
  notas?: string;
}

export interface RegistroPeso {
  id?: string;
  mascotaId: string;
  fecha: string;
  peso: number;
  notas?: string;
}

export interface Medicamento {
  id: string;
  mascotaId: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'completado' | 'suspendido';
  notas?: string;
}

export interface FechasMascota {
  proximaVacuna?: string;
  proximaDesparasitacion?: string;
  proximaRevision?: string;
  proximoCita?: string;
}

// Añadir este tipo para eventos del dashboard
export interface EventoDashboard {
  id: string;
  mascotaId: string;
  mascotaNombre: string;
  tipo: string; // 'cita', 'vacuna', 'desparasitacion', 'medicacion'
  titulo: string;
  descripcion: string;
  fecha: string; // Fecha ISO (YYYY-MM-DD) o combinada con hora
  completado: boolean;
}

// Funciones existentes para mascotas
export const addMascota = async (mascota: Omit<Mascota, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'mascotas'), mascota);
    return docRef.id;
  } catch (error) {
    console.error('Error adding mascota:', error);
    throw new Error('No se pudo agregar la mascota');
  }
};

export const getMascotas = async (ownerId: string): Promise<Mascota[]> => {
  try {
    const q = query(collection(db, 'mascotas'), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Mascota));
  } catch (error) {
    console.error('Error getting mascotas:', error);
    throw new Error('No se pudieron cargar las mascotas');
  }
};

export const updateMascota = async (id: string, updates: Partial<Mascota>): Promise<void> => {
  try {
    const mascotaRef = doc(db, 'mascotas', id);
    await updateDoc(mascotaRef, updates);
  } catch (error) {
    console.error('Error updating mascota:', error);
    throw new Error('No se pudo actualizar la mascota');
  }
};

export async function deleteMascota(mascotaId: string): Promise<void> {
  try {
    console.log(`Eliminando mascota con ID: ${mascotaId} y todos sus datos relacionados`);
    
    // Comenzar un lote de operaciones de escritura
    const batch = writeBatch(db);
    
    // 1. Eliminar registros relacionados con esta mascota
    const colecciones = [
      'registrosPeso',
      'actividadAlimentacion',
      'citasMedicas',
      'medicamentos',
      'registrosVacunas',
      'registrosDesparasitacion'
      // Añade aquí cualquier otra colección que contenga datos relacionados con mascotas
    ];
    
    // Para cada colección, buscar y eliminar documentos relacionados con esta mascota
    for (const nombreColeccion of colecciones) {
      console.log(`Buscando registros en ${nombreColeccion} para la mascota ${mascotaId}`);
      
      const q = query(
        collection(db, nombreColeccion),
        where('mascotaId', '==', mascotaId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log(`Encontrados ${querySnapshot.size} registros en ${nombreColeccion} para eliminar`);
        
        querySnapshot.forEach((documento) => {
          batch.delete(doc(db, nombreColeccion, documento.id));
        });
      }
    }
    
    // 2. Finalmente, eliminar el documento de la mascota
    batch.delete(doc(db, 'mascotas', mascotaId));
    
    // Ejecutar todas las operaciones de eliminación en un solo batch
    await batch.commit();
    
    console.log(`Mascota ${mascotaId} y todos sus datos relacionados han sido eliminados correctamente`);
    
    return;
  } catch (error) {
    console.error('Error al eliminar mascota y datos relacionados:', error);
    throw error;
  }
};

// Función para añadir una nueva cita médica y actualizar las fechas en la mascota
export async function addCitaMedica(citaData: Omit<CitaMedica, 'id'>): Promise<string> {
  try {
    // 1. Añadir la cita médica a la colección correspondiente
    const docRef = await addDoc(collection(db, 'citasMedicas'), {
      ...citaData,
      createdAt: new Date().toISOString(),
      completada: false
    });

    // 2. Actualizar la fecha de próxima cita en el documento de la mascota
    const mascotaRef = doc(db, 'mascotas', citaData.mascotaId);
    const mascotaDoc = await getDoc(mascotaRef);
    
    if (mascotaDoc.exists()) {
      const mascotaData = mascotaDoc.data();
      
      // Inicializar fechas si no existen
      const fechasActualizadas: any = {
        ...(mascotaData.fechas || {})
      };
      
      // Asignar fecha según el tipo
      if (citaData.tipo === 'vacuna') {
        fechasActualizadas.proximaVacuna = citaData.fecha;
      } else if (citaData.tipo === 'desparasitacion') {
        fechasActualizadas.proximaDesparasitacion = citaData.fecha;
      } else if (citaData.tipo === 'revision' || citaData.tipo === 'consulta' || citaData.tipo === 'control') {
        fechasActualizadas.proximaRevision = citaData.fecha;
      }
      
      console.log("Actualizando fechas de mascota:", fechasActualizadas);
      
      // Actualizar el documento de la mascota
      await updateDoc(mascotaRef, { 
        fechas: fechasActualizadas 
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error al añadir cita médica:', error);
    throw error;
  }
}

export const getCitasMedicas = async (mascotaId: string): Promise<CitaMedica[]> => {
  try {
    const q = query(
      collection(db, 'citas_medicas'), 
      where('mascotaId', '==', mascotaId)
    );
    const querySnapshot = await getDocs(q);
    const citas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CitaMedica));
    
    // Ordenar en el cliente
    return citas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error getting citas medicas:', error);
    return []; // Retornar array vacío en lugar de error
  }
};

// FUNCIONES PARA ALIMENTACIÓN (simplificadas)
export const addActividadAlimentacion = async (actividad: Omit<ActividadAlimentacion, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'alimentacion'), actividad);
    return docRef.id;
  } catch (error) {
    console.error('Error adding actividad alimentacion:', error);
    throw new Error('No se pudo registrar la alimentación');
  }
};

export const getActividadesAlimentacion = async (mascotaId: string): Promise<ActividadAlimentacion[]> => {
  try {
    const q = query(
      collection(db, 'alimentacion'), 
      where('mascotaId', '==', mascotaId)
    );
    const querySnapshot = await getDocs(q);
    const actividades = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActividadAlimentacion));
    
    return actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error getting actividades alimentacion:', error);
    return [];
  }
};

// FUNCIONES PARA PESO (simplificadas)
export const addRegistroPeso = async (registro: Omit<RegistroPeso, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'registros_peso'), registro);
    return docRef.id;
  } catch (error) {
    console.error('Error adding registro peso:', error);
    throw new Error('No se pudo registrar el peso');
  }
};

export const getRegistrosPeso = async (mascotaId: string): Promise<RegistroPeso[]> => {
  try {
    const q = query(
      collection(db, 'registros_peso'), 
      where('mascotaId', '==', mascotaId)
    );
    const querySnapshot = await getDocs(q);
    const registros = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RegistroPeso));
    
    return registros.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error getting registros peso:', error);
    return [];
  }
};

// FUNCIONES PARA MEDICAMENTOS (simplificadas)
export const addMedicamento = async (medicamento: Omit<Medicamento, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'medicamentos'), medicamento);
    return docRef.id;
  } catch (error) {
    console.error('Error adding medicamento:', error);
    throw new Error('No se pudo registrar el medicamento');
  }
};

export const getMedicamentos = async (mascotaId: string): Promise<Medicamento[]> => {
  try {
    const q = query(
      collection(db, 'medicamentos'), 
      where('mascotaId', '==', mascotaId)
    );
    const querySnapshot = await getDocs(q);
    const medicamentos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Medicamento));
    
    return medicamentos.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
  } catch (error) {
    console.error('Error getting medicamentos:', error);
    return [];
  }
};

// Función para obtener todos los próximos eventos de una mascota
export async function getProximosEventos(mascotaId: string): Promise<EventoDashboard[]> {
  try {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    const fechaString = fechaActual.toISOString().split('T')[0];
    
    // Obtener datos de la mascota para tener su nombre
    const mascotaDoc = await getDoc(doc(db, 'mascotas', mascotaId));
    if (!mascotaDoc.exists()) {
      throw new Error(`Mascota con ID ${mascotaId} no encontrada`);
    }
    
    const mascota = { id: mascotaDoc.id, ...mascotaDoc.data() } as Mascota;
    const eventos: EventoDashboard[] = [];
    
    // 1. Intentar obtener citas médicas con consulta simple (sin requerir índice)
    try {
      // Primero intentamos con una consulta simple por mascotaId
      const citasSimpleQuery = query(
        collection(db, 'citasMedicas'),
        where('mascotaId', '==', mascotaId)
      );
      
      const citasSnapshot = await getDocs(citasSimpleQuery);
      
      // Filtramos manualmente los resultados
      citasSnapshot.forEach(doc => {
        const citaData = doc.data() as CitaMedica;
        
        // Solo incluir citas futuras y no completadas
        if (citaData.fecha && citaData.fecha >= fechaString && citaData.completada !== true) {
          let tipo = 'cita';
          const motivoLower = (citaData.motivo || '').toLowerCase();
          
          if (citaData.tipo) {
            tipo = citaData.tipo;
          } else if (motivoLower.includes('vacuna')) {
            tipo = 'vacuna';
          } else if (motivoLower.includes('desparas')) {
            tipo = 'desparasitacion';
          }
          
          eventos.push({
            id: doc.id,
            mascotaId: mascotaId,
            mascotaNombre: mascota.nombre,
            tipo: tipo,
            titulo: citaData.tipo || citaData.motivo || 'Cita médica',
            descripcion: citaData.motivo || 'Visita al veterinario',
            fecha: `${citaData.fecha}T${citaData.hora || '09:00'}`,
            completado: citaData.completada || false
          });
        }
      });
    } catch (indexError) {
      console.warn('Error con consulta compleja, usando método alternativo:', indexError);
    }
    
    // 3. Añadir fechas importantes desde el documento de mascota
    if (mascota.fechas) {
      if (mascota.fechas.proximaVacuna && mascota.fechas.proximaVacuna >= fechaString) {
        eventos.push({
          id: `vacuna-${mascotaId}`,
          mascotaId: mascotaId,
          mascotaNombre: mascota.nombre,
          tipo: 'vacuna',
          titulo: 'Vacunación',
          descripcion: 'Recordatorio de vacunación',
          fecha: `${mascota.fechas.proximaVacuna}T09:00:00`,
          completado: false
        });
      }
      
      if (mascota.fechas.proximaDesparasitacion && mascota.fechas.proximaDesparasitacion >= fechaString) {
        eventos.push({
          id: `desparasitacion-${mascotaId}`,
          mascotaId: mascotaId,
          mascotaNombre: mascota.nombre,
          tipo: 'desparasitacion',
          titulo: 'Desparasitación',
          descripcion: 'Recordatorio de desparasitación',
          fecha: `${mascota.fechas.proximaDesparasitacion}T09:00:00`,
          completado: false
        });
      }
      
      if (mascota.fechas.proximaRevision && mascota.fechas.proximaRevision >= fechaString) {
        eventos.push({
          id: `revision-${mascotaId}`,
          mascotaId: mascotaId,
          mascotaNombre: mascota.nombre,
          tipo: 'cita',
          titulo: 'Revisión General',
          descripcion: 'Control veterinario',
          fecha: `${mascota.fechas.proximaRevision}T09:00:00`,
          completado: false
        });
      }
    }
    
    // Ordenar todos los eventos por fecha
    return eventos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
  } catch (error) {
    console.error('Error obteniendo eventos próximos:', error);
    // En caso de error, devolver al menos datos de fechas de la mascota
    return [];
  }
}

