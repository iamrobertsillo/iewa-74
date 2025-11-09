'use client';

import { useEffect } from 'react';
import { useSelectionStore } from '@/lib/store/selectionStore';

/**
 * Hook that warns users before leaving the page if they have an active reservation
 */
export function useReservationWarning() {
  const activeReservation = useSelectionStore((state) => state.activeReservation);

  useEffect(() => {
    // Only add warning if there's an active reservation
    if (!activeReservation) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers require returnValue to be set
      e.preventDefault();
      e.returnValue = 'You have an active reservation. Are you sure you want to leave?';
      return e.returnValue;
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount or when reservation is cleared
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeReservation]);
}
