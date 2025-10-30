// components/grid/utils/api.ts

// This is a mock API file — replace the fetch URLs later with real endpoints.

export async function fetchGridTiles() {
  const tiles = [];
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      tiles.push({
        x,
        y,
        status: Math.random() > 0.2 ? 'available' : 'sold',
      });
    }
  }
  return { tiles };
}

export async function saveTileImage(x: number, y: number, imageBase64: string) {
  try {
    console.log(`🧩 Saving tile (${x}, ${y}) with image data length: ${imageBase64.length}`);

    // Example call to your backend (replace URL)
    // await fetch(`/api/tiles/${x}-${y}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ imageBase64 }),
    // });

    return { success: true };
  } catch (error) {
    console.error('Error saving tile image:', error);
    return { success: false, error };
  }
}
