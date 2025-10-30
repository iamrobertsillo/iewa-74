'use client';
import { create } from 'zustand';

export interface Tile {
  x: number;
  y: number;
  status: 'available' | 'sold';
  image?: string;
}

interface GridStore {
  tiles: Tile[];
  selectedTile: Tile | null;
  setTiles: (tiles: Tile[]) => void;
  selectTile: (tile: Tile | null) => void;
}

export const useGridStore = create<GridStore>((set) => ({
  tiles: [],
  selectedTile: null,
  setTiles: (tiles) => set({ tiles }),
  selectTile: (tile) => set({ selectedTile: tile }),

  updateTileImage: (x, y, image) =>
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.x === x && t.y === y ? { ...t, image } : t
      ),
  })),
}));
