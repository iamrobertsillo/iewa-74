import { NextRequest, NextResponse } from 'next/server';

// Check if we're in mock mode (no real backend)
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const row = formData.get('row') as string;
    const col = formData.get('col') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    let imageUrl: string;

    if (USE_MOCK_API) {
      // MOCK MODE: Convert image to base64 data URL (no disk storage)
      // This is temporary for testing - in production, upload to Cloudflare Images
      console.log('[Mock] Image upload - converting to data URL (not saving to disk)');

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      imageUrl = `data:${file.type};base64,${base64}`;

      console.log(`[Mock] Created data URL for tile ${row},${col} (${(base64.length / 1024).toFixed(2)}KB)`);
    } else {
      // REAL MODE: This is where you'll integrate Cloudflare Images
      // For now, we'll throw an error as a reminder to implement
      throw new Error('Real image upload not implemented yet. Please integrate Cloudflare Images API.');

      // TODO: Cloudflare Images integration example:
      // const cloudflareFormData = new FormData();
      // cloudflareFormData.append('file', file);
      // const response = await fetch(
      //   `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      //     },
      //     body: cloudflareFormData,
      //   }
      // );
      // const data = await response.json();
      // imageUrl = data.result.variants[0]; // or your preferred variant
    }

    return NextResponse.json({
      imageUrl,
      row: parseInt(row),
      col: parseInt(col),
      success: true,
      mode: USE_MOCK_API ? 'mock' : 'real'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
