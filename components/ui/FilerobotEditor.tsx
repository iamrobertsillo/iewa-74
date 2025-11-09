'use client';

import { useEffect, useState } from 'react';

interface FilerobotEditorProps {
  isOpen: boolean;
  selectedTile: { row: number; col: number } | null;
  imageSource: string | null;
  onSave: (editedImageBlob: Blob, row: number, col: number) => Promise<void>;
  onClose: () => void;
}

export function FilerobotEditor({ isOpen, selectedTile, imageSource, onSave, onClose }: FilerobotEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [editorModule, setEditorModule] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);

    // Suppress React warnings from Filerobot's internal components
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('React does not recognize') ||
         args[0].includes('Received `false` for a non-boolean attribute') ||
         args[0].includes('for a non-boolean attribute `active`') ||
         args[0].includes('for a non-boolean attribute `warning`'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    // Dynamically import Filerobot to avoid SSR issues
    import('react-filerobot-image-editor').then((module) => {
      setEditorModule(module);
    });

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isMounted || !isOpen || !selectedTile || !editorModule || !imageSource) {
    console.log('[Filerobot] Not rendering:', { isMounted, isOpen, hasSelectedTile: !!selectedTile, hasEditorModule: !!editorModule, hasImageSource: !!imageSource });
    return null;
  }

  console.log('[Filerobot] Rendering editor for tile:', selectedTile);

  const FilerobotImageEditor = editorModule.default;
  const { TABS, TOOLS } = editorModule;

  const handleSave = async (editedImageObject: any, designState: any) => {
    console.log('[Filerobot] Save button clicked!', {
      editedImageObject,
      hasImageData: !!editedImageObject?.imageData,
      hasImageBase64: !!editedImageObject?.imageData?.imageBase64,
      hasName: !!editedImageObject?.name,
      hasFullName: !!editedImageObject?.fullName,
      selectedTile,
      designState: !!designState
    });

    try {
      let blob: Blob;

      // Check for nested imageData structure (Filerobot v4.x)
      const imageBase64 = editedImageObject?.imageData?.imageBase64 || editedImageObject?.imageBase64;

      if (imageBase64) {
        console.log('[Filerobot] Converting imageBase64 to blob...');
        const response = await fetch(imageBase64);
        blob = await response.blob();
        console.log('[Filerobot] Blob created from base64:', { size: blob.size, type: blob.type });
      } else {
        throw new Error('No imageBase64 data available from Filerobot. editedImageObject structure: ' + JSON.stringify(Object.keys(editedImageObject || {})));
      }

      // Call the onSave callback with the blob
      console.log('[Filerobot] Calling onSave callback...');
      await onSave(blob, selectedTile.row, selectedTile.col);

      console.log('[Filerobot] Save successful, closing editor...');
      // Close the editor
      onClose();
    } catch (error) {
      console.error('[Filerobot] Error saving image:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Header with tile info */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 4,
          zIndex: 1,
          fontSize: 14,
          fontWeight: 'bold',
          pointerEvents: 'none',
        }}
      >
        Editing Image for Tile: Row {selectedTile.row}, Col {selectedTile.col}
      </div>

      <FilerobotImageEditor
        source={imageSource}
        onSave={handleSave}
        onClose={onClose}
        annotationsCommon={{
          fill: '#ff0000',
        }}
        Text={{
          text: 'Add text...',
        }}
        Rotate={{
          angle: 90,
          componentType: 'slider',
        }}
        tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE]}
        defaultTabId={TABS.ANNOTATE}
        defaultToolId={TOOLS.TEXT}
        savingPixelRatio={4}
        previewPixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
        closeAfterSave={true}
        theme={{
          palette: {
            'bg-primary-active': '#1e1e1e',
          },
        }}
      />
    </div>
  );
}
