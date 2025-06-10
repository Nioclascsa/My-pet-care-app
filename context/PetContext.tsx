import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { auth } from '../config/firebase';
import { getMascotas, type Mascota } from '../services/pets';

interface PetState {
  mascotas: Mascota[];
  selectedPet: Mascota | null;
  loading: boolean;
  error: string | null;
}

type PetAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MASCOTAS'; payload: Mascota[] }
  | { type: 'SET_SELECTED_PET'; payload: Mascota | null }
  | { type: 'ADD_MASCOTA'; payload: Mascota }
  | { type: 'UPDATE_MASCOTA'; payload: Mascota }
  | { type: 'DELETE_MASCOTA'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: PetState = {
  mascotas: [],
  selectedPet: null,
  loading: false,
  error: null,
};

const petReducer = (state: PetState, action: PetAction): PetState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_MASCOTAS':
      return { ...state, mascotas: action.payload, loading: false };
    case 'SET_SELECTED_PET':
      return { ...state, selectedPet: action.payload };
    case 'ADD_MASCOTA':
      return { ...state, mascotas: [...state.mascotas, action.payload] };
    case 'UPDATE_MASCOTA':
      return {
        ...state,
        mascotas: state.mascotas.map(m => 
          m.id === action.payload.id ? action.payload : m
        ),
        selectedPet: state.selectedPet?.id === action.payload.id ? action.payload : state.selectedPet
      };
    case 'DELETE_MASCOTA':
      return {
        ...state,
        mascotas: state.mascotas.filter(m => m.id !== action.payload),
        selectedPet: state.selectedPet?.id === action.payload ? null : state.selectedPet
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const PetContext = createContext<{
  state: PetState;
  dispatch: React.Dispatch<PetAction>;
  loadMascotas: () => Promise<void>;
} | null>(null);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(petReducer, initialState);

  const loadMascotas = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = auth.currentUser;
      if (user) {
        const mascotas = await getMascotas(user.uid);
        dispatch({ type: 'SET_MASCOTAS', payload: mascotas });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando mascotas' });
    }
  };

  useEffect(() => {
    loadMascotas();
  }, []);

  return (
    <PetContext.Provider value={{ state, dispatch, loadMascotas }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets debe usarse dentro de PetProvider');
  }
  return context;
};
