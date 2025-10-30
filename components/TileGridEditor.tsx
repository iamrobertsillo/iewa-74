'use client';

import React, { useState, useEffect, useRef } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';

const GRID_SIZE = 100;
const TILE_SIZE = 50;

const TileGridEditor = () => {
  const [tiles, setTiles] = useState({});
  const [selectedTile, setSelectedTile] = useState(null);
  const [isImgEditorShown, setIsImgEditorShown] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Draw the grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = GRID_SIZE * TILE_SIZE;
    const height = GRID_SIZE * TILE_SIZE;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid and images
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const tileKey = `${row}-${col}`;
        
        // Draw tile background
        ctx.fillStyle = tiles[tileKey] ? '#ffffff' : '#f0f0f0';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Draw tile border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw images
    Object.entries(tiles).forEach(([key, imageUrl]) => {
      const [row, col] = key.split('-').map(Number);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
      };
    });
  }, [tiles]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const tileKey = `${row}-${col}`;
      setSelectedTile({ row, col, key: tileKey });
      
      if (tiles[tileKey]) {
        setCurrentImageSrc(tiles[tileKey]);
        setIsImgEditorShown(true);
      } else {
        fileInputRef.current?.click();
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && selectedTile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImageSrc(event.target.result);
        setIsImgEditorShown(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const closeImgEditor = () => {
    setIsImgEditorShown(false);
    setCurrentImageSrc(null);
    setSelectedTile(null);
  };

  const handleSave = (editedImageObject, designState) => {
    console.log('saved', editedImageObject, designState);
    
    if (selectedTile && editedImageObject.imageBase64) {
      setTiles(prev => ({
        ...prev,
        [selectedTile.key]: editedImageObject.imageBase64
      }));
    }
    closeImgEditor();
  };

  return (
    <div className="w-full h-screen bg-gray-100 overflow-hidden">
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">
          100x100 Tile Grid Editor
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Click any tile to upload and edit an image. Tiles with images: {Object.keys(tiles).length}
        </p>
      </div>

      <div className="w-full h-[calc(100vh-100px)] overflow-auto">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{ display: 'block' }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isImgEditorShown && (
        <FilerobotImageEditor
          source={currentImageSrc}
          onSave={handleSave}
          onClose={closeImgEditor}
          annotationsCommon={{
            fill: '#ff0000',
          }}
          Text={{ text: 'Add text...' }}
          Rotate={{ angle: 90, componentType: 'slider' }}
          tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE]}
          defaultTabId={TABS.ADJUST}
          defaultToolId={TOOLS.CROP}
        />
      )}
    </div>
  );
};

export default TileGridEditor;