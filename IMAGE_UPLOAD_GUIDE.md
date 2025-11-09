# Image Upload System Guide

Complete guide for the image upload system with Cloudflare Images integration for 74years.com.

---

## 🎯 Current Implementation (Mock Mode - Testing Phase)

### How It Works Now

In **mock mode**, images are handled completely in-memory:

1. User clicks an available tile
2. File picker opens
3. User selects an image file
4. **Filerobot Image Editor** opens for editing
5. User edits (crop, filter, annotate, etc.)
6. User clicks "Save"
7. Image is uploaded to `/api/upload`
8. **API converts image to base64 data URL** (in-memory)
9. **No files saved to disk** ❌
10. Data URL returned to client
11. Grid displays image via data URL ✅

### Console Output (Mock Mode)

```
[Mock] Image upload - converting to data URL (not saving to disk)
[Mock] Created data URL for tile 0,0 (245.67KB)
```

### Benefits

- ✅ Fast testing without backend setup
- ✅ No disk storage needed
- ✅ No file system permissions required
- ✅ Perfect for development
- ✅ Data URLs work immediately in grid

### Limitations

- ⚠️ Not persistent (lost on page refresh)
- ⚠️ Data URLs are large (~33% larger than binary)
- ⚠️ Not suitable for production
- ⚠️ Images stored in browser memory only

---

## 🚀 Production Mode (Cloudflare Images)

### Why Cloudflare Images?

- ✅ Global CDN (fast worldwide)
- ✅ Automatic optimization
- ✅ Multiple image variants (sizes)
- ✅ WebP/AVIF support
- ✅ Cost-effective
- ✅ No bandwidth charges

### Setup Steps

#### 1. Create Cloudflare Account

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Go to **Images** section
3. Note your **Account ID**
4. Generate **API Token** with Images permissions

#### 2. Configure Environment

Update `.env.local`:

```env
# Switch to real mode
NEXT_PUBLIC_USE_MOCK_API=false

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL=https://imagedelivery.net/your_hash
```

#### 3. Implement Real Upload

Edit [app/api/upload/route.ts](app/api/upload/route.ts), replace the "REAL MODE" section:

```typescript
} else {
  // REAL MODE: Cloudflare Images integration
  const cloudflareFormData = new FormData();
  cloudflareFormData.append('file', file);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: cloudflareFormData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudflare upload failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  imageUrl = data.result.variants[0]; // Full size URL

  console.log(`[Cloudflare] Uploaded image ${data.result.id} for tile ${row},${col}`);
}
```

#### 4. Test Real Upload

```bash
# Set environment
export NEXT_PUBLIC_USE_MOCK_API=false

# Restart server
npm run dev

# Test upload - check console for:
[Cloudflare] Uploaded image abc123 for tile 0,0
```

---

## 📐 System Architecture

```
User Action → Filerobot Editor → Upload API → Mock/Real Mode
                                                     │
                                        ┌────────────┴────────────┐
                                        │                         │
                                    Mock Mode               Real Mode
                                    (Testing)            (Production)
                                        │                         │
                                  Base64 Data URL         Cloudflare CDN
                                        │                         │
                                        └────────────┬────────────┘
                                                     │
                                            Grid Renders Image
```

---

## 🧪 Testing

### Test Mock Mode (Current)

1. Run: `npm run dev`
2. Open: [http://localhost:3000/grid](http://localhost:3000/grid)
3. Click any green tile
4. Select an image
5. Edit in Filerobot
6. Click "Save"
7. Check console:
   ```
   [Mock] Image upload - converting to data URL (not saving to disk)
   [Mock] Created data URL for tile 0,0 (245.67KB)
   ```
8. Verify:
   - ✅ No files in `public/uploads/`
   - ✅ Image displays in grid
   - ✅ Data URL in dev tools

### Test Real Mode (When Ready)

1. Set env vars (see Step 2 above)
2. Restart server
3. Upload image
4. Check console:
   ```
   [Cloudflare] Uploaded image abc123def456 for tile 0,0
   ```
5. Verify:
   - ✅ Image in Cloudflare dashboard
   - ✅ CDN URL returned
   - ✅ Image loads from CDN
   - ✅ No local files

---

## 💰 Cost Estimation (Cloudflare)

| Grid Size | Images | Storage Cost | Bandwidth | Total/Month |
|-----------|--------|--------------|-----------|-------------|
| 100×100 | 10K | $0.50 | Unlimited (free) | ~$0.50 |
| 1000×1000 | 1M | $50 | Unlimited (free) | ~$50 |

---

## 🔧 API Reference

### Upload Endpoint

**POST** `/api/upload`

**Request:**
```typescript
FormData {
  file: File | Blob
  row: string
  col: string
}
```

**Response (Mock):**
```json
{
  "imageUrl": "data:image/png;base64,iVBORw0KGgoA...",
  "row": 0,
  "col": 0,
  "success": true,
  "mode": "mock"
}
```

**Response (Real):**
```json
{
  "imageUrl": "https://imagedelivery.net/abc/def/public",
  "row": 0,
  "col": 0,
  "success": true,
  "mode": "real"
}
```

### Validation

| Rule | Limit | Error |
|------|-------|-------|
| File Size | 10MB max | "File too large" |
| File Type | JPEG, PNG, WebP, GIF | "Invalid file type" |

---

## 🎨 Cloudflare Image Variants

Create optimized sizes for different use cases:

```typescript
// Full size (original quality)
const fullSize = `${CLOUDFLARE_URL}/${imageId}/public`;

// Thumbnail (200x200)
const thumbnail = `${CLOUDFLARE_URL}/${imageId}/thumbnail`;

// Custom variant (800x800 for grid tiles)
const gridTile = `${CLOUDFLARE_URL}/${imageId}/grid-tile`;
```

### Create Custom Variant

1. Cloudflare Dashboard → Images → Variants
2. Click "Create Variant"
3. Name: `grid-tile`
4. Size: 800×800
5. Fit: Cover
6. Format: Auto (WebP/AVIF)
7. Quality: 85

---

## 🔒 Security Checklist

### Current

- ✅ File type validation
- ✅ File size limit (10MB)
- ✅ Mock mode for safe testing

### TODO for Production

- [ ] Rate limiting (uploads per IP/user)
- [ ] Image content moderation (NSFW detection)
- [ ] Virus/malware scanning
- [ ] Authentication before upload
- [ ] CSP headers for image sources
- [ ] CORS configuration
- [ ] Upload audit logging

---

## 🐛 Troubleshooting

### Mock Mode Issues

**Problem:** "Upload failed"
- Check console for error details
- Verify file format (JPEG, PNG, WebP, GIF)
- Check file size (<10MB)

**Problem:** Image not displaying
- Check browser console for errors
- Verify data URL in network tab
- Check Pixi.js texture loading

**Problem:** "Filerobot Save button not working"
- **Symptom**: Save button doesn't respond, editor freezes
- **Cause**: Z-index stacking context issue or incorrect data structure access
- **Fix**: See [FILEROBOT_SAVE_FIX.md](FILEROBOT_SAVE_FIX.md) for complete solution
- **Quick fix**: Reduce z-index values, check for `editedImageObject.imageData.imageBase64`

### Real Mode Issues

**Problem:** "Cloudflare upload failed: 401"
- Verify `CLOUDFLARE_API_TOKEN` is correct
- Check token has Images permissions
- Regenerate token if needed

**Problem:** "Account not found"
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check account has Images enabled

**Problem:** CORS error
- Add Cloudflare domain to CSP
- Configure CORS in Cloudflare dashboard

---

## 📊 Performance

### Grid Optimizations (Already Implemented)

- ✅ **Texture caching**: Each image loads once
- ✅ **Sprite pooling**: Reuses sprite objects
- ✅ **LOD system**: Simplified rendering when zoomed out
- ✅ **Viewport culling**: Only visible tiles rendered

### Best Practices

1. **Image Size**: Cloudflare automatically optimizes
2. **Format**: Use WebP/AVIF (automatic with Cloudflare)
3. **Lazy Loading**: Built into Pixi.js
4. **CDN**: Cloudflare provides global CDN

---

## 📚 Related Documentation

- [Cloudflare Images API](https://developers.cloudflare.com/images/)
- [README.md](README.md) - Main project docs
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Backend integration
- [SELECTION_GUIDE.md](SELECTION_GUIDE.md) - Selection system

---

## ✅ Status

- **Mock Mode**: ✅ Complete (In-Memory, No Disk Storage)
- **Real Mode**: ⏳ Ready for Cloudflare Integration
- **Grid Display**: ✅ Working (Pixi.js with optimizations)

**Next Steps:**
1. Continue testing with mock mode
2. Set up Cloudflare account when ready
3. Implement real upload API
4. Test with Cloudflare CDN
