'use client';

import React, { useState } from 'react';
import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from 'react-filerobot-image-editor';
import { useGridStore } from './useGridStore';
import { saveTileImage } from './utils/api';


interface TileModalProps {
  tile: { x: number; y: number };
  onClose: () => void;
}

export const TileModal: React.FC<TileModalProps> = ({ tile, onClose }) => {
  const [isEditorShown, setIsEditorShown] = useState(false);
  const { updateTileImage } = useGridStore();

  const openEditor = () => setIsEditorShown(true);
  const closeEditor = () => setIsEditorShown(false);

  const handleSave = async (editedImageObject: any) => {
    const imageBase64 = editedImageObject?.imageBase64;
    if (imageBase64) {
      // Save in Zustand store
      updateTileImage(tile.x, tile.y, imageBase64);

      // Save to backend (currently mocked)
      await saveTileImage(tile.x, tile.y, imageBase64);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      {!isEditorShown ? (
        <div
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3>Tile {tile.x}, {tile.y}</h3>
          <button onClick={openEditor}>Edit / Upload Image</button>
          <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
        </div>
      ) : (
        <FilerobotImageEditor
          source={tile.image || ''}            // the tile’s current image or empty string
          onSave={handleSave}                  // function called when user saves
          onClose={onClose}                    // function called when user closes editor
          savingPixelRatio={1}                 // ✅ required by TypeScript
          previewPixelRatio={1}                // ✅ required by TypeScript
          tabsIds={['Adjust', 'Annotate', 'Watermark']}
          defaultTabId="Annotate"
          defaultToolId="Text"
        />
      )}
    </div>
  );
};
