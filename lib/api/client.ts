/**
 * API Client
 *
 * This is the main API client that automatically switches between
 * mock and real implementations based on configuration.
 *
 * Usage:
 *   import { api } from '@/lib/api/client';
 *   const squares = await api.grid.fetchSquares(0, 10, 0, 10);
 */

import { USE_MOCK_API, logConfigStatus } from '../config/api.config';
import type {
  IGridAPI,
  IReservationAPI,
  IPaymentAPI,
  ICouponAPI,
  IUserAPI,
  IImageAPI,
  IModerationAPI,
  IAnalyticsAPI,
  IEmailAPI,
} from './interfaces';

// Import mock implementations
import { mockGridAPI } from './mock/grid.mock';
import { mockReservationAPI } from './mock/reservation.mock';

// Import real implementations (you will create these)
// import { realGridAPI } from './real/grid.real';
// import { realReservationAPI } from './real/reservation.real';

/**
 * API Client Class
 * Provides access to all API services
 */
class APIClient {
  public grid: IGridAPI;
  public reservation: IReservationAPI;
  // Add other services as needed
  // public payment: IPaymentAPI;
  // public coupon: ICouponAPI;
  // public user: IUserAPI;
  // public image: IImageAPI;
  // public moderation: IModerationAPI;
  // public analytics: IAnalyticsAPI;
  // public email: IEmailAPI;

  constructor() {
    // Log configuration on initialization (browser only)
    if (typeof window !== 'undefined') {
      logConfigStatus();
    }

    // Initialize services based on configuration
    if (USE_MOCK_API) {
      console.log('[API Client] Using MOCK implementations');
      this.grid = mockGridAPI;
      this.reservation = mockReservationAPI;
      // Add mock implementations for other services
    } else {
      console.log('[API Client] Using REAL implementations');
      // TODO: Import and use real implementations
      // this.grid = realGridAPI;
      // this.reservation = realReservationAPI;

      // Fallback to mock if real not implemented
      console.warn('[API Client] Real implementations not yet available, using mock');
      this.grid = mockGridAPI;
      this.reservation = mockReservationAPI;
    }
  }
}

// Export singleton instance
export const api = new APIClient();

// Export for direct access if needed
export { mockGridAPI, mockReservationAPI };
