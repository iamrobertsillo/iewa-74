# Selection & Reservation System Guide

Complete guide for the square selection and reservation system implemented in 74years.com.

---

## 🎨 Visual Design

### Tile Colors

| Color | State | Description |
|-------|-------|-------------|
| 🟢 Green | Available | Empty tiles ready for purchase |
| 🟡 Gold | Selected | Tiles in current selection |
| 🟠 Orange | Sold | Tiles purchased (no image yet) |
| 🔵 Blue | With Image | Tiles with uploaded images |

### Selection States

- **No Selection**: Normal grid view
- **Active Selection**: Gold highlight on selected tiles
- **Drag Selection**: Semi-transparent gold rectangle while dragging
- **Reserved**: Selected tiles locked for 3 hours

---

## 🖱️ User Interactions

### 1. Selecting Squares

**Method 1: Shift + Drag (Multi-Select)**
```
1. Hold Shift key
2. Click and drag on grid
3. Release mouse to finalize selection
4. Selection panel appears
```

**Method 2: Single Click**
```
1. Click any available (green) tile
2. File picker opens for image upload
3. (Selection mode requires Shift key)
```

### 2. Selection Panel

Located: **Top-left corner**

Shows:
- ✨ Selection header with instructions
- 📊 Square count
- 💰 Total price (€5 per square)
- 📋 Tile coordinate list (if ≤10 tiles)
- 🔘 "Reserve Squares" button (gold)
- ❌ "Clear Selection" button (red outline)

### 3. Creating Reservation

```typescript
// Flow
User selects tiles → Clicks "Reserve Squares" → API call → Reservation created

// Mock API call (automatic)
const reservation = await api.reservation.createReservation(
  selectedTileIds,  // ['0,0', '0,1', ...]
  userId            // 'user_123'
);

// Response
{
  id: 'res_1234567890_abc123',
  squareIds: ['0,0', '0,1'],
  userId: 'user_123',
  createdAt: Date,
  expiresAt: Date (3 hours later),
  status: 'active'
}
```

### 4. Reservation Timer

Located: **Bottom-center**

#### Normal State (>15 min remaining)
- 🟢 Green border
- Shows: Time left, square count, total price
- Buttons: "Proceed to Checkout", "Cancel"

#### Expiring State (<15 min remaining)
- 🔴 Red border
- ⚠ "Expiring Soon!" badge (pulsing)
- Additional button: "+30 min" to extend

#### Timer Display
```
Format: "2h 45m 30s"  (if hours remaining)
        "14m 52s"     (if only minutes)
        "45s"         (if only seconds)
```

---

## 🔧 Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Grid Page                             │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ SelectionPanel │  │ GridCanvas   │  │  Reservation│ │
│  │                │  │ (Pixi.js)    │  │  Timer      │ │
│  └────────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│           │                 │                   │        │
│           └─────────────────┼───────────────────┘        │
│                             │                            │
│                    ┌────────▼────────┐                   │
│                    │ SelectionStore  │                   │
│                    │   (Zustand)     │                   │
│                    └────────┬────────┘                   │
│                             │                            │
│                    ┌────────▼────────┐                   │
│                    │   Mock API      │                   │
│                    │  (Reservation)  │                   │
│                    └─────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### State Management

**Store**: `lib/store/selectionStore.ts` (Zustand)

```typescript
interface SelectionState {
  // Selection
  selectedTiles: Set<string>;
  isSelecting: boolean;
  selectionStart: { row: number; col: number } | null;

  // Reservation
  activeReservation: Reservation | null;
  reservationTimeLeft: number | null; // milliseconds
  isReservationExpiring: boolean; // true when <15 min

  // Actions
  addTile: (row, col) => void;
  selectRange: (startRow, startCol, endRow, endCol) => void;
  clearSelection: () => void;
  createReservation: (userId) => Promise<boolean>;
  cancelReservation: () => Promise<void>;
  extendReservation: (additionalMinutes) => Promise<void>;
  updateReservationTime: () => void;

  // Computed
  getSelectionCount: () => number;
  getTotalPrice: () => number;
}
```

### Components

#### 1. GridCanvas (components/grid/GridCanvas.tsx)

**Props**:
```typescript
interface GridCanvasProps {
  onTileClick?: (row, col, tileData) => void;
  selectedTiles?: Set<string>;
  onSelectionChange?: (startRow, startCol, endRow, endCol) => void;
}
```

**Selection Rendering**:
- Highlights selected tiles in gold (0xffd700)
- Draws selection rectangle during drag
- Handles Shift + Drag interaction

#### 2. SelectionPanel (components/ui/SelectionPanel.tsx)

**Props**:
```typescript
interface SelectionPanelProps {
  onCreateReservation?: () => void;
}
```

**Behavior**:
- Only renders when `selectedTiles.size > 0`
- Hides when `activeReservation` exists
- Shows tile list if ≤10 selected

#### 3. ReservationTimer (components/ui/ReservationTimer.tsx)

**Props**:
```typescript
interface ReservationTimerProps {
  onCheckout?: () => void;
  onCancel?: () => void;
}
```

**Features**:
- Updates every second via interval
- Changes color based on time left
- Pulse animation when expiring
- Hover effects on buttons

### Hooks

#### useReservationWarning (lib/hooks/useReservationWarning.ts)

```typescript
export function useReservationWarning() {
  const activeReservation = useSelectionStore(state => state.activeReservation);

  useEffect(() => {
    if (!activeReservation) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active reservation...';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeReservation]);
}
```

---

## 🔌 API Integration

### Mock Implementation

**File**: `lib/api/mock/reservation.mock.ts`

```typescript
class MockReservationAPI implements IReservationAPI {
  async createReservation(squareIds: string[], userId: string) {
    // Check for existing reservation
    if (userReservations.has(userId)) {
      return { success: false, error: 'User already has reservation' };
    }

    // Create reservation with 3-hour expiry
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const reservation = { id, squareIds, userId, expiresAt, status: 'active' };

    reservations.set(id, reservation);
    userReservations.set(userId, id);

    return { success: true, data: reservation };
  }

  async extendReservation(reservationId: string, additionalMinutes: number) {
    const reservation = reservations.get(reservationId);
    if (!reservation) return { success: false, error: 'Not found' };

    const newExpiryTime = reservation.expiresAt.getTime() + (additionalMinutes * 60 * 1000);
    reservation.expiresAt = new Date(newExpiryTime);

    return { success: true, data: reservation };
  }

  async cancelReservation(reservationId: string) {
    const reservation = reservations.get(reservationId);
    if (!reservation) return { success: false, error: 'Not found' };

    reservation.status = 'cancelled';
    reservations.delete(reservationId);
    userReservations.delete(reservation.userId);

    return { success: true };
  }
}
```

### Real Implementation (To Be Done)

**File**: `lib/api/real/reservation.real.ts`

```typescript
export class RealReservationAPI implements IReservationAPI {
  async createReservation(squareIds: string[], userId: string) {
    const response = await fetch(
      `${PROCESSWIRE_API_URL}/reservations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ squareIds, userId }),
      }
    );

    const data = await response.json();
    return { success: true, data };
  }

  // ... other methods
}
```

---

## 🧪 Testing

### Manual Testing Flow

1. **Test Selection**
   ```
   ✓ Open http://localhost:3000/grid
   ✓ Hold Shift and drag across tiles
   ✓ Verify gold highlight appears
   ✓ Check selection panel shows correct count
   ```

2. **Test Reservation Creation**
   ```
   ✓ Click "Reserve Squares"
   ✓ Verify timer appears at bottom
   ✓ Check console for API log
   ✓ Verify selection panel disappears
   ```

3. **Test Timer**
   ```
   ✓ Watch countdown update every second
   ✓ Check console logs for timer updates
   ✓ Verify format is correct
   ```

4. **Test Expiration Warning**
   ```
   // Temporarily change expiry to 10 minutes for testing
   ✓ Wait until <15 min (or modify duration)
   ✓ Verify timer turns red
   ✓ Check "+30 min" button appears
   ✓ Confirm pulsing animation
   ```

5. **Test Extension**
   ```
   ✓ Click "+30 min" button
   ✓ Verify API call in console
   ✓ Check timer updates with new time
   ```

6. **Test Cancellation**
   ```
   ✓ Click "Cancel" button
   ✓ Verify timer disappears
   ✓ Check selection is cleared
   ✓ Confirm API call in console
   ```

7. **Test Page Close Warning**
   ```
   ✓ Create reservation
   ✓ Try to close browser tab
   ✓ Verify warning dialog appears
   ✓ Cancel and stay on page
   ```

### Console Logging

Expected logs:
```
[API Client] Using MOCK implementations
[Mock] Created reservation res_1234567890_abc123 for user user_123
[Store] Created reservation res_1234567890_abc123
[Store] Reservation expires in: 2h 59m 45s
[Store] Extended reservation res_1234567890_abc123
[Store] Cancelled reservation res_1234567890_abc123
[Store] Reservation expired
```

---

## 🐛 Troubleshooting

### Selection not working?
- ✓ Hold Shift key while dragging
- ✓ Check browser console for errors
- ✓ Verify Pixi.js is loaded

### Timer not updating?
- ✓ Check if reservation was created successfully
- ✓ Look for console errors
- ✓ Verify interval is running (check browser dev tools)

### Page warning not showing?
- ✓ Ensure reservation is active
- ✓ Check if `useReservationWarning` hook is called
- ✓ Test in different browsers (behavior may vary)

---

## 📝 Configuration

### Timing Settings

**File**: `lib/config/api.config.ts`

```typescript
export const FEATURES = {
  RESERVATION_DURATION: 3 * 60 * 60 * 1000,      // 3 hours
  RESERVATION_WARNING_TIME: 15 * 60 * 1000,     // 15 minutes
  PRICE_PER_SQUARE: 500,                         // €5 in cents
};
```

### Styling

Selection colors in GridCanvas.tsx:
```typescript
const SELECTION_COLOR = 0xffd700;      // Gold
const SELECTION_BORDER = 0xffaa00;    // Orange
const SELECTION_ALPHA = 0.8;          // 80% opacity
```

Timer colors in ReservationTimer.tsx:
```typescript
const NORMAL_COLOR = '#4caf50';       // Green
const EXPIRING_COLOR = '#ff5252';     // Red
```

---

## 🚀 Future Enhancements

Potential improvements for the reservation system:

1. **Persistent Reservations**
   - Save to localStorage
   - Restore on page reload

2. **Server-Side Expiry**
   - WebSocket for real-time updates
   - Server-side expiry check

3. **Multi-User Conflict Resolution**
   - Show other users' selections in different color
   - Lock tiles immediately on selection

4. **Advanced Selection**
   - Rectangle tool (click two corners)
   - Lasso tool (free-form selection)
   - Select by region/pattern

5. **Reservation History**
   - List of past reservations
   - Re-reserve expired selections

6. **Email Notifications**
   - Send reminder at 30 min left
   - Send expiry notification

---

## 📚 Related Documentation

- [README.md](README.md) - Main project documentation
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Backend integration
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Development progress

---

**Status**: Selection & Reservation System Complete ✅
**Next**: Checkout UI Implementation
