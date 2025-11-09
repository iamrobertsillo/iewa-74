'use client';

import { useEffect } from 'react';
import { useSelectionStore, formatTimeLeft, formatPrice } from '@/lib/store/selectionStore';

interface ReservationTimerProps {
  onCheckout?: () => void;
  onCancel?: () => void;
}

export function ReservationTimer({ onCheckout, onCancel }: ReservationTimerProps) {
  const {
    activeReservation,
    reservationTimeLeft,
    isReservationExpiring,
    selectedTiles,
    cancelReservation,
    extendReservation,
    getSelectionCount,
    getTotalPrice,
  } = useSelectionStore();

  // Don't render if no active reservation
  if (!activeReservation || reservationTimeLeft === null) {
    return null;
  }

  const handleCancel = async () => {
    await cancelReservation();
    if (onCancel) onCancel();
  };

  const handleExtend = async () => {
    await extendReservation(30); // Extend by 30 minutes
  };

  const handleCheckout = () => {
    if (onCheckout) onCheckout();
  };

  const squareCount = getSelectionCount();
  const totalPrice = getTotalPrice();
  const timeLeftFormatted = formatTimeLeft(reservationTimeLeft);

  // Determine color based on time left
  const timerColor = isReservationExpiring ? '#ff5252' : '#4caf50';
  const backgroundColor = isReservationExpiring
    ? 'rgba(255, 82, 82, 0.1)'
    : 'rgba(76, 175, 80, 0.1)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        minWidth: 400,
        maxWidth: 600,
        border: `2px solid ${timerColor}`,
      }}
    >
      {/* Header with timer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 15,
        }}
      >
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
            Reservation Active
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: timerColor,
              fontFamily: 'monospace',
            }}
          >
            {timeLeftFormatted}
          </div>
        </div>

        {isReservationExpiring && (
          <div
            style={{
              backgroundColor: 'rgba(255, 82, 82, 0.2)',
              color: '#ff5252',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 'bold',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            ⚠ Expiring Soon!
          </div>
        )}
      </div>

      {/* Selection info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 15,
          padding: '12px 15px',
          backgroundColor: backgroundColor,
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Squares Selected</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
            {squareCount}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total Price</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
            {formatPrice(totalPrice)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleCheckout}
          style={{
            flex: 2,
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 'bold',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4caf50';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Proceed to Checkout
        </button>

        {isReservationExpiring && (
          <button
            onClick={handleExtend}
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 'bold',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f57c00';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff9800';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            +30 min
          </button>
        )}

        <button
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: '12px 20px',
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
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Cancel
        </button>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
