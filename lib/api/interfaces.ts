/**
 * API Interface Definitions
 *
 * These interfaces define the contracts for all backend integrations.
 * Implement these interfaces to connect to your actual backend services.
 */

import type {
  GridSquare,
  Reservation,
  Purchase,
  Coupon,
  User,
  Report,
  ModerationAction,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// ============================================================================
// GRID API
// ============================================================================

export interface IGridAPI {
  /**
   * Fetch grid squares within a viewport
   * @param startRow - Starting row index
   * @param endRow - Ending row index
   * @param startCol - Starting column index
   * @param endCol - Ending column index
   */
  fetchSquares(
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Promise<ApiResponse<GridSquare[]>>;

  /**
   * Fetch a single square by ID
   */
  fetchSquareById(id: string): Promise<ApiResponse<GridSquare>>;

  /**
   * Fetch squares by coordinates
   */
  fetchSquaresByCoordinates(
    row: number,
    col: number,
    range?: number
  ): Promise<ApiResponse<GridSquare[]>>;

  /**
   * Update a square's data
   */
  updateSquare(
    id: string,
    data: Partial<GridSquare>
  ): Promise<ApiResponse<GridSquare>>;

  /**
   * Get grid dimensions
   */
  getGridDimensions(): Promise<ApiResponse<{ rows: number; cols: number }>>;
}

// ============================================================================
// RESERVATION API
// ============================================================================

export interface IReservationAPI {
  /**
   * Create a new reservation
   */
  createReservation(
    squareIds: string[],
    userId: string
  ): Promise<ApiResponse<Reservation>>;

  /**
   * Cancel an existing reservation
   */
  cancelReservation(reservationId: string): Promise<ApiResponse<void>>;

  /**
   * Validate if a reservation is still active
   */
  validateReservation(reservationId: string): Promise<ApiResponse<boolean>>;

  /**
   * Get user's active reservation
   */
  getUserReservation(userId: string): Promise<ApiResponse<Reservation | null>>;

  /**
   * Update reservation edit state
   */
  updateEditState(
    reservationId: string,
    editState: any
  ): Promise<ApiResponse<void>>;

  /**
   * Extend reservation time
   */
  extendReservation(
    reservationId: string,
    additionalMinutes: number
  ): Promise<ApiResponse<Reservation>>;
}

// ============================================================================
// PAYMENT API
// ============================================================================

export interface IPaymentAPI {
  /**
   * Calculate price for squares
   */
  calculatePrice(
    squareIds: string[],
    couponCode?: string
  ): Promise<ApiResponse<{ total: number; discount: number; final: number }>>;

  /**
   * Create Stripe checkout session
   */
  createStripeCheckout(
    purchase: Purchase
  ): Promise<ApiResponse<{ sessionId: string; url: string }>>;

  /**
   * Verify Stripe payment
   */
  verifyStripePayment(sessionId: string): Promise<ApiResponse<boolean>>;

  /**
   * Create PayPal order
   */
  createPayPalOrder(
    purchase: Purchase
  ): Promise<ApiResponse<{ orderId: string; approvalUrl: string }>>;

  /**
   * Capture PayPal order
   */
  capturePayPalOrder(orderId: string): Promise<ApiResponse<boolean>>;

  /**
   * Record a completed purchase
   */
  recordPurchase(purchase: Purchase): Promise<ApiResponse<Purchase>>;
}

// ============================================================================
// COUPON API
// ============================================================================

export interface ICouponAPI {
  /**
   * Validate a coupon code
   */
  validateCoupon(code: string): Promise<ApiResponse<Coupon>>;

  /**
   * Apply a coupon to calculate discount
   */
  applyCoupon(
    code: string,
    amount: number
  ): Promise<ApiResponse<{ discount: number; finalAmount: number }>>;

  /**
   * Create a new coupon (admin)
   */
  createCoupon(coupon: Omit<Coupon, 'usageCount'>): Promise<ApiResponse<Coupon>>;

  /**
   * Update coupon (admin)
   */
  updateCoupon(code: string, data: Partial<Coupon>): Promise<ApiResponse<Coupon>>;

  /**
   * Delete coupon (admin)
   */
  deleteCoupon(code: string): Promise<ApiResponse<void>>;

  /**
   * List all coupons (admin)
   */
  listCoupons(): Promise<ApiResponse<Coupon[]>>;
}

// ============================================================================
// USER API
// ============================================================================

export interface IUserAPI {
  /**
   * Get user by ID
   */
  getUser(userId: string): Promise<ApiResponse<User>>;

  /**
   * Create or update user
   */
  upsertUser(email: string): Promise<ApiResponse<User>>;

  /**
   * Get user's owned squares
   */
  getUserSquares(userId: string): Promise<ApiResponse<GridSquare[]>>;
}

// ============================================================================
// IMAGE API
// ============================================================================

export interface IImageAPI {
  /**
   * Upload image to CDN (Cloudflare Images)
   */
  uploadImage(file: File | Blob): Promise<ApiResponse<{ url: string; id: string }>>;

  /**
   * Delete image from CDN
   */
  deleteImage(imageId: string): Promise<ApiResponse<void>>;

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(
    imageId: string,
    width?: number,
    height?: number,
    quality?: number
  ): string;
}

// ============================================================================
// MODERATION API
// ============================================================================

export interface IModerationAPI {
  /**
   * Get all reported squares
   */
  getReportedSquares(): Promise<ApiResponse<Report[]>>;

  /**
   * Submit a report
   */
  submitReport(
    squareId: string,
    reason: string,
    comments?: string,
    reportedBy?: string
  ): Promise<ApiResponse<Report>>;

  /**
   * Blur a square's image
   */
  blurSquare(squareId: string, reason: string): Promise<ApiResponse<void>>;

  /**
   * Delete square content
   */
  deleteSquareContent(squareId: string, reason: string): Promise<ApiResponse<void>>;

  /**
   * Update square (admin)
   */
  updateSquareAdmin(
    squareId: string,
    data: Partial<GridSquare>
  ): Promise<ApiResponse<GridSquare>>;

  /**
   * Get moderation history
   */
  getModerationHistory(
    squareId: string
  ): Promise<ApiResponse<ModerationAction[]>>;
}

// ============================================================================
// ANALYTICS API
// ============================================================================

export interface IAnalyticsAPI {
  /**
   * Track an event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void;

  /**
   * Track page view
   */
  trackPageView(url: string, title?: string): void;

  /**
   * Track purchase
   */
  trackPurchase(purchase: Purchase): void;
}

// ============================================================================
// EMAIL API
// ============================================================================

export interface IEmailAPI {
  /**
   * Send purchase confirmation email
   */
  sendPurchaseConfirmation(
    email: string,
    purchase: Purchase,
    squares: GridSquare[]
  ): Promise<ApiResponse<void>>;

  /**
   * Send reservation expiring warning
   */
  sendReservationExpiring(
    email: string,
    reservation: Reservation,
    minutesRemaining: number
  ): Promise<ApiResponse<void>>;

  /**
   * Send moderation notification
   */
  sendModerationNotification(
    email: string,
    squareId: string,
    action: string,
    reason: string
  ): Promise<ApiResponse<void>>;
}
