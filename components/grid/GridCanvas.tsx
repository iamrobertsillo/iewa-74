'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useGridStore } from './useGridStore';
import { fetchGridTiles } from './utils/api';

const ROWS = 10;
const COLS = 10;

type Tile = {
  x: number;
  y: number;
  status: 'available' | 'sold';
};

export default function GridCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tiles, setTiles, selectTile } = useGridStore();

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [tileSize, setTileSize] = useState(50);
  const [stageScale, setStageScale] = useState(1);

  // 🔹 Measure container size and dynamically set tile size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });

        const tileW = rect.width / COLS;
        const tileH = rect.height / ROWS;
        setTileSize(Math.min(tileW, tileH));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 🔹 Load tiles
  useEffect(() => {
    const loadTiles = async () => {
      const data = await fetchGridTiles();
      const tiles: Tile[] = data.tiles.map(tile => ({
        ...tile,
        status: tile.status as 'available' | 'sold', // cast to match Tile type
      }));
      setTiles(tiles);
    };
    loadTiles();
  }, [setTiles]);

  // 🔹 Bottom-left anchor always
  const stagePosition = {
    x: 0,
    y: containerSize.height - ROWS * tileSize * stageScale,
  };

  // 🔹 Clamp stage position for drag
  const clampPosition = (x: number, y: number) => {
    const scaledWidth = COLS * tileSize * stageScale;
    const scaledHeight = ROWS * tileSize * stageScale;

    // Horizontal limits
    const minX = Math.min(containerSize.width - scaledWidth, 0);
    const maxX = 0;

    // Vertical limits
    const minY = Math.min(containerSize.height - scaledHeight, 0); // top edge
    const maxY = containerSize.height - scaledHeight < 0 ? 0 : containerSize.height - scaledHeight; // bottom edge

    return {
      x: Math.max(Math.min(x, maxX), minX),
      y: Math.max(Math.min(y, maxY), minY),
    };
  };

  // 🔹 Zoom logic — pivot around bottom-left
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    let newScale = e.evt.deltaY > 0 ? stageScale / scaleBy : stageScale * scaleBy;

    // 🔹 Minimum scale: grid height fits container height
    const minScale = containerSize.height / (ROWS * tileSize);

    // Optional: maximum scale
    const maxScale = 5;

    newScale = Math.max(newScale, minScale);
    newScale = Math.min(newScale, maxScale);

    setStageScale(newScale);
  };

  // 🔹 Dragging (only if grid overflows)
  const scaledGridWidth = COLS * tileSize * stageScale;
  const scaledGridHeight = ROWS * tileSize * stageScale;
  const draggable =
    scaledGridWidth > containerSize.width || scaledGridHeight > containerSize.height;

  const handleDragMove = (e: any) => {
    const stage = e.target;
    const pos = clampPosition(stage.x(), stage.y());
    stage.x(pos.x);
    stage.y(pos.y);
  };

  const handleTileClick = (tile: any) => {
    selectTile(tile);
    alert(`Tile clicked: (${tile.x}, ${tile.y})`);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        draggable={draggable}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        style={{ cursor: draggable ? 'grab' : 'default' }}
      >
        <Layer>
          {tiles.map((tile: any) => {
            const flippedY = (ROWS - 1 - tile.y) * tileSize;
            return (
              <React.Fragment key={`${tile.x}-${tile.y}`}>
                <Rect
                  x={tile.x * tileSize}
                  y={flippedY}
                  width={tileSize}
                  height={tileSize}
                  fill={tile.status === 'available' ? '#fafafa' : '#ddd'}
                  stroke="#ccc"
                  onClick={() => handleTileClick(tile)}
                />
                <Text
                  x={tile.x * tileSize + tileSize * 0.25}
                  y={flippedY + tileSize * 0.25}
                  text={`${tile.x},${tile.y}`}
                  fontSize={Math.max(10, tileSize / 4)}
                  fill="#555"
                />
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
