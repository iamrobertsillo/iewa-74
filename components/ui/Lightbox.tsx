'use client';

import { useEffect } from 'react';

interface LightboxProps {
  imageUrl: string | null;
  tileInfo: { row: number; col: number } | null;
  onClose: () => void;
}

export function Lightbox({ imageUrl, tileInfo, onClose }: LightboxProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (imageUrl) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imageUrl, onClose]);

  if (!imageUrl || !tileInfo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          fontSize: 32,
          width: 50,
          height: 50,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          zIndex: 1001,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        aria-label="Close lightbox"
      >
        ×
      </button>

      {/* Image info */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 'bold',
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      >
        Tile: Row {tileInfo.row}, Col {tileInfo.col}
      </div>

      {/* Image container */}
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
      >
        <img
          src={imageUrl}
          alt={`Tile at row ${tileInfo.row}, col ${tileInfo.col}`}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 4,
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          fontSize: 12,
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      >
        Press ESC or click outside to close
      </div>
    </div>
  );
}
