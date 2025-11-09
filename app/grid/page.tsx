'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Lightbox } from '@/components/ui/Lightbox';
import { SelectionPanel } from '@/components/ui/SelectionPanel';
import { ReservationTimer } from '@/components/ui/ReservationTimer';
import { uploadTileImage } from '@/utils/imageUpload';
import { useSelectionStore } from '@/lib/store/selectionStore';
import { useReservationWarning } from '@/lib/hooks/useReservationWarning';
import type { GridHandle } from '@/components/grid/GridCanvas';

const PixiGridComponent = dynamic(() => import('../../components/grid/GridCanvas'), { ssr: false });
const FilerobotEditor = dynamic(() => import('@/components/ui/FilerobotEditor').then(mod => ({ default: mod.FilerobotEditor })), { ssr: false });

interface TileData {
  sold: boolean;
  imageUrl?: string;
}

export default function Home() {
  const gridRef = useRef<GridHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; row: number; col: number } | null>(null);

  // Selection and reservation state
  const {
    selectedTiles,
    selectRange,
    createReservation,
  } = useSelectionStore();

  // Enable page close warning for active reservations
  useReservationWarning();

  // Handle tile click - differentiate between empty (editor) and filled (lightbox)
  const handleTileClick = (row: number, col: number, tileData?: TileData) => {
    console.log('[Grid] Tile clicked:', { row, col, hasImage: !!tileData?.imageUrl, isEditorOpen });

    // Don't handle clicks if editor is already open
    if (isEditorOpen) {
      console.log('[Grid] Editor is open, ignoring tile click');
      return;
    }

    if (tileData?.imageUrl) {
      // Tile has an image - open lightbox
      console.log('[Grid] Opening lightbox for image');
      setLightboxImage({ url: tileData.imageUrl, row, col });
    } else {
      // Empty tile - prompt for image upload
      console.log('[Grid] Opening file picker for empty tile');
      setSelectedTile({ row, col });
      // Trigger file input
      fileInputRef.current?.click();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    setImageSource(objectUrl);
    setIsEditorOpen(true);

    // Reset file input
    e.target.value = '';
  };

  // Handle image save from Filerobot editor
  const handleImageSave = async (editedImageBlob: Blob, row: number, col: number) => {
    console.log(`[Grid] Saving image for tile ${row},${col}`, {
      blobSize: editedImageBlob.size,
      blobType: editedImageBlob.type
    });

    try {
      // 1. Upload to server
      console.log('[Grid] Uploading to server...');
      const imageUrl = await uploadTileImage(editedImageBlob, row, col);
      console.log('[Grid] Upload successful, imageUrl:', imageUrl.substring(0, 100) + '...');

      // 2. Update grid
      console.log('[Grid] Updating grid with image...');
      gridRef.current?.setTileImage(row, col, imageUrl);
      console.log('[Grid] Grid updated successfully');

      // 3. Clean up and close
      if (imageSource) {
        URL.revokeObjectURL(imageSource);
      }
      setImageSource(null);
      setSelectedTile(null);
      setIsEditorOpen(false);

      console.log('[Grid] Image save complete!');

      // Optional: Save to database
      // await fetch('/api/tiles', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ row, col, imageUrl, sold: true }),
      // });
    } catch (error) {
      console.error('[Grid] Upload error:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleEditorClose = () => {
    // Clean up object URL
    if (imageSource) {
      URL.revokeObjectURL(imageSource);
    }
    setImageSource(null);
    setIsEditorOpen(false);
    setSelectedTile(null);
  };

  // Handle selection changes from grid (drag-to-select)
  const handleSelectionChange = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    selectRange(startRow, startCol, endRow, endCol);
  };

  // Handle reservation creation
  const handleCreateReservation = async () => {
    // TODO: Get actual user ID from authentication
    const userId = 'user_' + Date.now();
    const success = await createReservation(userId);

    if (success) {
      console.log('Reservation created successfully');
    } else {
      alert('Failed to create reservation. Please try again.');
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    // TODO: Navigate to checkout page
    console.log('Proceeding to checkout...');
    alert('Checkout functionality coming soon!');
  };

  // Handle reservation cancellation
  const handleCancelReservation = () => {
    console.log('Reservation cancelled');
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <PixiGridComponent
          ref={gridRef}
          onTileClick={handleTileClick}
          selectedTiles={selectedTiles}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* Selection Panel - shows when tiles are selected */}
      <SelectionPanel onCreateReservation={handleCreateReservation} />

      {/* Reservation Timer - shows when reservation is active */}
      <ReservationTimer
        onCheckout={handleCheckout}
        onCancel={handleCancelReservation}
      />

      <FilerobotEditor
        isOpen={isEditorOpen}
        selectedTile={selectedTile}
        imageSource={imageSource}
        onSave={handleImageSave}
        onClose={handleEditorClose}
      />

      <Lightbox
        imageUrl={lightboxImage?.url || null}
        tileInfo={lightboxImage ? { row: lightboxImage.row, col: lightboxImage.col } : null}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
