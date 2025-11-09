'use client';

import { create } from 'zustand';
import { api } from '@/lib/api/client';
import type { Reservation } from '@/lib/types';

interface SelectionState {
  // Selection state
  selectedTiles: Set<string>;
  isSelecting: boolean;
  selectionStart: { row: number; col: number } | null;

  // Reservation state
  activeReservation: Reservation | null;
  reservationTimeLeft: number | null; // in milliseconds
  isReservationExpiring: boolean; // true when < 15 minutes left

  // Actions
  addTile: (row: number, col: number) => void;
  removeTile: (row: number, col: number) => void;
  toggleTile: (row: number, col: number) => void;
  clearSelection: () => void;
  selectRange: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  setSelecting: (isSelecting: boolean) => void;
  setSelectionStart: (row: number | null, col: number | null) => void;

  // Reservation actions
  createReservation: (userId: string) => Promise<boolean>;
  cancelReservation: () => Promise<void>;
  extendReservation: (additionalMinutes: number) => Promise<void>;
  updateReservationTime: () => void;

  // Computed properties
  getSelectionCount: () => number;
  getSelectedTileArray: () => string[];
  getTotalPrice: () => number;
}

const PRICE_PER_SQUARE = 500; // €5 in cents
const WARNING_TIME = 15 * 60 * 1000; // 15 minutes in ms

export const useSelectionStore = create<SelectionState>((set, get) => {
  // Timer for updating reservation countdown
  let reservationTimer: NodeJS.Timeout | null = null;

  // Start the timer when a reservation is created
  const startReservationTimer = () => {
    if (reservationTimer) clearInterval(reservationTimer);

    reservationTimer = setInterval(() => {
      const state = get();
      if (state.activeReservation) {
        state.updateReservationTime();
      }
    }, 1000); // Update every second
  };

  // Stop the timer
  const stopReservationTimer = () => {
    if (reservationTimer) {
      clearInterval(reservationTimer);
      reservationTimer = null;
    }
  };

  return {
    // Initial state
    selectedTiles: new Set(),
    isSelecting: false,
    selectionStart: null,
    activeReservation: null,
    reservationTimeLeft: null,
    isReservationExpiring: false,

    // Selection actions
    addTile: (row, col) => {
      const id = `${row},${col}`;
      set((state) => {
        const newSelected = new Set(state.selectedTiles);
        newSelected.add(id);
        return { selectedTiles: newSelected };
      });
    },

    removeTile: (row, col) => {
      const id = `${row},${col}`;
      set((state) => {
        const newSelected = new Set(state.selectedTiles);
        newSelected.delete(id);
        return { selectedTiles: newSelected };
      });
    },

    toggleTile: (row, col) => {
      const id = `${row},${col}`;
      set((state) => {
        const newSelected = new Set(state.selectedTiles);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        return { selectedTiles: newSelected };
      });
    },

    clearSelection: () => {
      set({ selectedTiles: new Set() });
    },

    selectRange: (startRow, startCol, endRow, endCol) => {
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const newSelected = new Set<string>();
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          newSelected.add(`${row},${col}`);
        }
      }

      set({ selectedTiles: newSelected });
    },

    setSelecting: (isSelecting) => {
      set({ isSelecting });
    },

    setSelectionStart: (row, col) => {
      set({
        selectionStart: row !== null && col !== null ? { row, col } : null
      });
    },

    // Reservation actions
    createReservation: async (userId: string) => {
      const selectedTileArray = get().getSelectedTileArray();

      if (selectedTileArray.length === 0) {
        console.error('No tiles selected');
        return false;
      }

      try {
        const response = await api.reservation.createReservation(
          selectedTileArray,
          userId
        );

        if (response.success && response.data) {
          set({
            activeReservation: response.data,
            reservationTimeLeft: response.data.expiresAt.getTime() - Date.now(),
          });

          startReservationTimer();
          console.log(`[Store] Created reservation ${response.data.id}`);
          return true;
        } else {
          console.error('Failed to create reservation:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Error creating reservation:', error);
        return false;
      }
    },

    cancelReservation: async () => {
      const reservation = get().activeReservation;
      if (!reservation) return;

      try {
        await api.reservation.cancelReservation(reservation.id);
        set({
          activeReservation: null,
          reservationTimeLeft: null,
          isReservationExpiring: false,
        });
        stopReservationTimer();
        console.log(`[Store] Cancelled reservation ${reservation.id}`);
      } catch (error) {
        console.error('Error cancelling reservation:', error);
      }
    },

    extendReservation: async (additionalMinutes: number) => {
      const reservation = get().activeReservation;
      if (!reservation) return;

      try {
        const response = await api.reservation.extendReservation(
          reservation.id,
          additionalMinutes
        );

        if (response.success && response.data) {
          set({
            activeReservation: response.data,
            reservationTimeLeft: response.data.expiresAt.getTime() - Date.now(),
          });
          console.log(`[Store] Extended reservation ${reservation.id}`);
        }
      } catch (error) {
        console.error('Error extending reservation:', error);
      }
    },

    updateReservationTime: () => {
      const reservation = get().activeReservation;
      if (!reservation) return;

      const timeLeft = reservation.expiresAt.getTime() - Date.now();

      if (timeLeft <= 0) {
        // Reservation expired
        set({
          activeReservation: null,
          reservationTimeLeft: null,
          isReservationExpiring: false,
          selectedTiles: new Set(), // Clear selection
        });
        stopReservationTimer();
        console.log('[Store] Reservation expired');
      } else {
        set({
          reservationTimeLeft: timeLeft,
          isReservationExpiring: timeLeft <= WARNING_TIME,
        });
      }
    },

    // Computed properties
    getSelectionCount: () => {
      return get().selectedTiles.size;
    },

    getSelectedTileArray: () => {
      return Array.from(get().selectedTiles);
    },

    getTotalPrice: () => {
      return get().selectedTiles.size * PRICE_PER_SQUARE;
    },
  };
});

// Helper function to format time left as string
export function formatTimeLeft(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper function to format price in euros
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return `€${euros.toFixed(2)}`;
}
