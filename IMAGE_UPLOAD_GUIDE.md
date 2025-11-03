# Image Upload Implementation Guide

## 🖼️ Adding User-Uploaded Images to Tiles

The grid is **fully optimized and ready** for user-uploaded images. All infrastructure (sprite pooling, texture caching) is already in place.

---

## Quick Implementation

### Step 1: Get the Helper Function

The `setTileImage()` function is already implemented in [GridCanvas.tsx](components/grid/GridCanvas.tsx:94-100).

You need to **expose it** to your parent component or API endpoint.

---

### Step 2: Expose via Props (Recommended)

#### Modify GridCanvas Component:

```typescript
// Add to component props
interface GridCanvasProps {
  onTileImageSet?: (row: number, col: number, imageUrl: string) => void;
}

export default function VirtualizedPixiGrid({ onTileImageSet }: GridCanvasProps) {
  // ... existing code ...

  const setTileImage = useCallback((row: number, col: number, imageUrl: string) => {
    const key = `${row},${col}`;
    setTileData((prev) => {
      const newData = new Map(prev);
      newData.set(key, { sold: true, imageUrl });
      return newData;
    });
    onTileImageSet?.(row, col, imageUrl);
  }, [onTileImageSet]);

  // Expose via useImperativeHandle or return it
  return { /* ... */ };
}
```

---

### Step 3: Alternative - Use via Ref (Simpler)

#### Modify GridCanvas:

```typescript
import { forwardRef, useImperativeHandle } from 'react';

export interface GridHandle {
  setTileImage: (row: number, col: number, imageUrl: string) => void;
  getTileData: () => Map<string, TileData>;
}

const VirtualizedPixiGrid = forwardRef<GridHandle>((props, ref) => {
  // ... existing code ...

  useImperativeHandle(ref, () => ({
    setTileImage,
    getTileData: () => tileData,
  }));

  // ... rest of component
});

export default VirtualizedPixiGrid;
```

#### Use in Parent Component:

```typescript
import { useRef } from 'react';
import VirtualizedPixiGrid, { GridHandle } from './GridCanvas';

export default function GridPage() {
  const gridRef = useRef<GridHandle>(null);

  const handleImageUpload = async (file: File, row: number, col: number) => {
    // 1. Upload image to your server/S3
    const imageUrl = await uploadToServer(file);

    // 2. Set tile image
    gridRef.current?.setTileImage(row, col, imageUrl);
  };

  return (
    <>
      <VirtualizedPixiGrid ref={gridRef} />
      <ImageUploadModal onUpload={handleImageUpload} />
    </>
  );
}
```

---

## Complete Upload Flow Example

### 1. File Upload Component

```typescript
'use client';

import { useState } from 'react';

interface ImageUploadProps {
  onUpload: (file: File, row: number, col: number) => Promise<void>;
  selectedTile: { row: number; col: number } | null;
}

export function ImageUpload({ onUpload, selectedTile }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTile || !e.target.files?.[0]) return;

    setUploading(true);
    try {
      await onUpload(e.target.files[0], selectedTile.row, selectedTile.col);
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 120, right: 20, zIndex: 100 }}>
      {selectedTile && (
        <label style={{
          padding: '10px 20px',
          backgroundColor: '#ff9800',
          color: 'white',
          borderRadius: 4,
          cursor: 'pointer',
        }}>
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}
```

---

### 2. Server-Side Upload (Next.js API Route)

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const row = formData.get('row') as string;
    const col = formData.get('col') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const filename = `tile_${row}_${col}_${Date.now()}.${file.name.split('.').pop()}`;

    // Save to public/uploads directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const path = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(path, buffer);

    // Return public URL
    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({ imageUrl, row, col });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

---

### 3. Client-Side Upload Helper

```typescript
// utils/imageUpload.ts
export async function uploadTileImage(file: File, row: number, col: number): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('row', row.toString());
  formData.append('col', col.toString());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.imageUrl;
}
```

---

### 4. Integrate Everything

```typescript
// app/grid/page.tsx
'use client';

import { useRef, useState } from 'react';
import VirtualizedPixiGrid, { GridHandle } from '@/components/grid/GridCanvas';
import { ImageUpload } from '@/components/ImageUpload';
import { uploadTileImage } from '@/utils/imageUpload';

export default function GridPage() {
  const gridRef = useRef<GridHandle>(null);
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);

  const handleTileClick = (row: number, col: number) => {
    setSelectedTile({ row, col });
  };

  const handleImageUpload = async (file: File, row: number, col: number) => {
    // 1. Upload to server
    const imageUrl = await uploadTileImage(file, row, col);

    // 2. Update grid
    gridRef.current?.setTileImage(row, col, imageUrl);

    // 3. Optional: Save to database
    await fetch('/api/tiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col, imageUrl, sold: true }),
    });
  };

  return (
    <>
      <VirtualizedPixiGrid
        ref={gridRef}
        onTileClick={handleTileClick}
      />
      <ImageUpload
        onUpload={handleImageUpload}
        selectedTile={selectedTile}
      />
    </>
  );
}
```

---

## Performance Considerations

### ✅ Already Optimized:

1. **Texture Caching**: Each unique image loads once, cached globally
2. **Sprite Pooling**: Reuses sprite objects, no garbage collection lag
3. **LOD System**: At extreme zoom-out, images are represented by colored tiles
4. **Viewport Culling**: Only visible image tiles are rendered

### 📝 Best Practices:

1. **Image Size**: Resize images server-side to tile dimensions (e.g., 256×256)
   ```typescript
   // Use Sharp or similar library
   import sharp from 'sharp';

   await sharp(buffer)
     .resize(256, 256, { fit: 'cover' })
     .toFile(outputPath);
   ```

2. **Format**: Use WebP for best compression
   ```typescript
   .webp({ quality: 80 })
   ```

3. **Lazy Loading**: Images are already lazy-loaded via PixiJS Texture.from()

4. **CDN**: Serve images from a CDN for faster loading
   ```typescript
   const cdnUrl = `https://cdn.example.com/tiles/${filename}`;
   ```

---

## Database Schema (Optional)

Store tile data in your database:

```sql
CREATE TABLE tiles (
  id SERIAL PRIMARY KEY,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  image_url TEXT,
  sold BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id),
  UNIQUE(row, col)
);

CREATE INDEX idx_tiles_position ON tiles(row, col);
```

---

## Loading Existing Images on Mount

```typescript
// In GridCanvas component
useEffect(() => {
  const loadExistingTiles = async () => {
    const response = await fetch('/api/tiles');
    const tiles = await response.json();

    setTileData((prev) => {
      const newData = new Map(prev);
      tiles.forEach(({ row, col, imageUrl, sold }) => {
        newData.set(`${row},${col}`, { sold, imageUrl });
      });
      return newData;
    });
  };

  loadExistingTiles();
}, []);
```

---

## Testing the System

### 1. Test with Local Image:

```typescript
// In browser console
const testImage = 'https://picsum.photos/256/256?random=1';
gridRef.current?.setTileImage(5, 5, testImage);
```

### 2. Test Performance:

1. Click "Expand Grid 2x" multiple times (to 10,000+ tiles)
2. Upload images to several tiles
3. Click "Show Stats" - memory should remain low
4. Zoom out - images should render efficiently via LOD

### 3. Stress Test:

```typescript
// Add 1000 random images
for (let i = 0; i < 1000; i++) {
  const row = Math.floor(Math.random() * rows);
  const col = Math.floor(Math.random() * cols);
  const imageUrl = `https://picsum.photos/256/256?random=${i}`;
  gridRef.current?.setTileImage(row, col, imageUrl);
}
```

Should maintain 60 FPS thanks to sprite pooling and texture caching!

---

## 🎉 Summary

Your grid is **production-ready** for image uploads with:
- ✅ Automatic texture caching
- ✅ Sprite pooling (no GC lag)
- ✅ LOD-aware rendering
- ✅ Viewport culling
- ✅ Optimized for thousands of images

Just implement the upload UI and backend, and you're done! 🚀
