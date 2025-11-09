# Integration Guide for 74years.com

This guide explains how to connect the frontend with your backend services (ProcessWire, Cloudflare, Stripe, PayPal).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [API Integration](#api-integration)
4. [Testing with Mocks](#testing-with-mocks)
5. [Switching to Real APIs](#switching-to-real-apis)
6. [Integration Steps](#integration-steps)

---

## Architecture Overview

The application is built with a modular architecture that separates concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (AI)                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │  React     │  │  Next.js   │  │  Pixi.js Grid        │ │
│  │  Components│  │  Pages     │  │  Image Editor        │ │
│  └────────────┘  └────────────┘  └──────────────────────┘ │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           API Client (lib/api/client.ts)             │  │
│  │           Switches between Mock & Real               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ▼
         ┌─────────────────┴─────────────────┐
         │                                     │
    ┌────▼─────┐                         ┌────▼─────┐
    │   MOCK   │                         │   REAL   │
    │   APIs   │                         │   APIs   │
    │(Testing) │                         │ (Prod)   │
    └──────────┘                         └────┬─────┘
                                              │
                    ┌─────────────────────────┼────────────────────────┐
                    │                         │                        │
              ┌─────▼──────┐          ┌──────▼──────┐          ┌──────▼─────┐
              │ ProcessWire│          │ Cloudflare  │          │  Stripe    │
              │   Backend  │          │   Images    │          │  PayPal    │
              └────────────┘          └─────────────┘          └────────────┘
```

---

## Quick Start

### 1. Copy Environment Variables

```bash
cp .env.example .env.local
```

### 2. Configure for Testing (Mock APIs)

```env
# .env.local
NEXT_PUBLIC_USE_MOCK_API=true
```

### 3. Run Development Server

```bash
npm run dev
```

The app will run with **mock APIs** - no backend needed!

---

## API Integration

All API integrations are defined as **TypeScript interfaces** in `lib/api/interfaces.ts`.

### Available API Services

| Service | Interface | Purpose |
|---------|-----------|---------|
| Grid | `IGridAPI` | Fetch and update grid squares |
| Reservation | `IReservationAPI` | Manage square reservations |
| Payment | `IPaymentAPI` | Process payments (Stripe/PayPal) |
| Coupon | `ICouponAPI` | Validate and manage coupons |
| User | `IUserAPI` | User management |
| Image | `IImageAPI` | Upload to Cloudflare Images |
| Moderation | `IModerationAPI` | Admin moderation tools |
| Email | `IEmailAPI` | Send transactional emails |
| Analytics | `IAnalyticsAPI` | Track events |

### Using the API Client

```typescript
import { api } from '@/lib/api/client';

// Fetch squares
const response = await api.grid.fetchSquares(0, 10, 0, 10);

// Create reservation
const reservation = await api.reservation.createReservation(
  ['0,0', '0,1'],
  'user_123'
);
```

---

## Testing with Mocks

The application comes with **complete mock implementations** that simulate backend behavior in-memory.

### Mock Implementations

- ✅ **Grid API** - Stores squares in memory, simulates fetch/update
- ✅ **Reservation API** - Manages reservations with expiration
- ⏳ **Payment API** - TODO (you can add mock)
- ⏳ **Coupon API** - TODO (you can add mock)

### Mock Features

1. **Simulated Network Delay** - Adds realistic latency
2. **In-Memory Storage** - Data persists during session
3. **Validation Logic** - Enforces business rules
4. **Console Logging** - See API calls in console

### Example Mock Data

```typescript
// lib/api/mock/grid.mock.ts initializes with sample data
- 20 random squares with images
- Mix of occupied/available tiles
- Sample image URLs
```

---

## Switching to Real APIs

### Step 1: Create Real Implementation

Create a new file: `lib/api/real/grid.real.ts`

```typescript
import type { IGridAPI } from '../interfaces';
import type { GridSquare, ApiResponse } from '../../types';
import { PROCESSWIRE_CONFIG } from '../../config/api.config';

export class RealGridAPI implements IGridAPI {
  async fetchSquares(
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Promise<ApiResponse<GridSquare[]>> {
    try {
      const response = await fetch(
        `${PROCESSWIRE_CONFIG.apiUrl}/squares?` +
        `startRow=${startRow}&endRow=${endRow}&` +
        `startCol=${startCol}&endCol=${endCol}`,
        {
          headers: {
            'Authorization': `Bearer ${PROCESSWIRE_CONFIG.apiKey}`,
          },
        }
      );

      const data = await response.json();

      return {
        success: true,
        data: data.squares,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Implement other methods...
}

export const realGridAPI = new RealGridAPI();
```

### Step 2: Update API Client

Edit `lib/api/client.ts`:

```typescript
// Import real implementations
import { realGridAPI } from './real/grid.real';

// ...in constructor:
if (USE_MOCK_API) {
  this.grid = mockGridAPI;
} else {
  this.grid = realGridAPI; // Use real implementation
}
```

### Step 3: Configure Environment

```env
# .env.local
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_PROCESSWIRE_API_URL=https://your-backend.com/api
PROCESSWIRE_API_KEY=your_secret_key
```

### Step 4: Test

```bash
npm run dev
```

The app now uses your **real backend**!

---

## Integration Steps

### 1. ProcessWire Backend Setup

#### A. Create API Endpoints in ProcessWire

You need to create these endpoints:

```
GET  /api/squares              - Fetch grid squares
GET  /api/squares/:id          - Fetch single square
POST /api/squares/:id          - Update square
GET  /api/dimensions           - Get grid dimensions

POST /api/reservations         - Create reservation
GET  /api/reservations/:id     - Get reservation
DELETE /api/reservations/:id   - Cancel reservation
POST /api/reservations/:id/extend - Extend reservation
```

#### B. Database Schema in ProcessWire

Create templates/fields for:

**Template: `grid_square`**
- `row` (Integer)
- `col` (Integer)
- `is_occupied` (Checkbox)
- `image_url` (Text)
- `alt_text` (Text)
- `external_link` (URL)
- `owner_id` (Page reference to users)
- `purchase_date` (Datetime)
- `status` (Select: available, reserved, occupied, reported)

**Template: `reservation`**
- `square_ids` (Page reference multiple to grid_squares)
- `user_id` (Page reference to user)
- `created_at` (Datetime)
- `expires_at` (Datetime)
- `edit_state` (Textarea - JSON)
- `status` (Select: active, expired, completed, cancelled)

#### C. Example ProcessWire API Endpoint

```php
// site/templates/api-squares.php
<?php
header('Content-Type: application/json');

// Verify API key
$apiKey = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($apiKey !== 'Bearer ' . $config->apiKey) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get parameters
$startRow = (int)$input->get('startRow', 0);
$endRow = (int)$input->get('endRow', 10);
$startCol = (int)$input->get('startCol', 0);
$endCol = (int)$input->get('endCol', 10);

// Fetch squares
$squares = $pages->find("template=grid_square, " .
    "row>=$startRow, row<$endRow, " .
    "col>=$startCol, col<$endCol");

$result = [];
foreach ($squares as $square) {
    $result[] = [
        'id' => "{$square->row},{$square->col}",
        'row' => $square->row,
        'col' => $square->col,
        'isOccupied' => (bool)$square->is_occupied,
        'imageUrl' => $square->image_url,
        'altText' => $square->alt_text,
        'status' => $square->status,
    ];
}

echo json_encode([
    'success' => true,
    'data' => $result
]);
```

### 2. Cloudflare Images Setup

#### A. Create Cloudflare Account
1. Sign up at cloudflare.com
2. Go to Images section
3. Get your Account ID
4. Generate API Token

#### B. Implement Image Upload

Create `lib/api/real/image.real.ts`:

```typescript
import type { IImageAPI } from '../interfaces';
import { CLOUDFLARE_CONFIG } from '../../config/api.config';

export class RealImageAPI implements IImageAPI {
  async uploadImage(file: File | Blob): Promise<ApiResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: 'Upload failed',
      };
    }

    return {
      success: true,
      data: {
        id: data.result.id,
        url: data.result.variants[0], // Full resolution
      },
    };
  }

  getOptimizedUrl(
    imageId: string,
    width?: number,
    height?: number,
    quality?: number
  ): string {
    let url = `${CLOUDFLARE_CONFIG.imagesUrl}/${imageId}`;

    const params = [];
    if (width) params.push(`w=${width}`);
    if (height) params.push(`h=${height}`);
    if (quality) params.push(`q=${quality}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  }
}
```

### 3. Stripe Payment Setup

#### A. Create Stripe Account
1. Sign up at stripe.com
2. Get API keys from Dashboard

#### B. Create Webhook Endpoint

The app already has webhook route structure at `app/api/webhooks/stripe/route.ts`.

Implement:

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Mark squares as purchased in ProcessWire
      console.log('Payment successful:', session.id);
      break;

    case 'checkout.session.expired':
      // TODO: Release reservation
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
```

### 4. Email Service Setup

Use any email service (SendGrid, Mailgun, Postmark, etc.).

Example with SendGrid:

```typescript
// lib/api/real/email.real.ts
import type { IEmailAPI } from '../interfaces';
import { EMAIL_CONFIG } from '../../config/api.config';

export class RealEmailAPI implements IEmailAPI {
  async sendPurchaseConfirmation(
    email: string,
    purchase: Purchase,
    squares: GridSquare[]
  ): Promise<ApiResponse<void>> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'Your 74years.com Purchase',
        }],
        from: { email: EMAIL_CONFIG.fromEmail },
        content: [{
          type: 'text/html',
          value: `
            <h1>Thank you for your purchase!</h1>
            <p>You have purchased ${squares.length} squares.</p>
            <p>Coordinates: ${squares.map(s => `(${s.row}, ${s.col})`).join(', ')}</p>
          `,
        }],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to send email',
      };
    }

    return { success: true };
  }
}
```

---

## Configuration Checklist

Before going live, ensure:

- [ ] ProcessWire API endpoints created and tested
- [ ] Cloudflare Images account set up
- [ ] Stripe/PayPal accounts configured
- [ ] Webhook endpoints deployed and verified
- [ ] Email service configured and tested
- [ ] Environment variables set in production
- [ ] SSL certificates installed
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Error monitoring set up (Sentry)

---

## Testing Your Integration

### 1. Test with cURL

```bash
# Test ProcessWire API
curl -H "Authorization: Bearer your_api_key" \
  "https://your-backend.com/api/squares?startRow=0&endRow=10&startCol=0&endCol=10"

# Test Cloudflare Images
curl -X POST \
  -H "Authorization: Bearer your_cloudflare_token" \
  -F "file=@test-image.jpg" \
  "https://api.cloudflare.com/client/v4/accounts/your_account_id/images/v1"
```

### 2. Test with Frontend

1. Set `NEXT_PUBLIC_USE_MOCK_API=false`
2. Run dev server
3. Open browser console
4. Watch API calls in Network tab
5. Verify responses match mock format

### 3. Test Webhooks Locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Need Help?

### Common Issues

**Issue**: API calls failing
- Check network tab in browser
- Verify API keys are correct
- Check CORS settings on backend

**Issue**: Images not loading
- Verify Cloudflare Images URL format
- Check image IDs are correct
- Test with direct URL in browser

**Issue**: Webhooks not working
- Verify webhook secret is correct
- Check webhook URL is publicly accessible
- Test with webhook testing tools

---

## Next Steps

1. ✅ Frontend is complete and ready
2. ⏳ Create ProcessWire API endpoints
3. ⏳ Set up Cloudflare Images
4. ⏳ Configure payment gateways
5. ⏳ Set up email service
6. ⏳ Deploy and test end-to-end

**Current Status**: Frontend ready for testing with mocks ✅
