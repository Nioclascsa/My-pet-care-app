import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where
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
  };
}

// Nuevas interfaces para las funcionalidades de cuidado
export interface CitaMedica {
  id: string;
  mascotaId: string;
  fecha: string;
  hora: string;
  tipo: 'revision' | 'vacuna' | 'desparasitacion' | 'emergencia' | 'cirugia' | 'otro';
  veterinario: string;
  motivo: string;
  estado: 'programada' | 'completada' | 'cancelada';
  notas?: string;
  costo?: number;
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

export const deleteMascota = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'mascotas', id));
  } catch (error) {
    console.error('Error deleting mascota:', error);
    throw new Error('No se pudo eliminar la mascota');
  }
};

// FUNCIONES PARA CITAS MÉDICAS (simplificadas)
export const addCitaMedica = async (cita: Omit<CitaMedica, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'citas_medicas'), cita);
    return docRef.id;
  } catch (error) {
    console.error('Error adding cita medica:', error);
    throw new Error('No se pudo agregar la cita médica');
  }
};

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
