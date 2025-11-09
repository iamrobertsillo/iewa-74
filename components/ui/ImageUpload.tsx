'use client';

import { useState } from 'react';

interface ImageUploadProps {
  onUpload: (file: File, row: number, col: number) => Promise<void>;
  selectedTile: { row: number; col: number } | null;
}

export function ImageUpload({ onUpload, selectedTile }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTile || !e.target.files?.[0]) return;

    const file = e.target.files[0];

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onUpload(file, selectedTile.row, selectedTile.col);
      // Reset file input
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!selectedTile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 120,
        right: 20,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <label
        style={{
          padding: '10px 20px',
          backgroundColor: uploading ? '#999' : '#ff9800',
          color: 'white',
          borderRadius: 4,
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          border: 'none',
          transition: 'background-color 0.2s',
        }}
      >
        {uploading ? 'Uploading...' : `Upload Image for Tile (${selectedTile.row}, ${selectedTile.col})`}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#f44336',
            color: 'white',
            borderRadius: 4,
            fontSize: 12,
            maxWidth: 250,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: 4,
          fontSize: 11,
          maxWidth: 250,
        }}
      >
        Selected: Row {selectedTile.row}, Col {selectedTile.col}
      </div>
    </div>
  );
}
