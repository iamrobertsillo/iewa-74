/**
 * Mock Grid API Implementation
 *
 * This is a mock implementation for testing without a backend.
 * Replace with real ProcessWire implementation when ready.
 */

import type { IGridAPI } from '../interfaces';
import type { GridSquare, ApiResponse } from '../../types';

// In-memory storage for mock data
const mockSquares = new Map<string, GridSquare>();
let gridDimensions = { rows: 100, cols: 100 };

// Initialize with some mock data
function initializeMockData() {
  if (mockSquares.size > 0) return; // Already initialized

  // Create a few occupied squares for testing
  for (let i = 0; i < 20; i++) {
    const row = Math.floor(Math.random() * 10);
    const col = Math.floor(Math.random() * 10);
    const id = `${row},${col}`;

    mockSquares.set(id, {
      id,
      row,
      col,
      isOccupied: Math.random() > 0.5,
      status: 'available',
      imageUrl: Math.random() > 0.7 ? `/uploads/sample_${i}.jpg` : undefined,
      altText: `Square at ${row}, ${col}`,
    });
  }
}

export class MockGridAPI implements IGridAPI {
  constructor() {
    initializeMockData();
  }

  async fetchSquares(
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Promise<ApiResponse<GridSquare[]>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const squares: GridSquare[] = [];

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const id = `${row},${col}`;
        const existing = mockSquares.get(id);

        if (existing) {
          squares.push(existing);
        } else {
          // Return default square data
          squares.push({
            id,
            row,
            col,
            isOccupied: false,
            status: 'available',
          });
        }
      }
    }

    return {
      success: true,
      data: squares,
    };
  }

  async fetchSquareById(id: string): Promise<ApiResponse<GridSquare>> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const square = mockSquares.get(id);

    if (square) {
      return { success: true, data: square };
    }

    // Parse ID to get row/col
    const [row, col] = id.split(',').map(Number);

    return {
      success: true,
      data: {
        id,
        row,
        col,
        isOccupied: false,
        status: 'available',
      },
    };
  }

  async fetchSquaresByCoordinates(
    row: number,
    col: number,
    range: number = 1
  ): Promise<ApiResponse<GridSquare[]>> {
    const squares: GridSquare[] = [];

    for (let r = row - range; r <= row + range; r++) {
      for (let c = col - range; c <= col + range; c++) {
        if (r >= 0 && c >= 0) {
          const id = `${r},${c}`;
          const existing = mockSquares.get(id);

          squares.push(
            existing || {
              id,
              row: r,
              col: c,
              isOccupied: false,
              status: 'available',
            }
          );
        }
      }
    }

    return { success: true, data: squares };
  }

  async updateSquare(
    id: string,
    data: Partial<GridSquare>
  ): Promise<ApiResponse<GridSquare>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const existing = mockSquares.get(id) || {
      id,
      row: parseInt(id.split(',')[0]),
      col: parseInt(id.split(',')[1]),
      isOccupied: false,
      status: 'available' as const,
    };

    const updated = { ...existing, ...data };
    mockSquares.set(id, updated);

    return { success: true, data: updated };
  }

  async getGridDimensions(): Promise<ApiResponse<{ rows: number; cols: number }>> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      data: gridDimensions,
    };
  }
}

// Export singleton instance
export const mockGridAPI = new MockGridAPI();
