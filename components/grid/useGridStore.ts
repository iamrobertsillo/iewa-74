import { create } from 'zustand';

export type Tile = {
  x: number;
  y: number;
  status: 'available' | 'sold';
  image?: string;
};

type GridStore = {
  tiles: Tile[];
  selectedTile?: Tile;
  setTiles: (tiles: Tile[]) => void;
  selectTile: (tile: Tile) => void;
  updateTileImage: (x: number, y: number, image: string) => void; // ✅ MUST exist here
};

export const useGridStore = create<GridStore>((set) => ({
  tiles: [],
  selectedTile: undefined,

  setTiles: (tiles) => set({ tiles }),
  selectTile: (tile) => set({ selectedTile: tile }),

  updateTileImage: (x, y, image) =>
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.x === x && t.y === y ? { ...t, image } : t
      ),
    })),
}));
