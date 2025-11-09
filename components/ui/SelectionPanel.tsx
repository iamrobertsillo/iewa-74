'use client';

import { useSelectionStore, formatPrice } from '@/lib/store/selectionStore';

interface SelectionPanelProps {
  onCreateReservation?: () => void;
}

export function SelectionPanel({ onCreateReservation }: SelectionPanelProps) {
  const {
    selectedTiles,
    activeReservation,
    clearSelection,
    getSelectionCount,
    getTotalPrice,
    getSelectedTileArray,
  } = useSelectionStore();

  const squareCount = getSelectionCount();
  const totalPrice = getTotalPrice();

  // Don't render if no selection or already has reservation
  if (squareCount === 0 || activeReservation) {
    return null;
  }

  const handleReserve = () => {
    if (onCreateReservation) {
      onCreateReservation();
    }
  };

  const handleClear = () => {
    clearSelection();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        minWidth: 280,
        border: '2px solid #ffd700',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 15 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24 }}>✨</span>
          Selection
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Hold Shift + Drag to select multiple squares
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          padding: '15px',
          borderRadius: 8,
          marginBottom: 15,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Squares</div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{squareCount}</div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffd700' }}>
            {formatPrice(totalPrice)}
          </div>
        </div>
      </div>

      {/* Tile list preview (if not too many) */}
      {squareCount <= 10 && (
        <div style={{ marginBottom: 15 }}>
          <div
            style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}
          >
            Selected Tiles:
          </div>
          <div
            style={{
              maxHeight: 120,
              overflowY: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {getSelectedTileArray().map((tileId) => (
              <div key={tileId} style={{ padding: '2px 0' }}>
                {tileId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleReserve}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 'bold',
            backgroundColor: '#ffd700',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffed4e';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffd700';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Reserve Squares
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            backgroundColor: 'transparent',
            color: '#ff5252',
            border: '2px solid #ff5252',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 82, 82, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Clear Selection
        </button>
      </div>

      {/* Info note */}
      <div
        style={{
          marginTop: 15,
          fontSize: 11,
          opacity: 0.6,
          lineHeight: 1.4,
        }}
      >
        💡 Reservations are held for 3 hours. You'll receive a warning 15
        minutes before expiration.
      </div>
    </div>
  );
}
