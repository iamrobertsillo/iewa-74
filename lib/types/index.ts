/**
 * Core Type Definitions for 74years.com
 *
 * These types define the data structures used throughout the application.
 * They serve as the contract between the frontend and backend.
 */

// ============================================================================
// GRID TYPES
// ============================================================================

export interface GridSquare {
  id: string;
  row: number;
  col: number;
  isOccupied: boolean;
  imageUrl?: string;
  altText?: string;
  externalLink?: string;
  ownerId?: string;
  purchaseDate?: Date;
  isAdvertiser?: boolean;
  isReserved?: boolean;
  reservedUntil?: Date;
  reservedBy?: string;
  status: 'available' | 'reserved' | 'occupied' | 'reported';
}

export interface GridSection {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  expansionDate?: Date;
  isAdvertiserSection?: boolean;
}

export interface Viewport {
  centerX: number;
  centerY: number;
  zoom: number;
  visibleSquares: GridSquare[];
}

// ============================================================================
// RESERVATION TYPES
// ============================================================================

export interface Reservation {
  id: string;
  squareIds: string[];
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  editState?: ImageEdit;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
}

export interface ImageEdit {
  imageUrl: string;
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Purchase {
  id?: string;
  squareIds: string[];
  totalAmount: number;
  currency: string;
  couponCode?: string;
  discount?: number;
  finalAmount?: number;
  userId: string;
  paymentMethod: 'stripe' | 'paypal' | 'woocommerce';
  status?: 'pending' | 'completed' | 'failed';
  createdAt?: Date;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  activeReservation?: Reservation;
  ownedSquares: string[];
  createdAt: Date;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface ModerationAction {
  squareId: string;
  action: 'blur' | 'delete' | 'update';
  reason?: string;
  performedBy: string;
  performedAt: Date;
}

export interface Report {
  id: string;
  squareId: string;
  reason: string;
  comments?: string;
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
