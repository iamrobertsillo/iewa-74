/**
 * Mock Reservation API Implementation
 *
 * This is a mock implementation for testing without a backend.
 * Replace with real ProcessWire implementation when ready.
 */

import type { IReservationAPI } from '../interfaces';
import type { Reservation, ApiResponse } from '../../types';

// In-memory storage
const reservations = new Map<string, Reservation>();
const userReservations = new Map<string, string>(); // userId -> reservationId

export class MockReservationAPI implements IReservationAPI {
  async createReservation(
    squareIds: string[],
    userId: string
  ): Promise<ApiResponse<Reservation>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check if user already has a reservation
    if (userReservations.has(userId)) {
      return {
        success: false,
        error: 'User already has an active reservation',
      };
    }

    // Create reservation
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours

    const reservation: Reservation = {
      id,
      squareIds,
      userId,
      createdAt: now,
      expiresAt,
      status: 'active',
    };

    reservations.set(id, reservation);
    userReservations.set(userId, id);

    console.log(`[Mock] Created reservation ${id} for user ${userId}, expires at ${expiresAt.toLocaleTimeString()}`);

    return {
      success: true,
      data: reservation,
    };
  }

  async cancelReservation(reservationId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const reservation = reservations.get(reservationId);

    if (!reservation) {
      return {
        success: false,
        error: 'Reservation not found',
      };
    }

    reservation.status = 'cancelled';
    userReservations.delete(reservation.userId);

    console.log(`[Mock] Cancelled reservation ${reservationId}`);

    return {
      success: true,
    };
  }

  async validateReservation(reservationId: string): Promise<ApiResponse<boolean>> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const reservation = reservations.get(reservationId);

    if (!reservation) {
      return { success: true, data: false };
    }

    const isValid =
      reservation.status === 'active' &&
      new Date() < new Date(reservation.expiresAt);

    if (!isValid && reservation.status === 'active') {
      reservation.status = 'expired';
      userReservations.delete(reservation.userId);
      console.log(`[Mock] Reservation ${reservationId} expired`);
    }

    return {
      success: true,
      data: isValid,
    };
  }

  async getUserReservation(userId: string): Promise<ApiResponse<Reservation | null>> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const reservationId = userReservations.get(userId);

    if (!reservationId) {
      return { success: true, data: null };
    }

    const reservation = reservations.get(reservationId);

    // Check if expired
    if (reservation && new Date() >= new Date(reservation.expiresAt)) {
      reservation.status = 'expired';
      userReservations.delete(userId);
      return { success: true, data: null };
    }

    return {
      success: true,
      data: reservation || null,
    };
  }

  async updateEditState(
    reservationId: string,
    editState: any
  ): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const reservation = reservations.get(reservationId);

    if (!reservation) {
      return {
        success: false,
        error: 'Reservation not found',
      };
    }

    reservation.editState = editState;

    console.log(`[Mock] Updated edit state for reservation ${reservationId}`);

    return {
      success: true,
    };
  }

  async extendReservation(
    reservationId: string,
    additionalMinutes: number
  ): Promise<ApiResponse<Reservation>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const reservation = reservations.get(reservationId);

    if (!reservation) {
      return {
        success: false,
        error: 'Reservation not found',
      };
    }

    const newExpiresAt = new Date(
      new Date(reservation.expiresAt).getTime() + additionalMinutes * 60 * 1000
    );

    reservation.expiresAt = newExpiresAt;

    console.log(`[Mock] Extended reservation ${reservationId} by ${additionalMinutes} minutes`);

    return {
      success: true,
      data: reservation,
    };
  }
}

// Export singleton instance
export const mockReservationAPI = new MockReservationAPI();
