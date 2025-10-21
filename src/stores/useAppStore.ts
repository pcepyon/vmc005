import { create } from 'zustand';

type ModalState = 'closed' | 'search-results' | 'place-detail' | 'review-write';

interface ModalHistoryItem {
  type: Exclude<ModalState, 'closed'>;
  data?: {
    placeId?: string;
    naverPlaceId?: string;
    searchQuery?: string;
    placeName?: string;
    placeAddress?: string;
    placeData?: {
      id: string;
      name: string;
      address: string;
      roadAddress?: string;
      phone?: string;
      latitude: number;
      longitude: number;
      category?: string;
    };
  };
}

interface AppState {
  modalState: ModalState;
  modalHistory: ModalHistoryItem[];
  highlightedMarkerId: string | null;
  mapCenter: { lat: number; lng: number };

  openModal: (type: Exclude<ModalState, 'closed'>, data?: ModalHistoryItem['data']) => void;
  closeModal: () => void;
  goBackModal: () => void;

  setHighlightedMarker: (id: string | null) => void;
  setMapCenter: (lat: number, lng: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  modalState: 'closed',
  modalHistory: [],
  highlightedMarkerId: null,
  mapCenter: { lat: 37.498095, lng: 127.027610 },

  openModal: (type, data) =>
    set((state) => ({
      modalState: type,
      modalHistory: [...state.modalHistory, { type, data }],
    })),

  closeModal: () =>
    set({
      modalState: 'closed',
      modalHistory: [],
      highlightedMarkerId: null,
    }),

  goBackModal: () =>
    set((state) => {
      const newHistory = [...state.modalHistory];
      newHistory.pop();
      const prevModal = newHistory[newHistory.length - 1];

      return {
        modalState: prevModal?.type || 'closed',
        modalHistory: newHistory,
      };
    }),

  setHighlightedMarker: (id) => set({ highlightedMarkerId: id }),
  setMapCenter: (lat, lng) => set({ mapCenter: { lat, lng } }),
}));
