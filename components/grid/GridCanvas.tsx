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
  filled?: boolean;
};

export default function GridCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tiles, setTiles, selectTile } = useGridStore();

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [tileSize, setTileSize] = useState(50);
  const [stageScale, setStageScale] = useState(1);
  const [expansionLevel, setExpansionLevel] = useState(0);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

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
      const loadedTiles: Tile[] = data.tiles.map((tile: any) => ({
        ...tile,
        status: tile.status as 'available' | 'sold',
      }));
      setTiles(loadedTiles);
    };
    loadTiles();
  }, [setTiles]);

  // 🔹 Expand grid if 90% filled
  useEffect(() => {
    const filledRatio = tiles.filter(tile => tile.filled).length / tiles.length;

    if (filledRatio >= 0.9) {
      const newCols = COLS * Math.pow(2, expansionLevel + 1);
      const newRows = ROWS * Math.pow(2, expansionLevel + 1);

      const newTiles: Tile[] = [];
      for (let y = 0; y < newRows; y++) {
        for (let x = 0; x < newCols; x++) {
          const existing = tiles.find(t => t.x === x && t.y === y);
          newTiles.push(existing || { x, y, status: 'available', filled: false });
        }
      }

      setTiles(newTiles);
      setExpansionLevel(prev => prev + 1);

      // Reposition stage to keep bottom-left visible
      setStagePos(prev => ({
        x: prev.x,
        y: containerSize.height - newRows * tileSize * stageScale,
      }));
    }
  }, [tiles, expansionLevel, setTiles, containerSize.height, tileSize, stageScale]);

  // 🔹 Compute current grid dimensions
  const gridRows = Math.max(...tiles.map(t => t.y)) + 1;
  const gridCols = Math.max(...tiles.map(t => t.x)) + 1;

  const scaledGridWidth = gridCols * tileSize * stageScale;
  const scaledGridHeight = gridRows * tileSize * stageScale;

  // 🔹 Bottom-left anchor
  const stagePosition = {
    x: 0,
    y: containerSize.height - scaledGridHeight,
  };

  // Initialize stagePos on first render
  useEffect(() => {
    setStagePos(stagePosition);
  }, [containerSize, gridRows, tileSize, stageScale]);

  // 🔹 Minimum and maximum zoom
  const minScale = Math.min(
    containerSize.height / (gridRows * tileSize),
    containerSize.width / (gridCols * tileSize)
  );
  const maxScale = 5;

  // 🔹 Clamp stage position for dragging
  const clampPosition = (x: number, y: number) => {
    const minX = Math.min(containerSize.width - scaledGridWidth, 0);
    const maxX = 0;

    const minY = Math.min(containerSize.height - scaledGridHeight, 0);
    const maxY = containerSize.height - scaledGridHeight < 0 ? 0 : containerSize.height - scaledGridHeight;

    return {
      x: Math.max(Math.min(x, maxX), minX),
      y: Math.max(Math.min(y, maxY), minY),
    };
  };

  // 🔹 Zoom logic
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    let newScale = e.evt.deltaY > 0 ? stageScale / scaleBy : stageScale * scaleBy;
    newScale = Math.max(Math.min(newScale, maxScale), minScale);
    setStageScale(newScale);

    // Recalculate stage position to stay clamped
    setStagePos(clampPosition(stagePos.x, stagePos.y));
  };

  // 🔹 Dragging
  const draggable = scaledGridWidth > containerSize.width || scaledGridHeight > containerSize.height;
  const handleDragMove = (e: any) => {
    const stage = e.target;
    const pos = clampPosition(stage.x(), stage.y());
    stage.x(pos.x);
    stage.y(pos.y);
    setStagePos(pos);
  };

  // 🔹 Lazy render viewport
  const viewport = {
    xStart: Math.max(Math.floor(-stagePos.x / (tileSize * stageScale)), 0),
    xEnd: Math.min(Math.ceil((containerSize.width - stagePos.x) / (tileSize * stageScale)), gridCols),
    yStart: Math.max(Math.floor((scaledGridHeight - containerSize.height + stagePos.y) / (tileSize * stageScale)), 0),
    yEnd: Math.min(
      Math.ceil((scaledGridHeight + stagePos.y) / (tileSize * stageScale)),
      gridRows
    ),
  };

  const handleTileClick = (tile: any) => {
    selectTile(tile);
    alert(`Tile clicked: (${tile.x}, ${tile.y})`);
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', background: '#f5f5f5', overflow: 'hidden' }}
    >
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        draggable={draggable}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        style={{ cursor: draggable ? 'grab' : 'default' }}
      >
        <Layer>
          {tiles
            .filter(tile =>
              tile.x >= viewport.xStart &&
              tile.x < viewport.xEnd &&
              tile.y >= viewport.yStart &&
              tile.y < viewport.yEnd
            )
            .map(tile => {
              const flippedY = (gridRows - 1 - tile.y) * tileSize;
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

      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
        <button
          onClick={() => {
            const tilesCopy = [...tiles];
            const fillCount = Math.floor(tilesCopy.length * 0.9);
            for (let i = 0; i < fillCount; i++) {
              tilesCopy[i].filled = true;
              tilesCopy[i].status = 'sold';
            }
            setTiles(tilesCopy);
          }}
        >
          Fill 90% Tiles
        </button>
      </div>
    </div>
  );
}
